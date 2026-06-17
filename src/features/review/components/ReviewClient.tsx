'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDrag } from '@use-gesture/react'
import {
  Brain,
  Eye,
  RotateCcw,
  X,
  BookOpenCheck,
  CalendarClock,
  Layers,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { getDueCards, submitCardReview } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AudioButton from '@/components/ui/AudioButton'
import FocusModePlayer from '@/features/game/components/FocusModePlayer'
import EmptyState from '@/components/ui/EmptyState'
import { notify } from '@/lib/toast'
import type { Card, Pack } from '@/types/database.types'
import FlightPaths from '@/components/landing/FlightPaths'

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
    return 'bg-[var(--color-surface-container-low)] text-[var(--color-error)] border-[var(--color-error)]/15 hover:bg-[var(--color-error)]/5 active:bg-[var(--color-error)]/10'
  }
  if (quality === 3) {
    return 'bg-[var(--color-surface-container-low)] text-[var(--color-accent)] border-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/5 active:bg-[var(--color-accent)]/10'
  }
  return 'bg-primary text-on-primary border-primary shadow-[0_4px_16px_rgba(70,98,89,0.18)] active:brightness-95'
}

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

  function renderWithBackground(children: React.ReactNode) {
    return (
      <div className="relative -mx-4 -my-6 overflow-hidden bg-surface dark:bg-[#050704] text-text dark:text-text px-4 py-6 pb-12 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 transition-colors duration-300 min-h-[calc(100vh-5rem)] min-h-[calc(100svh-5rem)]">
        {/* Background mesh grid - Landing page style */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14] z-0" />
        
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)] z-0" />

        {/* Decorative flight-path background */}
        <FlightPaths />

        <div className="relative z-10 w-full">
          {children}
        </div>
      </div>
    )
  }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [comboCount, setComboCount] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [comboMessage, setComboMessage] = useState<string | null>(null)
  const [stats, setStats] = useState<ReviewStats>(initialStats)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date().toISOString())
  const [pendingStoredSession, setPendingStoredSession] = useState<StoredReviewSession | null>(null)
  const hasCheckedStoredSessionRef = useRef(false)

  const activeCard = dueCards[currentIndex]
  const sessionPackId = dueCards[0]?.pack_id || activeCard?.pack_id || ''
  const sessionProgress = dueCards.length > 0
    ? Math.min(100, Math.round(((currentIndex + (showAnswer ? 0.65 : 0)) / dueCards.length) * 100))
    : 0
  const activePackName = activeCard?.packs?.name || 'Pack de revisão'
  const currentStepLabel = showAnswer ? 'Avaliar resposta' : 'Recordar frase'

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
	    setPendingStoredSession(null)
	  }

	  function restartStoredSession() {
	    clearStoredReviewSession()
	    setAnswers({})
	    setCompletedCount(0)
	    setCurrentIndex(0)
	    setSessionStartedAt(new Date().toISOString())
	    setShowAnswer(false)
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
          window.scrollTo({ top: 0, behavior: 'smooth' })
	        } else {
	          clearStoredReviewSession()
	          try {
	            await fetch('/api/streak/update', { method: 'POST' })
	          } catch (streakError) {
	            console.error('Erro ao sincronizar streak diária:', streakError)
	          }
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
  }, [showAnswer, isLoading, handleReview])

  if (isLoading && dueCards.length === 0) {
    return renderWithBackground(
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <div className="premium-card w-full max-w-lg overflow-hidden text-center">
          <div className="border-b border-border bg-[var(--color-surface-container-low)] p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1rem] bg-surface-container-lowest text-primary shadow-sm">
              <Brain className="h-8 w-8 animate-pulse" strokeWidth={1.8} />
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <p className="section-kicker">Revisão</p>
            <h2 className="mt-4 text-3xl font-black text-text">Carregando sessão</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-muted">
              Preparando seus cards e áudio para uma rodada mais focada.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (dueCards.length === 0) {
    return renderWithBackground(
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
    return renderWithBackground(
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
            <div className="rounded-[0.9rem] border border-border bg-[var(--color-surface-container-low)] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-text-subtle">Cards</p>
              <p className="text-2xl font-black text-primary">{completedCount}</p>
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

  return renderWithBackground(
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
                <h1 className="mt-2 text-2xl font-black leading-tight text-text">
                  Revisão diária
                </h1>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-text-muted">
                  {activePackName} · {currentStepLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FocusModePlayer />
                <button
                  type="button"
                  onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
                  className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] text-primary hover:bg-surface-container-low"
                  aria-label="Fechar revisão"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-text-subtle">
                  Progresso
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-primary">
                  {currentIndex + 1} / {dueCards.length}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                <div
	                  className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${sessionProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
	      </header>

	      {pendingStoredSession && (
	        <section className="mb-4 rounded-xl border border-primary/10 bg-primary-light px-4 py-3 text-sm text-primary dark:border-primary/20 dark:bg-primary/10">
	          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	            <p className="font-semibold">Você tem uma sessão em andamento. Continuar de onde parou?</p>
	            <div className="flex gap-2">
	              <button
	                type="button"
	                onClick={continueStoredSession}
	                className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-on-primary transition-all duration-150 hover:bg-primary-dark active:scale-95"
	              >
	                Continuar
	              </button>
	              <button
	                type="button"
	                onClick={restartStoredSession}
	                className="rounded-md border border-primary/10 bg-card px-3 py-2 text-xs font-bold text-primary transition-all duration-150 hover:bg-primary-container active:scale-95 dark:border-primary/20 dark:hover:bg-primary/10"
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
	              comboCount >= 3 ? 'animate-ai-glow' : ''
	            }`}
	          >
	            <div
	              className={`pointer-events-none absolute inset-0 transition-colors duration-150 ${
	                swipeOffset > 12
	                  ? 'bg-primary-light dark:bg-primary/10'
	                  : swipeOffset < -12
	                    ? 'bg-red-500/10'
	                    : 'bg-transparent'
	              }`}
	            />
	            <div
                {...bindSwipe()}
                className={`relative flex flex-col ${showAnswer ? 'min-h-0' : 'min-h-[18rem] sm:min-h-[24rem]'}`}
                style={{ touchAction: 'pan-y' }}
              >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="stitch-pill bg-[var(--color-surface-container-low)] text-text-muted">
                    {getCardStageLabel(activeCard)}
                  </span>
                  <span className="stitch-pill bg-[var(--color-surface-container-low)] text-text-muted">
                    {activeCard.packs?.name || 'Pack'}
                  </span>
                </div>

                {activeCard.cards.audio_url && (
                  <AudioButton
                    url={activeCard.cards.audio_url}
                    autoPlay={true}
                    className="!mt-0 shrink-0"
                  />
                )}
              </div>

              <div
                className={`flex flex-1 flex-col text-center ${
                  showAnswer ? 'justify-start py-4 sm:py-5' : 'justify-center py-6 sm:py-8'
                }`}
              >
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-subtle opacity-60">Frase do pack</p>
                  <h2
                    className={`mx-auto max-w-[16ch] text-balance font-black leading-tight text-text ${
                      showAnswer ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-6xl'
                    }`}
                  >
                    {activeCard.cards.english_phrase}
                  </h2>
                </div>

                {showAnswer ? (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto mt-4 w-full max-w-xl rounded-[1rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-3 sm:px-6 sm:py-4 text-left"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-subtle">
                      Significado
                    </p>
                    <p className="mt-1.5 text-base font-semibold leading-relaxed text-text-muted sm:text-lg">
                      {activeCard.cards.portuguese_translation}
                    </p>
                  </m.div>
                ) : (
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">
                      Pronto para conferir
                    </p>
                    <m.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setShowAnswer(true)}
                      className="inline-flex items-center gap-2 rounded-[0.85rem] bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm hover:brightness-105"
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                      Mostrar resposta
                    </m.button>
                  </div>
                )}
              </div>

              {showAnswer && (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 sm:mt-4 sm:gap-3 sm:pt-4"
                >
                  {qualityButtons.map((button) => {
                    const estimate = getReviewIntervalEstimate(activeCard, button.quality)

                    return (
                      <m.button
                        key={button.quality}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => handleReview(button.quality)}
                        disabled={isLoading}
                        className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-[0.85rem] border px-1.5 py-2 text-center transition-all disabled:opacity-60 sm:min-h-24 sm:gap-1 sm:px-3 sm:py-3 ${getReviewButtonClass(button.quality)}`}
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
                              ? 'text-on-primary opacity-70'
                              : 'text-text-subtle opacity-80'
                          }`}
                        >
                          {estimate}
                        </span>
                      </m.button>
                    )
                  })}
                </m.div>
              )}
            </div>
          </m.section>
        </AnimatePresence>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <section className="card p-4 sm:p-5">
            <p className="section-kicker">Fila de hoje</p>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-[0.85rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-text-muted">Novos</span>
                </div>
                <span className="text-lg font-black text-text">{stats.newCards}</span>
              </div>
              <div className="flex items-center justify-between rounded-[0.85rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-text-muted">Aprendendo</span>
                </div>
                <span className="text-lg font-black text-text">{stats.learning}</span>
              </div>
              <div className="flex items-center justify-between rounded-[0.85rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <BookOpenCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-text-muted">Revisão</span>
                </div>
                <span className="text-lg font-black text-text">{stats.review}</span>
              </div>
              <div className="flex items-center justify-between rounded-[0.85rem] border border-border bg-[var(--color-surface-container-low)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-text-muted">Limite da sessão</span>
                </div>
                <span className="text-lg font-black text-primary">{stats.sessionLimit}</span>
              </div>
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <p className="section-kicker">Atalhos</p>
            <div className="mt-4 space-y-2 text-sm font-semibold text-text-muted">
              <div className="flex items-center justify-between gap-3">
                <span>Revelar resposta</span>
                <kbd className="rounded-[0.5rem] border border-border bg-[var(--color-surface-container-low)] px-2 py-1 text-xs font-black text-text">Space</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Difícil</span>
                <kbd className="rounded-[0.5rem] border border-border bg-[var(--color-surface-container-low)] px-2 py-1 text-xs font-black text-text">1</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Bom</span>
                <kbd className="rounded-[0.5rem] border border-border bg-[var(--color-surface-container-low)] px-2 py-1 text-xs font-black text-text">2</kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Fácil</span>
                <kbd className="rounded-[0.5rem] border border-border bg-[var(--color-surface-container-low)] px-2 py-1 text-xs font-black text-text">3</kbd>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
