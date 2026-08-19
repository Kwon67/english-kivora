'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useDrag } from '@use-gesture/react'
import { BookOpenCheck, Eye, RotateCcw } from 'lucide-react'
import ReviewLoadingSkeleton from '@/features/review/components/ReviewLoadingSkeleton'
import ReviewSessionDetails from '@/features/review/components/ReviewSessionDetails'
import ReviewSessionHeader from '@/features/review/components/ReviewSessionHeader'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import {
  formatMinutesEstimate,
  scheduleReview,
  toSchedulingState,
} from '@/features/review/lib/learningSteps'
import {
  getReviewQualityBtnClass,
  reviewBreadcrumbClass,
  reviewInnerMax,
  reviewMeaningCard,
  reviewMobileActionRow,
  reviewMobileSwipeHint,
  reviewPhraseTitle,
  reviewPracticePanel,
  reviewPrimaryBtn,
  reviewSessionBanner,
  reviewShell,
  reviewSoftBtn,
  reviewTile,
} from '@/features/review/lib/reviewPageUi'
import { m, AnimatePresence } from 'framer-motion'
import { getDueCards, refreshReviewQueue, submitCardReview } from '@/app/actions'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ReviewModePractice from '@/features/review/components/ReviewModePractice'
import { getReviewModeLabel } from '@/features/review/lib/reviewModes'
import { getPackReviewLabel } from '@/features/cefr/lib/cefrLevels'
import {
  getReviewSwipeVisual,
  resolveReviewSwipeQuality,
  REVIEW_SWIPE_MIN_DISTANCE,
} from '@/features/review/lib/reviewSwipe'
import { notify } from '@/lib/toast'
import { ANALYTICS_EVENT, trackEvent } from '@/lib/analytics'
import type { Card, GameMode, Pack } from '@/types/database.types'

export interface DueCard {
  id: string
  card_id: string
  pack_id: string
  cards: Card & { audio_url?: string | null }
  packs: Pack
  interval_days: number
  ease_factor: number
  repetitions: number
  learning_step?: number | null
  total_reviews?: number
  isNew?: boolean
  weakModes?: GameMode[]
  reviewModes?: GameMode[]
}

interface ReviewStats {
  newCards: number
  learning: number
  review: number
  sessionLimit: number
}

type ReviewLoadStatus = 'ok' | 'timeout' | 'error'

interface ReviewClientProps {
  initialDueCards: DueCard[]
  initialStats: ReviewStats
  packCardsByPackId: Record<string, Card[]>
  sessionTitle?: string
  disableStoredSessionRestore?: boolean
  initialLoadStatus?: ReviewLoadStatus
  loadErrorMessage?: string
}

type ReviewPhase = 'mode' | 'rate'

/**
 * Four grades, matching Anki's Again / Hard / Good / Easy. The old three-button set had no
 * failing grade at all — a card the learner had completely forgotten still advanced — and it
 * mapped "Difícil" onto SM-2's blackout grade. See reviewGrades.ts for the full reasoning.
 */
const qualityButtons = [
  {
    quality: REVIEW_GRADE.AGAIN,
    label: 'Errei',
    shortcut: '1',
  },
  {
    quality: REVIEW_GRADE.HARD,
    label: 'Difícil',
    shortcut: '2',
  },
  {
    quality: REVIEW_GRADE.GOOD,
    label: 'Bom',
    shortcut: '3',
  },
  {
    quality: REVIEW_GRADE.EASY,
    label: 'Fácil',
    shortcut: '4',
  },
] as const

const qualityShortcutMap = new Map<string, number>(
  qualityButtons.map((button) => [button.shortcut, button.quality])
)

function hasActiveTextSelection() {
  if (typeof window === 'undefined') return false
  const selection = window.getSelection()
  return Boolean(selection && selection.toString().trim().length > 0)
}

function isReviewSelectableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('[data-review-selectable]'))
}

const REVIEW_SESSION_STORAGE_KEY = 'kivora_review_session'
const REVIEW_SESSION_TTL_MS = 24 * 60 * 60 * 1000

type StoredReviewSession = {
  packId: string
  remainingCardIds: string[]
  answers: Record<string, boolean>
  startedAt: string
  currentModeIndex?: number
  reviewPhase?: ReviewPhase
}

function readStoredReviewSession() {
  try {
    const raw = localStorage.getItem(REVIEW_SESSION_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredReviewSession> & { currentIndex?: number }
    if (!parsed.packId || !parsed.startedAt) return null

    const remainingCardIds = Array.isArray(parsed.remainingCardIds)
      ? parsed.remainingCardIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : []

    if (remainingCardIds.length === 0) {
      return null
    }
    if (Date.now() - new Date(parsed.startedAt).getTime() > REVIEW_SESSION_TTL_MS) {
      localStorage.removeItem(REVIEW_SESSION_STORAGE_KEY)
      return null
    }

    const reviewPhase: ReviewPhase = parsed.reviewPhase === 'rate' ? 'rate' : 'mode'

    return {
      packId: parsed.packId,
      remainingCardIds,
      answers: parsed.answers ?? {},
      startedAt: parsed.startedAt,
      currentModeIndex: typeof parsed.currentModeIndex === 'number' ? parsed.currentModeIndex : 0,
      reviewPhase,
    }
  } catch {
    localStorage.removeItem(REVIEW_SESSION_STORAGE_KEY)
    return null
  }
}

function writeStoredReviewSession(session: StoredReviewSession) {
  localStorage.setItem(REVIEW_SESSION_STORAGE_KEY, JSON.stringify(session))
}

function clearStoredReviewSession() {
  localStorage.removeItem(REVIEW_SESSION_STORAGE_KEY)
}

function getCardKey(card: DueCard) {
  return card.card_id || card.id
}

function getCardReviewModes(card: DueCard | undefined): GameMode[] {
  if (!card?.reviewModes) return []
  return card.reviewModes
}

/**
 * Every card starts on 'mode': even one with no quiz mode goes through the flashcard flip
 * (front only, "Mostrar resposta" reveals the answer) before the rating buttons appear.
 */
const INITIAL_REVIEW_PHASE: ReviewPhase = 'mode'

function getCardSessionProgress(
  reviewPhase: ReviewPhase,
  currentModeIndex: number,
  modes: GameMode[]
) {
  if (modes.length === 0) return reviewPhase === 'rate' ? 1 : 0
  if (reviewPhase === 'rate') return 1
  return (currentModeIndex + 1) / (modes.length + 1)
}

function getReviewBreadcrumbItems(sessionTitle: string) {
  if (sessionTitle === 'Revisão curta') {
    return [
      { label: 'Início', href: '/home' },
      { label: 'Revisar' },
    ]
  }

  return [
    { label: 'Início', href: '/home' },
    { label: 'Revisar', href: '/review' },
    { label: sessionTitle },
  ]
}

function restoreQueueFromStoredSession(cards: DueCard[], storedSession: StoredReviewSession) {
  const cardMap = new Map(cards.map((card) => [getCardKey(card), card]))
  return storedSession.remainingCardIds
    .map((cardId) => cardMap.get(cardId))
    .filter((card): card is DueCard => Boolean(card))
}

function buildReviewStats(cards: DueCard[], sessionLimit: number): ReviewStats {
  return {
    newCards: cards.filter((card) => card.isNew).length,
    learning: cards.filter((card) => !card.isNew && card.repetitions < 2).length,
    review: cards.filter((card) => !card.isNew && card.repetitions >= 2).length,
    sessionLimit,
  }
}

export default function ReviewClient({
  initialDueCards,
  initialStats,
  packCardsByPackId: initialPackCardsByPackId,
  sessionTitle = 'Revisão curta',
  disableStoredSessionRestore = false,
  initialLoadStatus = 'ok',
  loadErrorMessage,
}: ReviewClientProps) {
  const router = useRouter()
  const [dueCards, setDueCards] = useState<DueCard[]>(initialDueCards)

  function renderWithBackground(children: ReactNode) {
    return (
      <div className={reviewShell}>
        <div className="relative z-10 w-full">{children}</div>
      </div>
    )
  }
  const [packCardsByPackId, setPackCardsByPackId] = useState(initialPackCardsByPackId)
  const [reviewPhase, setReviewPhase] = useState<ReviewPhase>(() =>
    INITIAL_REVIEW_PHASE
  )
  const [currentModeIndex, setCurrentModeIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(
    () => INITIAL_REVIEW_PHASE === 'rate'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(initialDueCards.length)
  const [comboCount, setComboCount] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [stats, setStats] = useState<ReviewStats>(initialStats)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date().toISOString())
  const [pendingStoredSession, setPendingStoredSession] = useState<StoredReviewSession | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const hasCheckedStoredSessionRef = useRef(false)
  const sessionStartCardsRef = useRef(initialDueCards)
  const swipeStartedOnSelectableRef = useRef(false)
  const swipePeakXRef = useRef(0)

  const activeCard = dueCards[0]
  const isShortDailyReview = sessionTitle === 'Revisão curta'
  const activeReviewModes = getCardReviewModes(activeCard)
  const activeReviewMode = activeReviewModes[currentModeIndex] ?? 'flashcard'
  const sessionPackId = dueCards[0]?.pack_id || activeCard?.pack_id || ''
  const sessionProgress = sessionTotal > 0
    ? Math.min(
        100,
        Math.round(
          ((completedCount +
            getCardSessionProgress(reviewPhase, currentModeIndex, activeReviewModes)) /
            sessionTotal) *
            100
        )
      )
    : 0
  const activePackName = activeCard?.packs ? getPackReviewLabel(activeCard.packs.level) : 'Pack de revisão'
  const currentStepLabel =
    reviewPhase === 'rate'
      ? 'Avaliar retenção'
      : `${getReviewModeLabel(activeReviewMode)} · ${currentModeIndex + 1}/${activeReviewModes.length}`
  const reviewSwipeVisual = getReviewSwipeVisual(swipeOffset)
  const activePackCards = activeCard
    ? packCardsByPackId[activeCard.pack_id] || [activeCard.cards]
    : []
  const hasSessionProgress =
    completedCount > 0 ||
    Object.keys(answers).length > 0 ||
    currentModeIndex > 0 ||
    reviewPhase === 'rate'

  const exitToHome = useCallback(() => {
    setShowExitConfirm(false)
    router.push('/home', { transitionTypes: navBackTransitionTypes })
  }, [router])

  const requestExit = useCallback(() => {
    if (!hasSessionProgress) {
      exitToHome()
      return
    }

    if (sessionPackId && dueCards.length > 0) {
      writeStoredReviewSession({
        packId: sessionPackId,
        remainingCardIds: dueCards.map(getCardKey),
        answers,
        startedAt: sessionStartedAt,
        currentModeIndex,
        reviewPhase,
      })
    }

    setShowExitConfirm(true)
  }, [
    answers,
    currentModeIndex,
    dueCards,
    exitToHome,
    hasSessionProgress,
    reviewPhase,
    sessionPackId,
    sessionStartedAt,
  ])

  // Celebration when finished
  useEffect(() => {
    if (dueCards.length === 0 && completedCount > 0) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      import('canvas-confetti').then(({ default: confetti }) => {
        const interval: ReturnType<typeof setInterval> = setInterval(function () {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0) {
            return clearInterval(interval)
          }

          const particleCount = 50 * (timeLeft / duration)
          // since particles fall down, start a bit higher than random
          void confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['rgb(28,25,21)', 'rgb(213,224,107)', 'rgb(244,241,234)', 'rgb(107,101,96)'],
          })
          void confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['rgb(28,25,21)', 'rgb(213,224,107)', 'rgb(244,241,234)', 'rgb(107,101,96)'],
          })
        }, 250)
      })
    }
  }, [dueCards.length, completedCount])

	  useEffect(() => {
	    if (disableStoredSessionRestore) {
	      clearStoredReviewSession()
	      return
	    }

	    if (hasCheckedStoredSessionRef.current || !sessionPackId || dueCards.length === 0) return

	    hasCheckedStoredSessionRef.current = true
	    const storedSession = readStoredReviewSession()
	    if (!storedSession) return

	    const restoredQueue = restoreQueueFromStoredSession(dueCards, storedSession)
	    if (storedSession.packId === sessionPackId && restoredQueue.length > 0 && restoredQueue.length < dueCards.length) {
	      const restorePromptTimer = window.setTimeout(() => setPendingStoredSession(storedSession), 0)
	      return () => window.clearTimeout(restorePromptTimer)
	    }

	    clearStoredReviewSession()
	  }, [disableStoredSessionRestore, dueCards, dueCards.length, sessionPackId])

	  function continueStoredSession() {
	    if (!pendingStoredSession) return

	    const restoredQueue = restoreQueueFromStoredSession(dueCards, pendingStoredSession)
	    setDueCards(restoredQueue)
	    setAnswers(pendingStoredSession.answers)
	    setCompletedCount(Object.values(pendingStoredSession.answers).filter(Boolean).length)
	    setSessionTotal((prev) => Math.max(prev, restoredQueue.length + Object.values(pendingStoredSession.answers).filter(Boolean).length))
	    setSessionStartedAt(pendingStoredSession.startedAt)
	    const restoredCard = restoredQueue[0]
	    const restoredModes = getCardReviewModes(restoredCard)
	    const restoredPhase: ReviewPhase =
	      pendingStoredSession.reviewPhase === 'rate' ? 'rate' : 'mode'
	    setCurrentModeIndex(
	      restoredPhase === 'rate' ? 0 : Math.min(pendingStoredSession.currentModeIndex ?? 0, Math.max(restoredModes.length - 1, 0))
	    )
	    setReviewPhase(restoredPhase)
	    setShowAnswer(restoredPhase === 'rate')
	    setPendingStoredSession(null)
	  }

	  function restartStoredSession() {
	    clearStoredReviewSession()
	    setAnswers({})
	    setCompletedCount(0)
	    setDueCards(sessionStartCardsRef.current)
	    setSessionTotal(sessionStartCardsRef.current.length)
	    setSessionStartedAt(new Date().toISOString())
	    const firstPhase = INITIAL_REVIEW_PHASE
	    setCurrentModeIndex(0)
	    setReviewPhase(firstPhase)
	    setShowAnswer(firstPhase === 'rate')
	    setPendingStoredSession(null)
	  }

	  const loadDueCards = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await getDueCards()
	      const cards = result.dueCards as unknown as DueCard[]
	      setDueCards(cards)
	      sessionStartCardsRef.current = cards
	      setPackCardsByPackId((result.packCardsByPackId || {}) as Record<string, Card[]>)
	      setSessionTotal(cards.length)
	      setCompletedCount(0)
	      setAnswers({})
	      setSessionStartedAt(new Date().toISOString())
	      clearStoredReviewSession()
	      const firstPhase = INITIAL_REVIEW_PHASE
	      setCurrentModeIndex(0)
	      setReviewPhase(firstPhase)
	      setShowAnswer(firstPhase === 'rate')
	      setStats(buildReviewStats(cards, result.sessionLimit || 0))
	      void refreshReviewQueue()
    } catch (error) {
      console.error('Erro ao carregar cards pendentes:', error)
      notify.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleModeComplete = useCallback(() => {
    const modes = getCardReviewModes(activeCard)
    if (currentModeIndex + 1 >= modes.length) {
      setReviewPhase('rate')
      setShowAnswer(true)
      return
    }

    setCurrentModeIndex((prev) => prev + 1)
  }, [activeCard, currentModeIndex])

  const handleReview = useCallback(
    async (quality: number) => {
      if (!activeCard) return

      setIsLoading(true)

      // Combo Logic
      if (quality === 5) {
        setComboCount((prev) => {
          const newCombo = prev + 1
          if (newCombo > maxCombo) setMaxCombo(newCombo)
          return newCombo
        })
      } else {
        setComboCount(0)
      }

      try {
        const cardKey = getCardKey(activeCard)

        const result = await submitCardReview({
          cardId: cardKey,
          packId: activeCard.pack_id,
          quality,
          previousInterval: activeCard.isNew ? undefined : activeCard.interval_days,
          previousEaseFactor: activeCard.isNew ? undefined : activeCard.ease_factor,
          previousRepetitions: activeCard.isNew ? undefined : activeCard.repetitions,
          previousTotalReviews: activeCard.isNew ? 0 : activeCard.total_reviews || 0,
          previousLearningStep: activeCard.isNew ? 0 : activeCard.learning_step ?? null,
          streak: quality === 5 ? comboCount + 1 : 0
        })

        const nextAnswers = {
          ...answers,
          [cardKey]: quality > 0,
        }
        setAnswers(nextAnswers)

        const updatedDifficultCard: DueCard = {
          ...activeCard,
          isNew: false,
          interval_days: result.reviewResult?.intervalDays ?? 1,
          ease_factor:
            result.reviewResult?.easeFactor ?? Math.max(1.3, (activeCard.ease_factor || 2.5) - 0.2),
          repetitions: 0,
          total_reviews: (activeCard.total_reviews || 0) + 1,
        }

        const nextQueue =
          quality === 0
            ? [...dueCards.slice(1), updatedDifficultCard]
            : dueCards.slice(1)

        setDueCards(nextQueue)

        if (quality > 0) {
          setCompletedCount((prev) => prev + 1)
        }

        if (quality > 0 && nextQueue.length === 0) {
          clearStoredReviewSession()
          try {
            await fetch('/api/streak/update', { method: 'POST' })
          } catch (streakError) {
            console.error('Erro ao sincronizar streak diária:', streakError)
          }
          void refreshReviewQueue()
          const trainedCount = completedCount + 1
          trackEvent(ANALYTICS_EVENT.REVIEW_COMPLETED, {
            cards: trainedCount,
            maxCombo,
            sessionTitle,
          })
          notify.success('Revisão de hoje concluída', {
            description: `${trainedCount} frase${trainedCount === 1 ? '' : 's'} treinada${trainedCount === 1 ? '' : 's'}`,
          })
          router.push('/home?reviewComplete=true', { transitionTypes: navBackTransitionTypes })
        } else {
          const nextPhase = INITIAL_REVIEW_PHASE
          if (sessionPackId && nextQueue.length > 0) {
            writeStoredReviewSession({
              packId: sessionPackId,
              remainingCardIds: nextQueue.map(getCardKey),
              answers: nextAnswers,
              startedAt: sessionStartedAt,
              currentModeIndex: 0,
              reviewPhase: nextPhase,
            })
          }
          setCurrentModeIndex(0)
          setReviewPhase(nextPhase)
          setShowAnswer(nextPhase === 'rate')
        }
      } catch (error) {
        console.error('Erro ao enviar revisão:', error)
        notify.error('Verifique os campos')
      } finally {
        setIsLoading(false)
      }
    },
		    [activeCard, answers, completedCount, dueCards, router, comboCount, maxCombo, sessionPackId, sessionStartedAt, sessionTitle]
		  )

  const handleQualityClick = useCallback(
    (quality: number) => {
      if (hasActiveTextSelection()) {
        window.getSelection()?.removeAllRanges()
        return
      }

      void handleReview(quality)
    },
    [handleReview]
  )

  const bindSwipe = useDrag(
    ({ down, last, movement: [movementX, movementY], event, first }) => {
      if (first) {
        swipeStartedOnSelectableRef.current = isReviewSelectableElement(event?.target ?? null)
        swipePeakXRef.current = 0
      }

      const isHorizontalSwipe =
        Math.abs(movementX) >= REVIEW_SWIPE_MIN_DISTANCE &&
        Math.abs(movementX) > Math.abs(movementY) + 8
      const blockForSelectable = swipeStartedOnSelectableRef.current && !isHorizontalSwipe

      if (reviewPhase !== 'rate' || !showAnswer || isLoading || blockForSelectable) {
        if (last) {
          swipeStartedOnSelectableRef.current = false
          swipePeakXRef.current = 0
        }
        setSwipeOffset(0)
        return
      }

      if (down) {
        swipePeakXRef.current = movementX
      }

      const limitedOffset = Math.max(-120, Math.min(120, movementX))
      setSwipeOffset(down ? limitedOffset : 0)

      if (!last) return

      swipeStartedOnSelectableRef.current = false

      if (hasActiveTextSelection()) {
        window.getSelection()?.removeAllRanges()
      }

      const quality = resolveReviewSwipeQuality(swipePeakXRef.current)
      swipePeakXRef.current = 0
      setSwipeOffset(0)

      if (quality === null) return

      void handleQualityClick(quality)
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
    }
  )

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }

      if (reviewPhase !== 'rate') return

      if (event.code === 'Space') {
        event.preventDefault()
        if (showAnswer) return
        setShowAnswer(true)
        return
      }

      if (!showAnswer || isLoading) return

      const quality = qualityShortcutMap.get(event.key)
      if (quality === undefined) return

      event.preventDefault()
      void handleReview(quality)
    }

    window.addEventListener('keydown', handleShortcut)

    return () => {
      window.removeEventListener('keydown', handleShortcut)
    }
  }, [reviewPhase, showAnswer, isLoading, handleReview])

  const reviewBreadcrumbItems = getReviewBreadcrumbItems(sessionTitle)

  if (isLoading && dueCards.length === 0) {
    return <ReviewLoadingSkeleton label="Carregando sessão..." />
  }

  if (initialLoadStatus !== 'ok' && dueCards.length === 0 && completedCount === 0) {
    const isTimeout = initialLoadStatus === 'timeout'

    return renderWithBackground(
      <div className={reviewInnerMax}>
        <StudyBreadcrumb items={reviewBreadcrumbItems} className={reviewBreadcrumbClass} />
        <div className="flex min-h-[70vh] items-center justify-center pb-10">
          <EmptyState
            imageSrc="/images/home/undraw-retention-chamber.svg"
            imageAlt="Ilustração unDraw de erro ao carregar revisão"
            badge="Revisão"
            title={isTimeout ? 'A revisão demorou demais.' : 'Não foi possível carregar a revisão.'}
            variant="glass"
            description={
              isTimeout
                ? 'A conexão ou o servidor demorou para responder. Tente novamente em alguns segundos.'
                : loadErrorMessage || 'Ocorreu um erro ao buscar seus cards. Tente novamente.'
            }
            className="w-full max-w-xl"
          >
            <button type="button" onClick={() => window.location.reload()} className={reviewPrimaryBtn}>
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
              className={reviewSoftBtn}
            >
              Voltar ao início
            </button>
          </EmptyState>
        </div>
      </div>
    )
  }

  if (dueCards.length === 0 && completedCount > 0) {
    return renderWithBackground(
      <div className={reviewInnerMax}>
        <StudyBreadcrumb items={reviewBreadcrumbItems} className={reviewBreadcrumbClass} />
        <div className="flex min-h-[70vh] items-center justify-center pb-10">
          <EmptyState
            imageSrc="/images/home/undraw-celebration.svg"
            imageAlt="Ilustração unDraw de revisão concluída"
            badge="Sessão concluída"
            title="Revisão de hoje concluída."
            description={`Você treinou ${completedCount} frase${completedCount === 1 ? '' : 's'}. O restante fica organizado para os próximos dias.`}
            variant="glass"
            className="w-full max-w-xl"
            imageClassName="max-w-52"
          >
            <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
              <div className={`${reviewTile} p-4 text-center`}>
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">Frases</p>
                <p className="font-heading text-2xl font-bold text-brand-dark">{completedCount}</p>
              </div>
              <div className={`${reviewTile} border-brand-dark bg-brand-accent/40 p-4 text-center`}>
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">Maior combo</p>
                <p className="font-heading text-2xl font-bold text-brand-dark">{maxCombo}x</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
              className={`${reviewPrimaryBtn} mt-8`}
            >
              Voltar ao início
            </button>
          </EmptyState>
        </div>
      </div>
    )
  }

  if (dueCards.length === 0) {
    return renderWithBackground(
      <div className={reviewInnerMax} data-testid="review-page">
        <StudyBreadcrumb items={reviewBreadcrumbItems} className={reviewBreadcrumbClass} />
        <div className="flex min-h-[70vh] items-center justify-center pb-10">
          <EmptyState
            imageSrc="/images/home/undraw-retention-chamber.svg"
            imageAlt="Ilustração unDraw de estudo em dia"
            badge="Revisão em dia"
            title="Tudo em dia."
            description="Você não tem cards para revisar agora. Volte quando a fila encher — ou adicione conteúdo à sua rotina."
            variant="glass"
            className="w-full max-w-xl"
          >
            {/* Was four stacked buttons of near-equal weight. "Explorar packs" lives inside the
                routine page and "Voltar ao início" duplicates the bottom nav, so both go. */}
            <button
              type="button"
              onClick={() => router.push('/study', { transitionTypes: navForwardTransitionTypes })}
              className={reviewPrimaryBtn}
            >
              <BookOpenCheck className="h-4 w-4" strokeWidth={2} />
              Ver rotina
            </button>
            <button type="button" onClick={() => loadDueCards()} className={reviewSoftBtn}>
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              Atualizar
            </button>
          </EmptyState>
        </div>
      </div>
    )
  }

  return renderWithBackground(
    <div className={`${reviewInnerMax} relative space-y-3 pb-6 sm:space-y-4 sm:pb-10`} data-testid="review-page">
      <ReviewSessionHeader
        sessionTitle={sessionTitle}
        completedCount={completedCount}
        sessionTotal={sessionTotal}
        sessionProgress={sessionProgress}
        detailsOpen={showSessionDetails}
        onToggleDetails={() => setShowSessionDetails((open) => !open)}
        onClose={requestExit}
      />

      <ReviewSessionDetails
        isOpen={showSessionDetails}
        isShortDailyReview={isShortDailyReview}
        activePackName={activePackName}
        currentStepLabel={currentStepLabel}
        completedCount={completedCount}
        sessionTotal={sessionTotal}
        sessionProgress={sessionProgress}
        newCards={stats.newCards}
        stats={stats}
        comboCount={comboCount}
        reviewPhase={reviewPhase}
        activeReviewModes={activeReviewModes}
      />

      {pendingStoredSession ? (
        <section className={reviewSessionBanner}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
                Sessão em andamento
              </p>
              <p className="mt-1 font-body text-sm font-semibold leading-snug text-brand-secondary">
                Você ainda tem {pendingStoredSession.remainingCardIds.length} frase{pendingStoredSession.remainingCardIds.length === 1 ? '' : 's'} nessa revisão. Continue de onde parou ou reinicie a rodada.
              </p>
            </div>
            <div className={reviewMobileActionRow}>
              <button type="button" onClick={continueStoredSession} className={`${reviewPrimaryBtn} w-full sm:w-auto`}>
                Continuar sessão
              </button>
              <button type="button" onClick={restartStoredSession} className={`${reviewSoftBtn} w-full sm:w-auto`}>
                Reiniciar
              </button>
            </div>
          </div>
        </section>
      ) : null}

	      <main className="space-y-4">
        <AnimatePresence mode="wait">
		          <m.section
		            key={`${getCardKey(activeCard)}-${reviewPhase}-${currentModeIndex}`}
	            initial={{ opacity: 0, y: 20, scale: 0.98 }}
	            animate={{ opacity: 1, y: 0, scale: 1 }}
	            exit={{ opacity: 0, y: -20, scale: 0.98 }}
	            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
		            className={`${reviewPracticePanel} ${comboCount >= 3 ? 'animate-ai-glow' : ''}`}
	          >
	            <div
	              className={`pointer-events-none absolute inset-0 transition-colors duration-150 ${
	                reviewSwipeVisual === 'easy'
	                  ? 'bg-brand-accent/35'
	                  : reviewSwipeVisual === 'hard'
	                    ? 'bg-red-500/10'
	                    : reviewSwipeVisual === 'good'
	                      ? 'bg-brand-dark/5'
	                      : 'bg-transparent'
	              }`}
	            />
              {activeCard.weakModes && activeCard.weakModes.length > 0 ? (
                <p className="mb-3 font-body text-xs font-semibold text-brand-secondary">
                  Reforço em {activeCard.weakModes.length} {activeCard.weakModes.length === 1 ? 'modo' : 'modos'}
                </p>
              ) : null}

              {reviewPhase === 'mode' ? (
                <ReviewModePractice
                  mode={activeReviewMode}
                  card={activeCard.cards}
                  packCards={activePackCards}
                  onComplete={handleModeComplete}
                />
              ) : (
	            <div
                {...bindSwipe()}
                className="relative flex min-h-0 flex-col"
                style={{ touchAction: 'pan-y' }}
              >
              <div className="flex flex-1 flex-col justify-start py-4 text-center sm:py-5">
                <div className="space-y-3 sm:space-y-4">
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary opacity-80">Avaliar retenção</p>
                  <h2 className={reviewPhraseTitle}>
                    {activeCard.cards.english_phrase}
                  </h2>
                </div>

                {showAnswer ? (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-review-selectable
                    className={`${reviewMeaningCard} mt-4`}
                  >
                    <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary">
                      Significado
                    </p>
                    <p className="mt-1.5 cursor-text font-body text-base font-semibold leading-relaxed text-brand-secondary sm:text-lg">
                      {activeCard.cards.portuguese_translation}
                    </p>
                  </m.div>
                ) : (
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className={`${reviewPrimaryBtn} mx-auto mt-4`}
                  >
                    <Eye className="h-4 w-4" strokeWidth={2} />
                    Mostrar resposta
                  </m.button>
                )}
              </div>

              {showAnswer ? (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 grid grid-cols-2 gap-2 border-t border-brand-dark/15 pt-3 sm:mt-4 sm:grid-cols-4 sm:gap-3 sm:pt-4"
                >
                  {qualityButtons.map((button) => {
                    const estimate = formatMinutesEstimate(
                      scheduleReview(button.quality, toSchedulingState(activeCard)).intervalMinutes,
                    )

                    return (
                      <m.button
                        key={button.quality}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onMouseDown={(event) => {
                          if (hasActiveTextSelection()) {
                            event.preventDefault()
                          }
                        }}
                        onClick={() => handleQualityClick(button.quality)}
                        disabled={isLoading}
                        className={getReviewQualityBtnClass(button.quality)}
                      >
                        <span className="hidden rounded-[0.55rem] border border-current/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] opacity-75 sm:inline">
                          {button.shortcut}
                        </span>
                        <span className="text-sm font-bold sm:text-base">
                          {button.label}
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wide sm:text-[10px] ${
                            button.quality === 5
                              ? 'text-white/70'
                              : 'text-brand-secondary opacity-80'
                          }`}
                        >
                          {estimate}
                        </span>
                      </m.button>
                    )
                  })}
                  <p className={`${reviewMobileSwipeHint} col-span-2 mt-1 sm:col-span-4`}>
                    Deslize ← errei · centro bom · fácil →
                  </p>
                </m.div>
              ) : null}
            </div>
              )}
          </m.section>
        </AnimatePresence>
      </main>

      {showExitConfirm ? (
        <ConfirmDialog
          title="Sair da revisão?"
          description="Sua sessão fica salva por hoje. Quando voltar, você poderá continuar de onde parou."
          confirmLabel="Sair para início"
          cancelLabel="Continuar revisando"
          variant="warning"
          onConfirm={exitToHome}
          onCancel={() => setShowExitConfirm(false)}
        />
      ) : null}
    </div>
  )
}
