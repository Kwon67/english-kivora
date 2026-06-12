'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useDrag } from '@use-gesture/react'
import {
  Brain,
  Eye,
  RotateCcw,
  X,
  Sparkles,
  RefreshCcw,
  BookOpenCheck,
  CalendarClock,
  Layers,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { getDueCards, submitCardReview, generateSmartContextResponse, getSmartImage } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AudioButton from '@/components/ui/AudioButton'
import FocusModePlayer from '@/features/game/components/FocusModePlayer'
import EmptyState from '@/components/ui/EmptyState'
import { notify } from '@/lib/toast'
import type { Card, Pack } from '@/types/database.types'

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
}

interface ReviewStats {
  newCards: number
  learning: number
  review: number
  sessionLimit: number
}

interface ReviewClientProps {
  initialDueCards: DueCard[]
  initialStats: ReviewStats
}

const qualityButtons = [
  {
    quality: 0,
    label: 'Errei',
    shortcut: '1',
    time: '1 min',
    className: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  },
  {
    quality: 3,
    label: 'Lembrei',
    shortcut: '2',
    time: '',
    className:
      'border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)] hover:bg-[rgba(43,122,11,0.16)]',
  },
  {
    quality: 5,
    label: 'Fácil',
    shortcut: '3',
    time: '',
    className:
      'border-[rgba(43,122,11,0.22)] bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[rgba(223,236,205,0.9)]',
  },
] as const

const qualityShortcutMap = new Map<string, number>(
  qualityButtons.map((button) => [button.shortcut, button.quality])
)

const REVIEW_SESSION_STORAGE_KEY = 'kivora_review_session'
const REVIEW_SESSION_TTL_MS = 24 * 60 * 60 * 1000

type StoredReviewSession = {
  packId: string
  currentIndex: number
  answers: Record<string, boolean>
  startedAt: string
}

function readStoredReviewSession() {
  try {
    const raw = localStorage.getItem(REVIEW_SESSION_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredReviewSession>
    if (!parsed.packId || typeof parsed.currentIndex !== 'number' || !parsed.startedAt) return null
    if (Date.now() - new Date(parsed.startedAt).getTime() > REVIEW_SESSION_TTL_MS) {
      localStorage.removeItem(REVIEW_SESSION_STORAGE_KEY)
      return null
    }

    return {
      packId: parsed.packId,
      currentIndex: parsed.currentIndex,
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

function buildReviewStats(cards: DueCard[], sessionLimit: number): ReviewStats {
  return {
    newCards: cards.filter((card) => card.isNew).length,
    learning: cards.filter((card) => !card.isNew && card.repetitions < 2).length,
    review: cards.filter((card) => !card.isNew && card.repetitions >= 2).length,
    sessionLimit,
  }
}

export default function ReviewClient({ initialDueCards, initialStats }: ReviewClientProps) {
  const router = useRouter()
  const [dueCards, setDueCards] = useState<DueCard[]>(initialDueCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isSmartPhase, setIsSmartPhase] = useState(false)
  const [showSmartHint, setShowSmartHint] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [comboCount, setComboCount] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [comboMessage, setComboMessage] = useState<string | null>(null)
  const [stats, setStats] = useState<ReviewStats>(initialStats)
  const [smartContext, setSmartContext] = useState<{ en: string, pt: string, imageSearchTerm?: string } | null>(null)
  const [smartImage, setSmartImage] = useState<string | null>(null)
  const [isSmartLoading, setIsSmartLoading] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [isSmartEnabled, setIsSmartEnabled] = useState(true)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date().toISOString())
  const [pendingStoredSession, setPendingStoredSession] = useState<StoredReviewSession | null>(null)
  const hasCheckedStoredSessionRef = useRef(false)

  // Load Smart Context preference
  useEffect(() => {
    const saved = localStorage.getItem('kivora_smart_context_enabled')
    if (saved !== null) {
      setTimeout(() => setIsSmartEnabled(saved === 'true'), 0)
    }
  }, [])

  const toggleSmartContext = () => {
    const newVal = !isSmartEnabled
    setIsSmartEnabled(newVal)
    localStorage.setItem('kivora_smart_context_enabled', String(newVal))
  }

  const activeCard = dueCards[currentIndex]
  const sessionPackId = dueCards[0]?.pack_id || activeCard?.pack_id || ''
  const sessionProgress = dueCards.length > 0
    ? Math.min(100, Math.round(((currentIndex + (showAnswer ? 0.65 : isSmartPhase ? 0.35 : 0)) / dueCards.length) * 100))
    : 0
  const activePackName = activeCard?.packs?.name || 'Pack de revisão'
  // Helper to check if current card should have smart context
  const isEligibleForSmart = activeCard && activeCard.interval_days >= 4 && !activeCard.isNew && isSmartEnabled
  const currentStepLabel = showAnswer
    ? 'Avaliar resposta'
    : isEligibleForSmart && !isSmartPhase
      ? 'Contexto IA disponível'
      : isSmartPhase
        ? 'Contexto inteligente'
        : 'Recordar frase'

  // Celebration when finished
  useEffect(() => {
    if (dueCards.length > 0 && !activeCard && completedCount > 0) {
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
            colors: ['#466259', '#cae9de', '#735802', '#ffdf96'],
          })
          void confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#466259', '#cae9de', '#735802', '#ffdf96'],
          })
        }, 250)
      })
    }
  }, [activeCard, dueCards.length, completedCount])

  // Smart Context Trigger - PRE-LOAD ONLY
  useEffect(() => {
    if (!activeCard || showAnswer || !isSmartEnabled) {
      if (!showAnswer) {
        setTimeout(() => {
          setSmartContext(null)
          setSmartImage(null)
          setIsSmartPhase(false)
        }, 0)
      }
      return
    }

    // Trigger Smart Context if card is "well-known" (interval >= 4 days)
    if (isEligibleForSmart && !smartContext && !isSmartLoading) {
      const triggerSmart = async () => {
        setIsSmartLoading(true)
        try {
          const result = await generateSmartContextResponse(
            activeCard.cards.english_phrase,
            activeCard.cards.portuguese_translation
          )
          setSmartContext(result)
          
          // Fetch image in parallel/after
          if (result.imageSearchTerm) {
            setIsImageLoading(true)
            try {
              const imageUrl = await getSmartImage(result.imageSearchTerm)
              setSmartImage(imageUrl)
            } finally {
              setIsImageLoading(false)
            }
          }
        } catch (err) {
          console.error('Smart Context Error:', err)
        } finally {
          setIsSmartLoading(false)
        }
      }
      void triggerSmart()
    }
	  }, [activeCard, showAnswer, isSmartEnabled, isEligibleForSmart, smartContext, isSmartLoading])

	  useEffect(() => {
	    if (hasCheckedStoredSessionRef.current || !sessionPackId || dueCards.length === 0) return

	    hasCheckedStoredSessionRef.current = true
	    const storedSession = readStoredReviewSession()
	    if (!storedSession) return

	    if (storedSession.packId === sessionPackId && storedSession.currentIndex > 0 && storedSession.currentIndex < dueCards.length) {
	      const restorePromptTimer = window.setTimeout(() => setPendingStoredSession(storedSession), 0)
	      return () => window.clearTimeout(restorePromptTimer)
	    }

	    clearStoredReviewSession()
	  }, [dueCards.length, sessionPackId])

	  function continueStoredSession() {
	    if (!pendingStoredSession) return

	    setCurrentIndex(Math.min(pendingStoredSession.currentIndex, dueCards.length - 1))
	    setAnswers(pendingStoredSession.answers)
	    setCompletedCount(Object.values(pendingStoredSession.answers).filter(Boolean).length)
	    setSessionStartedAt(pendingStoredSession.startedAt)
	    setShowAnswer(false)
	    setIsSmartPhase(false)
	    setShowSmartHint(false)
	    setPendingStoredSession(null)
	  }

	  function restartStoredSession() {
	    clearStoredReviewSession()
	    setAnswers({})
	    setCompletedCount(0)
	    setCurrentIndex(0)
	    setSessionStartedAt(new Date().toISOString())
	    setShowAnswer(false)
	    setIsSmartPhase(false)
	    setShowSmartHint(false)
	    setPendingStoredSession(null)
	  }

	  const loadDueCards = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await getDueCards()
	      const cards = result.dueCards as unknown as DueCard[]
	      setDueCards(cards)
	      setCurrentIndex(0)
	      setAnswers({})
	      setSessionStartedAt(new Date().toISOString())
	      clearStoredReviewSession()
	      setShowAnswer(false)
	      setStats(buildReviewStats(cards, result.sessionLimit || 0))
    } catch (error) {
      console.error('Erro ao carregar cards pendentes:', error)
      notify.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }, [])

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
        const result = await submitCardReview({
          cardId: activeCard.card_id || activeCard.id,
          packId: activeCard.pack_id,
          quality,
          previousInterval: activeCard.isNew ? undefined : activeCard.interval_days,
          previousEaseFactor: activeCard.isNew ? undefined : activeCard.ease_factor,
          previousRepetitions: activeCard.isNew ? undefined : activeCard.repetitions,
          previousTotalReviews: activeCard.isNew ? 0 : activeCard.total_reviews || 0,
          streak: quality === 5 ? comboCount + 1 : 0
        })

	        const isLastCard = currentIndex === dueCards.length - 1
	        const willContinue = !isLastCard || quality === 0
	        const nextAnswers = {
	          ...answers,
	          [activeCard.card_id || activeCard.id]: quality > 0,
	        }
	        setAnswers(nextAnswers)

	        if (quality === 0 && dueCards.length < stats.sessionLimit) {
          setDueCards((prev) => [
            ...prev,
            {
              ...activeCard,
              isNew: false,
              interval_days: result.reviewResult?.intervalDays ?? 1,
              ease_factor: result.reviewResult?.easeFactor ?? Math.max(1.3, (activeCard.ease_factor || 2.5) - 0.2),
              repetitions: 0,
              total_reviews: (activeCard.total_reviews || 0) + 1,
            },
          ])
        } else {
          setCompletedCount((prev) => prev + 1)
        }

	        if (willContinue) {
	          if (sessionPackId) {
	            writeStoredReviewSession({
	              packId: sessionPackId,
	              currentIndex: currentIndex + 1,
	              answers: nextAnswers,
	              startedAt: sessionStartedAt,
	            })
	          }
	          setCurrentIndex((prev) => prev + 1)
          setShowAnswer(false)
          setIsSmartPhase(false)
          setShowSmartHint(false)
          setSmartContext(null)
          setSmartImage(null)
          window.scrollTo({ top: 0, behavior: 'smooth' })
	        } else {
	          clearStoredReviewSession()
	          notify.success(`Sessão finalizada! +${completedCount + 1} cards`)
	          router.push('/home?reviewComplete=true', { transitionTypes: navBackTransitionTypes })
        }
      } catch (error) {
        console.error('Erro ao enviar revisão:', error)
        notify.error('Verifique os campos')
      } finally {
        setIsLoading(false)
      }
    },
		    [activeCard, answers, completedCount, currentIndex, dueCards.length, router, comboCount, maxCombo, sessionPackId, sessionStartedAt, stats.sessionLimit]
		  )

	  const bindSwipe = useDrag(
	    ({ down, last, movement: [movementX] }) => {
	      if (!showAnswer || isLoading) {
	        setSwipeOffset(0)
	        return
	      }

	      const limitedOffset = Math.max(-120, Math.min(120, movementX))
	      setSwipeOffset(down ? limitedOffset : 0)

	      if (!last) return

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

      // Space advances phases
      if (event.code === 'Space') {
        event.preventDefault()
        if (showAnswer) return // Space doesn't rate, only advances
        
        if (isEligibleForSmart && !isSmartPhase) {
          setIsSmartPhase(true)
        } else {
          setShowAnswer(true)
        }
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
  }, [showAnswer, isLoading, handleReview, isEligibleForSmart, isSmartPhase])

  if (isLoading && dueCards.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <div className="premium-card w-full max-w-lg overflow-hidden text-center">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1rem] bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm">
              <Brain className="h-8 w-8 animate-pulse" strokeWidth={1.8} />
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <p className="section-kicker">Revisão</p>
            <h2 className="mt-4 text-3xl font-black text-[var(--color-text)]">Carregando sessão</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
              Preparando seus cards, áudio e contexto para uma rodada mais focada.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (dueCards.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <EmptyState
          imageSrc="/images/home/undraw-studying.svg"
          imageAlt="Ilustração unDraw de estudo concluído"
          title="Tudo em dia."
          description="Você não tem cards para revisar agora. O sistema está limpo e pronto para a próxima rodada."
          className="w-full max-w-xl"
        >
            <button
              type="button"
              onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
              className="btn-primary"
            >
              Voltar para home
            </button>
            <button type="button" onClick={() => loadDueCards()} className="btn-ghost">
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              Atualizar
            </button>
        </EmptyState>
      </div>
    )
  }

  if (!activeCard) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <EmptyState
          imageSrc="/images/home/undraw-online-learning.svg"
          imageAlt="Ilustração unDraw de revisão concluída"
          title="Revisão concluída."
          description={`Você revisou ${completedCount} cards nesta sessão.`}
          className="w-full max-w-xl"
          imageClassName="max-w-52"
        >
          <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
            <div className="rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">Cards</p>
              <p className="text-2xl font-black text-[var(--color-primary)]">{completedCount}</p>
            </div>
            <div className="rounded-[0.9rem] bg-amber-500/10 p-4 text-center border border-amber-500/20">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600/70">Maior Combo</p>
              <p className="text-2xl font-black text-amber-600">{maxCombo}x</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
            className="btn-primary mt-8"
          >
            Voltar para home
          </button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-5 lg:px-6 relative">
      {/* Combo Counter Overlay - Moved to bottom right to avoid blocking top buttons */}
      <AnimatePresence>
        {comboCount >= 2 && (
          <m.div
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-1 pointer-events-none"
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
        <div className="premium-card overflow-hidden">
          <div className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="section-kicker">Sessão de revisão</p>
                <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--color-text)]">
                  Revisão diária
                </h1>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-[var(--color-text-muted)]">
                  {activePackName} · {currentStepLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FocusModePlayer />
                <button
                  type="button"
                  onClick={toggleSmartContext}
	                  className={`flex h-10 w-10 items-center justify-center rounded-[0.8rem] border transition-all ${
	                    isSmartEnabled
	                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
	                      : 'border-transparent text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-container-low)]'
	                  }`}
	                  title={isSmartEnabled ? 'Desativar Smart Context' : 'Ativar Smart Context'}
	                  aria-label={isSmartEnabled ? 'Desativar Smart Context' : 'Ativar Smart Context'}
	                >
                  <Sparkles className={`h-4 w-4 ${isSmartEnabled ? 'fill-amber-600/20' : ''}`} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
                  className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]"
                  aria-label="Fechar revisão"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                  Progresso
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  {currentIndex + 1} / {dueCards.length}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                <div
	                  className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
                  style={{ width: `${sessionProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
	      </header>

	      {pendingStoredSession && (
	        <section className="mb-4 rounded-xl border border-emerald-900/10 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
	          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	            <p className="font-semibold">Você tem uma sessão em andamento. Continuar de onde parou?</p>
	            <div className="flex gap-2">
	              <button
	                type="button"
	                onClick={continueStoredSession}
	                className="rounded-md bg-emerald-800 px-3 py-2 text-xs font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-95"
	              >
	                Continuar
	              </button>
	              <button
	                type="button"
	                onClick={restartStoredSession}
	                className="rounded-md border border-emerald-900/10 bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition-all duration-150 hover:bg-emerald-50 active:scale-95"
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
		            key={activeCard.id || currentIndex}
	            initial={{ opacity: 0, y: 20, scale: 0.98 }}
	            animate={{ opacity: 1, y: 0, scale: 1 }}
	            exit={{ opacity: 0, y: -20, scale: 0.98 }}
	            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
		            className={`premium-card relative overflow-hidden p-4 sm:p-5 lg:p-6 ${
	              isSmartPhase || comboCount >= 3 ? 'animate-ai-glow' : ''
	            }`}
	          >
	            <div
	              className={`pointer-events-none absolute inset-0 transition-colors duration-150 ${
	                swipeOffset > 12
	                  ? 'bg-emerald-500/10'
	                  : swipeOffset < -12
	                    ? 'bg-red-500/10'
	                    : 'bg-transparent'
	              }`}
	            />
	            <div {...bindSwipe()} className="relative flex min-h-[24rem] flex-col sm:min-h-[28rem]" style={{ touchAction: 'pan-y' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
                    {getCardStageLabel(activeCard)}
                  </span>
                  <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
                    {activeCard.packs?.name || 'Pack'}
                  </span>
                </div>

                {(activeCard.cards.audio_url || (isSmartPhase && smartContext)) && (
                  <AudioButton
                    url={isSmartPhase && smartContext ? `/api/tts?text=${encodeURIComponent(smartContext.en)}` : activeCard.cards.audio_url}
                    autoPlay={true}
                    className="!mt-0 shrink-0"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col justify-center py-6 text-center sm:py-8">
                {isSmartPhase && smartContext ? (
                  <div className="animate-fade-in space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[0.65rem] bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                      <Sparkles className="h-3 w-3" />
                      Smart Context
                    </div>

                    {/* AI Generated Visual */}
                    <AnimatePresence mode="wait">
                      {smartImage ? (
                        <m.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative mx-auto h-44 w-full max-w-md overflow-hidden rounded-[1rem] border border-amber-500/20 shadow-lg sm:h-56"
                        >
                          <Image
                            src={smartImage}
                            alt="Visual representation"
                            fill
                            sizes="(min-width: 640px) 28rem, 100vw"
                            unoptimized
                            onError={(event) => {
                              event.currentTarget.src = '/images/home/undraw-online-learning.svg'
                            }}
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        </m.div>
                      ) : isImageLoading ? (
                        <div className="mx-auto h-44 w-full max-w-md animate-pulse rounded-[1rem] bg-amber-500/5 border border-dashed border-amber-500/20 flex items-center justify-center sm:h-56">
                           <Sparkles className="h-6 w-6 text-amber-500/30 animate-spin" />
                        </div>
                      ) : null}
                    </AnimatePresence>

                    <h2 className="mx-auto max-w-[18ch] text-balance text-3xl font-black leading-tight text-[var(--color-text)] sm:text-5xl italic">
                      &ldquo;{smartContext.en}&rdquo;
                    </h2>
                    
                    {showSmartHint ? (
                      <m.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-semibold text-amber-700/80 bg-amber-500/5 py-2 px-4 rounded-[0.85rem] inline-block"
                      >
                        {smartContext.pt}
                      </m.p>
                    ) : (
                      <p className="text-xs text-[var(--color-text-subtle)] font-medium">
                        Novo contexto para testar seu domínio real.
                      </p>
                    )}
                  </div>
                ) : isSmartLoading && isSmartPhase ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <RefreshCcw className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-subtle)]">Calibrando Smart Context...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] opacity-60">Frase do pack</p>
                    <h2 className="mx-auto max-w-[16ch] text-balance text-4xl font-black leading-tight text-[var(--color-text)] sm:text-6xl">
                      {activeCard.cards.english_phrase}
                    </h2>
                  </div>
                )}

                {showAnswer ? (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto mt-6 w-full max-w-xl rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-5 py-4 sm:px-6 text-left"
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          {isSmartPhase ? 'Tradução do Contexto' : 'Significado'}
                        </p>
                        <p className="mt-2 text-base font-semibold leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
                          {isSmartPhase && smartContext ? smartContext.pt : activeCard.cards.portuguese_translation}
                        </p>
                      </div>

                      {isSmartPhase && smartContext && (
                        <div className="pt-3 border-t border-[rgba(193,200,196,0.2)]">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600/70 mb-2">
                            Referência Original
                          </p>
                          <div className="bg-[var(--color-surface)]/50 rounded-[0.8rem] p-3 space-y-1.5 border border-amber-500/10">
                            <p className="text-sm font-medium italic text-[var(--color-text-subtle)]">
                              &ldquo;{activeCard.cards.english_phrase}&rdquo;
                            </p>
                            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                              {activeCard.cards.portuguese_translation}
                            </p>
                          </div>
                        </div>
                      )}

                      {!activeCard.isNew && !isSmartPhase && (
                        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                          Intervalo atual: {activeCard.interval_days} dia{activeCard.interval_days === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                  </m.div>
                ) : (
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                      {isEligibleForSmart && !isSmartPhase ? 'Próximo passo' : 'Pronto para conferir'}
                    </p>
                    {isEligibleForSmart && !isSmartPhase ? (
                      <m.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setIsSmartPhase(true)}
                        className="inline-flex items-center justify-center rounded-[0.85rem] bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-on-primary)] shadow-sm transition hover:brightness-105"
                      >
                        Avançar para IA
                      </m.button>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3">
                          {isSmartPhase && !showSmartHint && (
                            <m.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setShowSmartHint(true)}
                              className="inline-flex items-center gap-2 rounded-[0.8rem] bg-amber-500/5 px-4 py-2.5 text-xs font-bold text-amber-600/70 border border-amber-500/10 hover:bg-amber-500/10"
                            >
                              Ver tradução
                            </m.button>
                          )}
                          <m.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setShowAnswer(true)}
                            className="inline-flex items-center gap-2 rounded-[0.85rem] bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-on-primary)] shadow-sm hover:brightness-105"
                          >
                            <Eye className="h-4 w-4" strokeWidth={2} />
                            Mostrar resposta
                          </m.button>
                        </div>
                        
                        {isSmartPhase && (
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/50 animate-pulse">
                            Se travou aqui, considere marcar como Difícil
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </m.section>
        </AnimatePresence>

        {showAnswer && (
          <m.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {qualityButtons.map((button) => {
              const estimate =
                button.quality === 3
                  ? activeCard.isNew
                    ? '1 dia'
                    : `${Math.round(Math.max(1, activeCard.interval_days) * activeCard.ease_factor)} dias`
                  : button.quality === 5
                    ? activeCard.isNew
                      ? '4 dias'
                      : `${Math.round(Math.max(1, activeCard.interval_days) * activeCard.ease_factor * 1.5)} dias`
                    : '1m'

              const cardClass =
                button.quality === 0
                  ? 'bg-[var(--color-surface-container-low)] text-[var(--color-error)] border-[var(--color-error)]/15 hover:bg-[var(--color-error)]/5'
                  : button.quality === 3
                    ? 'bg-[var(--color-surface-container-low)] text-[var(--color-accent)] border-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/5'
                    : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-[0_8px_20px_rgba(70,98,89,0.18)]'

              return (
                <m.button
                  key={button.quality}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleReview(button.quality)}
                  disabled={isLoading}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-[1rem] border px-4 py-4 text-center transition-all disabled:opacity-60 sm:min-h-28 ${cardClass}`}
                >
                  <span className="rounded-[0.55rem] border border-current/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] opacity-75">
                    {button.shortcut}
                  </span>
                  <span className="text-base sm:text-lg font-bold">
                    {button.label}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-widest ${
                      button.quality === 5 
                        ? 'text-[var(--color-on-primary)] opacity-70' 
                        : 'text-[var(--color-text-subtle)] opacity-80'
                    }`}
                  >
                    {estimate}
                  </span>
                </m.button>
              )
            })}
          </m.section>
        )}
        </div>

        <aside className="space-y-4">
          <section className="card p-4 sm:p-5">
            <p className="section-kicker">Fila de hoje</p>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-[0.85rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="text-sm font-bold text-[var(--color-text-muted)]">Novos</span>
                </div>
                <span className="text-lg font-black text-[var(--color-text)]">{stats.newCards}</span>
              </div>
              <div className="flex items-center justify-between rounded-[0.85rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Brain className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="text-sm font-bold text-[var(--color-text-muted)]">Aprendendo</span>
                </div>
                <span className="text-lg font-black text-[var(--color-text)]">{stats.learning}</span>
              </div>
              <div className="flex items-center justify-between rounded-[0.85rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <BookOpenCheck className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="text-sm font-bold text-[var(--color-text-muted)]">Revisão</span>
                </div>
                <span className="text-lg font-black text-[var(--color-text)]">{stats.review}</span>
              </div>
              <div className="flex items-center justify-between rounded-[0.85rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="text-sm font-bold text-[var(--color-text-muted)]">Limite da sessão</span>
                </div>
                <span className="text-lg font-black text-[var(--color-primary)]">{stats.sessionLimit}</span>
              </div>
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <p className="section-kicker">Atalhos</p>
            <div className="mt-4 space-y-2 text-sm font-semibold text-[var(--color-text-muted)]">
              <div className="flex items-center justify-between gap-3">
                <span>Revelar ou avançar</span>
                <kbd className="rounded-[0.5rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-2 py-1 text-xs font-black text-[var(--color-text)]">Space</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Errei</span>
                <kbd className="rounded-[0.5rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-2 py-1 text-xs font-black text-[var(--color-text)]">1</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Lembrei</span>
                <kbd className="rounded-[0.5rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-2 py-1 text-xs font-black text-[var(--color-text)]">2</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Fácil</span>
                <kbd className="rounded-[0.5rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-2 py-1 text-xs font-black text-[var(--color-text)]">3</kbd>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
