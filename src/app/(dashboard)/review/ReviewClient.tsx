'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, CheckCircle2, Eye, RotateCcw, X } from 'lucide-react'
import { getDueCards, submitCardReview } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AudioButton from '@/components/shared/AudioButton'
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
  const [isLoading, setIsLoading] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [stats, setStats] = useState<ReviewStats>(initialStats)

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

  const currentCard = dueCards[currentIndex]
  const progress = dueCards.length > 0 ? (currentIndex / dueCards.length) * 100 : 0
  const remaining = Math.max(dueCards.length - currentIndex - 1, 0)

  const handleReview = useCallback(
    async (quality: number) => {
      if (!currentCard) return

      setIsLoading(true)

      try {
        const result = await submitCardReview({
          cardId: currentCard.card_id || currentCard.id,
          packId: currentCard.pack_id,
          quality,
          previousInterval: currentCard.isNew ? undefined : currentCard.interval_days,
          previousEaseFactor: currentCard.isNew ? undefined : currentCard.ease_factor,
          previousRepetitions: currentCard.isNew ? undefined : currentCard.repetitions,
          previousTotalReviews: currentCard.isNew ? 0 : currentCard.total_reviews || 0,
        })

        const isLastCard = currentIndex === dueCards.length - 1
        const willContinue = !isLastCard || quality === 0

        if (quality === 0) {
          setDueCards((prev) => [
            ...prev,
            {
              ...currentCard,
              isNew: false,
              interval_days: result.reviewResult?.intervalDays ?? 1,
              ease_factor: result.reviewResult?.easeFactor ?? Math.max(1.3, (currentCard.ease_factor || 2.5) - 0.2),
              repetitions: 0,
              total_reviews: (currentCard.total_reviews || 0) + 1,
            },
          ])
        } else {
          setCompletedCount((prev) => prev + 1)
        }

        if (willContinue) {
          setCurrentIndex((prev) => prev + 1)
          setShowAnswer(false)
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
    [currentCard, currentIndex, dueCards.length, router]
  )

  useEffect(() => {
    if (!showAnswer || isLoading) return

    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }

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
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
            <CheckCircle2 className="h-10 w-10" strokeWidth={1.8} />
          </div>
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

  if (!currentCard) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="premium-card w-full max-w-xl p-8 text-center sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
            <CheckCircle2 className="h-10 w-10" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-5xl font-semibold text-[var(--color-text)]">Revisão concluída.</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
            Você revisou {completedCount} cards nesta sessão. Continue sustentando o ritmo.
          </p>
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
    <div className="mx-auto max-w-2xl pb-10">
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
            <button
              type="button"
              onClick={() => router.push('/home', { transitionTypes: navBackTransitionTypes })}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]"
              aria-label="Fechar revisão"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
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
        <section className="premium-card overflow-hidden border-[rgba(193,200,196,0.28)] p-5 shadow-[0_8px_32px_rgba(27,28,24,0.05)] sm:p-8">
          <div className="flex min-h-[22rem] flex-col sm:min-h-[24rem]">
            <div className="flex items-start justify-between gap-3">
              <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
                {getCardStageLabel(currentCard)}
              </span>

              {currentCard.cards.audio_url && (
                <AudioButton
                  url={currentCard.cards.audio_url}
                  autoPlay={true}
                  className="!mt-0 shrink-0"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col justify-center py-6 text-center sm:py-8">
              <h2 className="text-responsive-lg mx-auto max-w-[12ch] text-balance text-[var(--color-text)] sm:text-responsive-xl">
                {currentCard.cards.english_phrase}
              </h2>

              {showAnswer ? (
                <div className="mx-auto mt-6 w-full max-w-xl animate-fade-in rounded-[1.4rem] border border-[rgba(193,200,196,0.32)] bg-[var(--color-surface-container-low)] px-5 py-4 sm:px-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    Significado
                  </p>
                  <p className="mt-3 text-base font-semibold leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
                    {currentCard.cards.portuguese_translation}
                  </p>
                  {!currentCard.isNew && (
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                      Intervalo atual: {currentCard.interval_days} dia
                      {currentCard.interval_days === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className="text-sm text-[var(--color-text-subtle)]">Toque para revelar</p>
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-container-low)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)]"
                  >
                    <Eye className="h-4 w-4" strokeWidth={2} />
                    Mostrar resposta
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {showAnswer && (
          <section className="grid grid-cols-3 gap-3 animate-slide-up">
            {qualityButtons.map((button) => {
              const estimate =
                button.quality === 3
                  ? currentCard.isNew
                    ? '1 dia'
                    : `${Math.round(Math.max(1, currentCard.interval_days) * currentCard.ease_factor)} dias`
                  : button.quality === 5
                    ? currentCard.isNew
                      ? '4 dias'
                      : `${Math.round(Math.max(1, currentCard.interval_days) * currentCard.ease_factor * 1.5)} dias`
                    : '1m'

              const cardClass =
                button.quality === 0
                  ? 'bg-[var(--color-surface-container-low)] text-[var(--color-error)] border-[var(--color-error)]/10 hover:bg-[var(--color-error)]/5'
                  : button.quality === 3
                    ? 'bg-[var(--color-surface-container-low)] text-[var(--color-accent)] border-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/5'
                    : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-[0_4px_16px_rgba(70,98,89,0.2)]'

              return (
                <button
                  key={button.quality}
                  type="button"
                  onClick={() => handleReview(button.quality)}
                  disabled={isLoading}
                  className={`flex h-full flex-col items-center justify-center gap-1 rounded-[1.5rem] border py-4 px-2 text-center transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 ${cardClass}`}
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
                </button>
              )
            })}
          </section>
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
