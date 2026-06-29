'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useDrag } from '@use-gesture/react'
import {
  Brain,
  RotateCcw,
  X,
  BookOpenCheck,
  CalendarClock,
  Layers,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { getDueCards, refreshReviewQueue, submitCardReview } from '@/app/actions'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import AudioButton from '@/components/ui/AudioButton'
import FocusModePlayer from '@/features/game/components/FocusModePlayer'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import EmptyState from '@/components/ui/EmptyState'
import ReviewModePractice from '@/features/review/components/ReviewModePractice'
import { getReviewModeLabel, NORMAL_REVIEW_MODES } from '@/features/review/lib/reviewModes'
import { notify } from '@/lib/toast'
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

const qualityButtons = [
  {
    quality: 0,
    label: 'Difícil',
    shortcut: '1',
  },
  {
    quality: 3,
    label: 'Bom',
    shortcut: '2',
  },
  {
    quality: 5,
    label: 'Fácil',
    shortcut: '3',
  },
] as const

const qualityShortcutMap = new Map<string, number>(
  qualityButtons.map((button) => [button.shortcut, button.quality])
)

function getReviewIntervalEstimate(card: DueCard, quality: number) {
  if (quality === 0) return '1 min'
  if (quality === 3) {
    return card.isNew
      ? '1 dia'
      : `${Math.round(Math.max(1, card.interval_days) * card.ease_factor)} dias`
  }
  if (quality === 5) {
    return card.isNew
      ? '4 dias'
      : `${Math.round(Math.max(1, card.interval_days) * card.ease_factor * 1.5)} dias`
  }
  return ''
}

function getReviewButtonClass(quality: number) {
  if (quality === 0) {
    return 'bg-bg-card text-brand-dark border-brand-dark hover:bg-bg-primary active:bg-bg-primary'
  }
  if (quality === 3) {
    return 'bg-bg-card text-brand-dark border-brand-dark hover:bg-brand-accent active:bg-brand-accent'
  }
  return 'bg-brand-dark text-white border-brand-dark shadow-[3px_3px_0_var(--color-brand-accent)] active:brightness-95'
}

const reviewPanel =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)]'
const reviewTile =
  'rounded-xl border-2 border-brand-dark bg-bg-card shadow-[4px_4px_0_var(--color-brand-dark)]'
const reviewSoftButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-5 py-3 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white'
const reviewPrimaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-5 py-3 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px]'
const reviewKicker =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
const reviewPill =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark'

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

    return {
      packId: parsed.packId,
      remainingCardIds,
      answers: parsed.answers ?? {},
      startedAt: parsed.startedAt,
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

function getCardStageLabel(card: DueCard) {
  if (card.isNew) return 'Carta nova'
  if (card.repetitions <= 0) return 'Em revisão'
  return `Revisão ${card.repetitions}`
}

function getCardKey(card: DueCard) {
  return card.card_id || card.id
}

function getCardReviewModes(card: DueCard | undefined): GameMode[] {
  if (!card) return [...NORMAL_REVIEW_MODES]
  return card.reviewModes && card.reviewModes.length > 0
    ? card.reviewModes
    : [...NORMAL_REVIEW_MODES]
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
      <div className="home-mobile-optimized landing-light relative -mx-4 -my-6 min-h-[calc(100vh-5rem)] min-h-[calc(100svh-5rem)] overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark transition-colors duration-300 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
        <div className="relative z-10 w-full">
          {children}
        </div>
      </div>
    )
  }
  const [packCardsByPackId, setPackCardsByPackId] = useState(initialPackCardsByPackId)
  const [reviewPhase, setReviewPhase] = useState<ReviewPhase>('mode')
  const [currentModeIndex, setCurrentModeIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(initialDueCards.length)
  const [comboCount, setComboCount] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [comboMessage, setComboMessage] = useState<string | null>(null)
  const [stats, setStats] = useState<ReviewStats>(initialStats)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date().toISOString())
  const [pendingStoredSession, setPendingStoredSession] = useState<StoredReviewSession | null>(null)
  const hasCheckedStoredSessionRef = useRef(false)
  const sessionStartCardsRef = useRef(initialDueCards)
  const swipeStartedOnSelectableRef = useRef(false)

  const activeCard = dueCards[0]
  const isShortDailyReview = sessionTitle === 'Revisão curta'
  const activeReviewModes = getCardReviewModes(activeCard)
  const activeReviewMode = activeReviewModes[currentModeIndex] ?? 'flashcard'
  const sessionPackId = dueCards[0]?.pack_id || activeCard?.pack_id || ''
  const sessionProgress = sessionTotal > 0
    ? Math.min(
        100,
        Math.round(
          ((completedCount + (reviewPhase === 'rate' ? 0.35 : currentModeIndex / Math.max(activeReviewModes.length, 1) * 0.35)) /
            sessionTotal) *
            100
        )
      )
    : 0
  const activePackName = activeCard?.packs?.name || 'Pack de revisão'
  const currentStepLabel =
    reviewPhase === 'rate'
      ? 'Avaliar retenção'
      : `${getReviewModeLabel(activeReviewMode)} · ${currentModeIndex + 1}/${activeReviewModes.length}`
  const activePackCards = activeCard
    ? packCardsByPackId[activeCard.pack_id] || [activeCard.cards]
    : []

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
	    setCurrentModeIndex(pendingStoredSession.currentModeIndex ?? 0)
	    setReviewPhase(pendingStoredSession.reviewPhase ?? 'mode')
	    setShowAnswer(pendingStoredSession.reviewPhase === 'rate')
	    setPendingStoredSession(null)
	  }

	  function restartStoredSession() {
	    clearStoredReviewSession()
	    setAnswers({})
	    setCompletedCount(0)
	    setDueCards(sessionStartCardsRef.current)
	    setSessionTotal(sessionStartCardsRef.current.length)
	    setSessionStartedAt(new Date().toISOString())
	    setCurrentModeIndex(0)
	    setReviewPhase('mode')
	    setShowAnswer(false)
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
	      setCurrentModeIndex(0)
	      setReviewPhase('mode')
	      setShowAnswer(false)
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setCurrentModeIndex((prev) => prev + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          
          if (newCombo === 5) setComboMessage("DOMINANDO! 5x")
          else if (newCombo === 10) setComboMessage("ON FIRE! 10x 🔥")
          else if (newCombo === 15) setComboMessage("IMBATÍVEL! 15x 👑")
          else if (newCombo === 20) setComboMessage("LENDA DO INGLÊS! 20x 💎")
          else if (newCombo > 0 && newCombo % 5 === 0) setComboMessage(`${newCombo}x Combo!`)
          
          return newCombo
        })
        setTimeout(() => setComboMessage(null), 2000)
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
          notify.success(`Revisão de hoje concluída. ${completedCount + 1} frases treinadas.`)
          router.push('/home?reviewComplete=true', { transitionTypes: navBackTransitionTypes })
        } else {
          if (sessionPackId && nextQueue.length > 0) {
            writeStoredReviewSession({
              packId: sessionPackId,
              remainingCardIds: nextQueue.map(getCardKey),
              answers: nextAnswers,
              startedAt: sessionStartedAt,
              currentModeIndex: 0,
              reviewPhase: 'mode',
            })
          }
          setCurrentModeIndex(0)
          setReviewPhase('mode')
          setShowAnswer(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } catch (error) {
        console.error('Erro ao enviar revisão:', error)
        notify.error('Verifique os campos')
      } finally {
        setIsLoading(false)
      }
    },
		    [activeCard, answers, completedCount, dueCards, router, comboCount, maxCombo, sessionPackId, sessionStartedAt]
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
	    ({ down, last, movement: [movementX], event, first }) => {
	      if (first) {
	        swipeStartedOnSelectableRef.current = isReviewSelectableElement(event?.target ?? null)
	      }

	      if (reviewPhase !== 'rate' || !showAnswer || isLoading || swipeStartedOnSelectableRef.current) {
	        if (last) {
	          swipeStartedOnSelectableRef.current = false
	        }
	        setSwipeOffset(0)
	        return
	      }

	      const limitedOffset = Math.max(-120, Math.min(120, movementX))
	      setSwipeOffset(down ? limitedOffset : 0)

	      if (!last) return

	      if (hasActiveTextSelection()) {
	        setSwipeOffset(0)
	        return
	      }

	      if (movementX > 80) {
	        void handleReview(3)
	      } else if (movementX < -80) {
	        void handleReview(0)
	      }
	    },
	    {
	      axis: 'x',
	      filterTaps: true,
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
    return renderWithBackground(
      <div className="mx-auto max-w-6xl px-4">
        <StudyBreadcrumb items={reviewBreadcrumbItems} className="mb-6" />
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <div className={`${reviewPanel} w-full max-w-lg overflow-hidden text-center`}>
          <div className="border-b-2 border-brand-dark bg-bg-primary p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Brain className="h-8 w-8 animate-pulse" strokeWidth={1.8} />
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <p className={reviewKicker}>Revisão</p>
            <h2 className="mt-4 font-heading text-3xl font-bold text-brand-dark">Carregando sessão</h2>
            <p className="mx-auto mt-3 max-w-sm font-body text-sm leading-relaxed text-brand-secondary">
              Preparando seus cards e áudio para uma rodada mais focada.
            </p>
          </div>
        </div>
      </div>
      </div>
    )
  }

  if (initialLoadStatus !== 'ok' && dueCards.length === 0 && completedCount === 0) {
    const isTimeout = initialLoadStatus === 'timeout'

    return renderWithBackground(
      <div className="mx-auto max-w-6xl px-4">
        <StudyBreadcrumb items={reviewBreadcrumbItems} className="mb-6" />
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <EmptyState
          imageSrc="/images/home/undraw-online-learning.svg"
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
          <button type="button" onClick={() => window.location.reload()} className={reviewPrimaryButton}>
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
            className={reviewSoftButton}
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
      <div className="mx-auto max-w-6xl px-4">
        <StudyBreadcrumb items={reviewBreadcrumbItems} className="mb-6" />
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <EmptyState
          imageSrc="/images/home/undraw-online-learning.svg"
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
            <div className={`${reviewTile} bg-brand-accent p-4 text-center`}>
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">Maior Combo</p>
              <p className="font-heading text-2xl font-bold text-brand-dark">{maxCombo}x</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
            className={`${reviewPrimaryButton} mt-8`}
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
      <div className="mx-auto max-w-6xl px-4" data-testid="review-page">
        <StudyBreadcrumb items={reviewBreadcrumbItems} className="mb-6" />
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <EmptyState
          imageSrc="/images/home/undraw-studying.svg"
          imageAlt="Ilustração unDraw de estudo concluído"
          badge="Revisão"
          title="Tudo em dia."
          description="Você não tem cards para revisar agora. O sistema está limpo e pronto para a próxima rodada."
          variant="glass"
          className="w-full max-w-xl"
        >
          <button
            type="button"
            onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
            className={reviewPrimaryButton}
          >
            Voltar ao início
          </button>
          <button
            type="button"
            onClick={() => router.push('/explore', { transitionTypes: navForwardTransitionTypes })}
            className={reviewSoftButton}
          >
            Explorar packs
          </button>
          <button type="button" onClick={() => loadDueCards()} className={reviewSoftButton}>
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Atualizar
          </button>
        </EmptyState>
      </div>
      </div>
    )
  }

  return renderWithBackground(
    <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-5 lg:px-6 relative" data-testid="review-page">
      <StudyBreadcrumb items={reviewBreadcrumbItems} className="mb-4" />
      {/* Combo Counter Overlay - Moved to bottom right to avoid blocking top buttons */}
      <AnimatePresence>
        {comboCount >= 2 && (
          <m.div
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            className="fixed bottom-[var(--app-floating-offset)] right-4 z-[60] flex flex-col items-end gap-1 pointer-events-none md:bottom-6 md:right-6"
          >
            <div className="flex items-center gap-2 rounded-[0.9rem] bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-2 text-white shadow-[0_8px_32px_rgba(245,158,11,0.3)] border border-white/20">
              <span className="text-[10px] font-black uppercase tracking-tighter opacity-80 text-white">Streak</span>
              <span className="text-xl font-black italic text-white">{comboCount}x</span>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Dynamic Combo Message Overlay */}
      <AnimatePresence>
        {comboMessage && (
          <m.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1.1 }}
            exit={{ opacity: 0, y: -50, scale: 1.2 }}
            className="fixed left-0 right-0 top-1/2 z-[60] flex justify-center pointer-events-none"
          >
            <span className="bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-4xl font-black italic text-transparent drop-shadow-2xl sm:text-6xl uppercase tracking-tighter text-center px-4">
              {comboMessage}
            </span>
          </m.div>
        )}
      </AnimatePresence>

      <header className="mb-4">
        <div className={`${reviewPanel} overflow-hidden`}>
          <div className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={reviewKicker}>{isShortDailyReview ? 'Sessão de hoje' : 'Sessão de revisão'}</p>
                <h1 className="mt-3 font-heading text-2xl font-bold leading-tight text-brand-dark">
                  {sessionTitle}
                </h1>
                <p className="mt-1.5 font-body text-sm font-medium leading-relaxed text-brand-secondary">
                  {isShortDailyReview
                    ? 'Até 10 frases hoje. Escute, fale e escreva sem pressa.'
                    : `${activePackName} · ${currentStepLabel}`}
                </p>
                {isShortDailyReview ? (
                  <p className="mt-1 font-body text-xs font-semibold leading-relaxed text-brand-secondary">
                    {activePackName} · {currentStepLabel}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <FocusModePlayer />
                <button
                  type="button"
                  onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-brand-dark bg-bg-card text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
                  aria-label="Fechar revisão"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                  Progresso
                </span>
                <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
                  Frase {completedCount + 1} / {sessionTotal}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-brand-border">
                <div
	                  className="h-full rounded-full bg-brand-dark transition-all duration-300 ease-out"
                  style={{ width: `${sessionProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
	      </header>

	      {pendingStoredSession && (
	        <section className="mb-4 rounded-xl border-2 border-brand-dark bg-brand-accent px-4 py-3 font-body text-sm text-brand-dark shadow-[4px_4px_0_var(--color-brand-dark)]">
	          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	            <p className="font-semibold">Você tem uma sessão em andamento. Continuar de onde parou?</p>
	            <div className="flex gap-2">
	              <button
	                type="button"
	                onClick={continueStoredSession}
	                className="rounded-lg border-2 border-brand-dark bg-brand-dark px-3 py-2 font-body text-xs font-semibold text-white transition-all duration-150 active:scale-95"
	              >
	                Continuar
	              </button>
	              <button
	                type="button"
	                onClick={restartStoredSession}
	                className="rounded-lg border-2 border-brand-dark bg-bg-card px-3 py-2 font-body text-xs font-semibold text-brand-dark transition-all duration-150 hover:bg-bg-primary active:scale-95"
	              >
	                Começar do zero
	              </button>
	            </div>
	          </div>
	        </section>
	      )}

	      <main className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
        <AnimatePresence mode="wait">
		          <m.section
		            key={`${getCardKey(activeCard)}-${reviewPhase}-${currentModeIndex}`}
	            initial={{ opacity: 0, y: 20, scale: 0.98 }}
	            animate={{ opacity: 1, y: 0, scale: 1 }}
	            exit={{ opacity: 0, y: -20, scale: 0.98 }}
	            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
		            className={`${reviewPanel} relative overflow-hidden p-4 sm:p-5 lg:p-6 ${
	              comboCount >= 3 ? 'animate-ai-glow' : ''
	            }`}
	          >
	            <div
	              className={`pointer-events-none absolute inset-0 transition-colors duration-150 ${
	                swipeOffset > 12
	                  ? 'bg-brand-accent/30'
	                  : swipeOffset < -12
	                    ? 'bg-red-500/10'
	                    : 'bg-transparent'
	              }`}
	            />
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={reviewPill}>
                  {getCardStageLabel(activeCard)}
                </span>
                <span className={reviewPill}>
                  {activeCard.packs?.name || 'Pack'}
                </span>
                {activeCard.weakModes && activeCard.weakModes.length > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
                    Reforço em {activeCard.weakModes.length} {activeCard.weakModes.length === 1 ? 'modo' : 'modos'}
                  </span>
                ) : null}
              </div>

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
              <div className="flex items-start justify-between gap-3">
                {activeCard.cards.audio_url ? (
                  <AudioButton
                    url={activeCard.cards.audio_url}
                    autoPlay={true}
                    className="!mt-0 shrink-0"
                  />
                ) : (
                  <span />
                )}
              </div>

              <div className="flex flex-1 flex-col justify-start py-4 text-center sm:py-5">
                <div className="space-y-3 sm:space-y-4">
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary opacity-80">Avaliar retenção</p>
                  <h2 className="mx-auto max-w-[16ch] text-balance font-heading text-3xl font-bold leading-tight text-brand-dark sm:text-5xl">
                    {activeCard.cards.english_phrase}
                  </h2>
                </div>

                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  data-review-selectable
                  className="mx-auto mt-4 w-full max-w-xl select-text rounded-xl border-2 border-brand-dark bg-bg-primary px-4 py-3 text-left shadow-[4px_4px_0_var(--color-brand-dark)] sm:px-6 sm:py-4"
                >
                  <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary">
                    Significado
                  </p>
                  <p className="mt-1.5 cursor-text font-body text-base font-semibold leading-relaxed text-brand-secondary sm:text-lg">
                    {activeCard.cards.portuguese_translation}
                  </p>
                </m.div>
              </div>

              {showAnswer ? (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 grid grid-cols-3 gap-2 border-t-2 border-brand-dark pt-3 sm:mt-4 sm:gap-3 sm:pt-4"
                >
                  {qualityButtons.map((button) => {
                    const estimate = getReviewIntervalEstimate(activeCard, button.quality)

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
                        className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1.5 py-2 text-center font-body transition-all disabled:opacity-60 sm:min-h-24 sm:gap-1 sm:px-3 sm:py-3 ${getReviewButtonClass(button.quality)}`}
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
                </m.div>
              ) : null}
            </div>
              )}
          </m.section>
        </AnimatePresence>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <section className={`${reviewPanel} p-4 sm:p-5`}>
            <p className={reviewKicker}>Sessão de hoje</p>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-brand-border bg-bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-brand-dark" />
                  <span className="font-body text-sm font-semibold text-brand-secondary">Novos</span>
                </div>
                <span className="font-heading text-lg font-bold text-brand-dark">{stats.newCards}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-brand-border bg-bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <Brain className="h-4 w-4 text-brand-dark" />
                  <span className="font-body text-sm font-semibold text-brand-secondary">Aprendendo</span>
                </div>
                <span className="font-heading text-lg font-bold text-brand-dark">{stats.learning}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-brand-border bg-bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <BookOpenCheck className="h-4 w-4 text-brand-dark" />
                  <span className="font-body text-sm font-semibold text-brand-secondary">Revisão</span>
                </div>
                <span className="font-heading text-lg font-bold text-brand-dark">{stats.review}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-accent px-4 py-3">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-brand-dark" />
                  <span className="font-body text-sm font-semibold text-brand-dark">Meta curta</span>
                </div>
                <span className="font-heading text-lg font-bold text-brand-dark">{stats.sessionLimit}</span>
              </div>
            </div>
          </section>

          <section className={`${reviewPanel} p-4 sm:p-5`}>
            <p className={reviewKicker}>Atalhos</p>
            <div className="mt-4 space-y-2 font-body text-sm font-semibold text-brand-secondary">
              <div className="flex items-center justify-between gap-3">
                <span>Revelar resposta</span>
                <kbd className="rounded-lg border border-brand-dark bg-bg-primary px-2 py-1 font-heading text-xs font-bold text-brand-dark">Space</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Difícil</span>
                <kbd className="rounded-lg border border-brand-dark bg-bg-primary px-2 py-1 font-heading text-xs font-bold text-brand-dark">1</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Bom</span>
                <kbd className="rounded-lg border border-brand-dark bg-bg-primary px-2 py-1 font-heading text-xs font-bold text-brand-dark">2</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Fácil</span>
                <kbd className="rounded-lg border border-brand-dark bg-bg-primary px-2 py-1 font-heading text-xs font-bold text-brand-dark">3</kbd>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
