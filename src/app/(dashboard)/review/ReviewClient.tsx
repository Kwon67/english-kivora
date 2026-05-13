'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Brain, Eye, RotateCcw, X, Sparkles, RefreshCcw } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { getDueCards, submitCardReview, generateSmartContextResponse, getSmartImage } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AudioButton from '@/components/shared/AudioButton'
import FocusModePlayer from '@/components/shared/FocusModePlayer'
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
  dailyLimit: number
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

function getCardStageLabel(card: DueCard) {
  if (card.isNew) return 'Carta nova'
  if (card.repetitions <= 0) return 'Em revisão'
  return `Revisão ${card.repetitions}`
}

function buildReviewStats(cards: DueCard[], dailyLimit: number): ReviewStats {
  return {
    newCards: cards.filter((card) => card.isNew).length,
    learning: cards.filter((card) => !card.isNew && card.repetitions < 2).length,
    review: cards.filter((card) => !card.isNew && card.repetitions >= 2).length,
    dailyLimit,
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

  // Load Smart Context preference
  useEffect(() => {
    const saved = localStorage.getItem('kivora_smart_context_enabled')
    if (saved !== null) {
      setIsSmartEnabled(saved === 'true')
    }
  }, [])

  const toggleSmartContext = () => {
    const newVal = !isSmartEnabled
    setIsSmartEnabled(newVal)
    localStorage.setItem('kivora_smart_context_enabled', String(newVal))
  }

  const activeCard = dueCards[currentIndex]
  const progress = dueCards.length > 0 ? (currentIndex / dueCards.length) * 100 : 0
  const remaining = Math.max(dueCards.length - currentIndex - 1, 0)

  // Helper to check if current card should have smart context
  const isEligibleForSmart = activeCard && activeCard.interval_days >= 4 && !activeCard.isNew && isSmartEnabled

  // Celebration when finished
  useEffect(() => {
    if (dueCards.length > 0 && !activeCard && completedCount > 0) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

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
    }
  }, [activeCard, dueCards.length, completedCount])

  // Smart Context Trigger - PRE-LOAD ONLY
  useEffect(() => {
    if (!activeCard || showAnswer || !isSmartEnabled) {
      if (!showAnswer) {
        setSmartContext(null)
        setSmartImage(null)
        setIsSmartPhase(false)
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
            const imageUrl = await getSmartImage(result.imageSearchTerm)
            setSmartImage(imageUrl)
            setIsImageLoading(false)
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

  const loadDueCards = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await getDueCards()
      const cards = result.dueCards as unknown as DueCard[]
      setDueCards(cards)
      setCurrentIndex(0)
      setShowAnswer(false)
      setStats(buildReviewStats(cards, result.newCardsLimit || 0))
    } catch (error) {
      console.error('Erro ao carregar cards pendentes:', error)
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

        if (quality === 0) {
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
          setCurrentIndex((prev) => prev + 1)
          setShowAnswer(false)
          setIsSmartPhase(false)
          setShowSmartHint(false)
          setSmartContext(null)
          setSmartImage(null)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          router.push('/home?reviewComplete=true', { transitionTypes: navBackTransitionTypes })
        }
      } catch (error) {
        console.error('Erro ao enviar revisão:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [activeCard, currentIndex, dueCards.length, router, comboCount, maxCombo]
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
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="premium-card w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
            <Brain className="h-9 w-9 animate-pulse" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">Carregando revisão</h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
            Preparando seus cards para uma sessão mais calma e precisa.
          </p>
        </div>
      </div>
    )
  }

  if (dueCards.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <div className="premium-card w-full max-w-xl p-8 text-center sm:p-10">
          <Image
            src="/images/home/undraw-studying.svg"
            alt="Ilustração unDraw de estudo concluído"
            width={849}
            height={842}
            unoptimized
            className="mx-auto h-auto w-full max-w-44 object-contain"
          />
          <h2 className="mt-6 text-5xl font-semibold text-[var(--color-text)]">Tudo em dia.</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
            Você não tem cards para revisar agora. O sistema está limpo e pronto para a próxima rodada.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
          </div>
        </div>
      </div>
    )
  }

  if (!activeCard) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="premium-card w-full max-w-xl p-8 text-center sm:p-10">
          <Image
            src="/images/home/undraw-online-learning.svg"
            alt="Ilustração unDraw de revisão concluída"
            width={692}
            height={500}
            unoptimized
            className="mx-auto h-auto w-full max-w-52 object-contain"
          />
          <h2 className="mt-6 text-5xl font-semibold text-[var(--color-text)]">Revisão concluída.</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
            Você revisou {completedCount} cards nesta sessão.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <div className="rounded-2xl bg-[var(--color-surface-container-low)] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">Cards</p>
              <p className="text-2xl font-black text-[var(--color-primary)]">{completedCount}</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-4 text-center border border-amber-500/20">
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
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-10 relative">
      {/* Combo Counter Overlay - Moved to bottom right to avoid blocking top buttons */}
      <AnimatePresence>
        {comboCount >= 2 && (
          <m.div
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-1 pointer-events-none"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-2 text-white shadow-[0_8px_32px_rgba(245,158,11,0.3)] border border-white/20">
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

      <header className="mb-8 px-4 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                Revisão diária
              </h1>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                {currentIndex + 1} / {dueCards.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FocusModePlayer />
              <button
                type="button"
                onClick={toggleSmartContext}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  isSmartEnabled 
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
                    : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-container-low)]'
                }`}
                title={isSmartEnabled ? 'Desativar Smart Context' : 'Ativar Smart Context'}
              >
                <Sparkles className={`h-4 w-4 ${isSmartEnabled ? 'fill-amber-600/20' : ''}`} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]"
                aria-label="Fechar revisão"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="space-y-6 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <m.section
            key={activeCard.id || currentIndex}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`premium-card overflow-hidden border-[rgba(193,200,196,0.28)] p-5 shadow-[0_8px_32px_rgba(27,28,24,0.05)] sm:p-8 ${
              isSmartPhase || comboCount >= 3 ? 'animate-ai-glow' : ''
            }`}
          >
            <div className="flex min-h-[22rem] flex-col sm:min-h-[24rem]">
              <div className="flex items-start justify-between gap-3">
                <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
                  {getCardStageLabel(activeCard)}
                </span>

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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                      <Sparkles className="h-3 w-3" />
                      Smart Context
                    </div>

                    {/* AI Generated Visual */}
                    <AnimatePresence mode="wait">
                      {smartImage ? (
                        <m.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative mx-auto h-40 w-full max-w-sm overflow-hidden rounded-2xl border border-amber-500/20 shadow-lg sm:h-48"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={smartImage}
                            alt="Visual representation"
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        </m.div>
                      ) : isImageLoading ? (
                        <div className="mx-auto h-40 w-full max-w-sm animate-pulse rounded-2xl bg-amber-500/5 border border-dashed border-amber-500/20 flex items-center justify-center sm:h-48">
                           <Sparkles className="h-6 w-6 text-amber-500/30 animate-spin" />
                        </div>
                      ) : null}
                    </AnimatePresence>

                    <h2 className="text-responsive-lg mx-auto max-w-[15ch] text-balance text-[var(--color-text)] sm:text-responsive-xl font-medium italic">
                      &ldquo;{smartContext.en}&rdquo;
                    </h2>
                    
                    {showSmartHint ? (
                      <m.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-semibold text-amber-700/80 bg-amber-500/5 py-2 px-4 rounded-xl inline-block"
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] opacity-60">Frase do Pack</p>
                    <h2 className="text-responsive-lg mx-auto max-w-[12ch] text-balance text-[var(--color-text)] sm:text-responsive-xl">
                      {activeCard.cards.english_phrase}
                    </h2>
                  </div>
                )}

                {showAnswer ? (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto mt-6 w-full max-w-xl rounded-[1.4rem] border border-[rgba(193,200,196,0.32)] bg-[var(--color-surface-container-low)] px-5 py-4 sm:px-6 text-left"
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
                          <div className="bg-[var(--color-surface)]/50 rounded-lg p-3 space-y-1.5 border border-amber-500/10">
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
                    <p className="text-sm text-[var(--color-text-subtle)]">
                      {isEligibleForSmart && !isSmartPhase ? 'Toque para avançar' : 'Toque para revelar'}
                    </p>
                    {isEligibleForSmart && !isSmartPhase ? (
                      <m.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setIsSmartPhase(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-600 border border-amber-500/20 hover:bg-amber-500/20"
                      >
                        <Sparkles className="h-4 w-4" strokeWidth={2.5} />
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
                              className="inline-flex items-center gap-2 rounded-full bg-amber-500/5 px-4 py-2.5 text-xs font-bold text-amber-600/70 border border-amber-500/10 hover:bg-amber-500/10"
                            >
                              Ver tradução
                            </m.button>
                          )}
                          <m.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setShowAnswer(true)}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-container-low)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)]"
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
            className="grid grid-cols-3 gap-3"
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
                  ? 'bg-[var(--color-surface-container-low)] text-[var(--color-error)] border-[var(--color-error)]/10 hover:bg-[var(--color-error)]/5'
                  : button.quality === 3
                    ? 'bg-[var(--color-surface-container-low)] text-[var(--color-accent)] border-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/5'
                    : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-[0_4px_16px_rgba(70,98,89,0.2)]'

              return (
                <m.button
                  key={button.quality}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleReview(button.quality)}
                  disabled={isLoading}
                  className={`flex h-full flex-col items-center justify-center gap-1 rounded-[1.5rem] border py-4 px-2 text-center transition-all disabled:opacity-60 ${cardClass}`}
                >
                  <span className="text-base sm:text-lg font-bold">
                    {button.quality === 0 ? 'Errei' : button.quality === 3 ? 'Difícil' : 'Fácil'}
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
        <section className="grid gap-4 md:grid-cols-3">
          <div className="stitch-panel p-5">
            <p className="section-kicker">Composição</p>
            <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{stats.newCards}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Novos cards hoje</p>
          </div>
          <div className="stitch-panel p-5">
            <p className="section-kicker">Aprendizado</p>
            <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{stats.learning}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Ainda em consolidação</p>
          </div>
          <div className="stitch-panel p-5">
            <p className="section-kicker">Restantes</p>
            <p className="mt-4 text-3xl font-extrabold text-[var(--color-primary)]">{remaining}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Cards restantes nesta rodada
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
