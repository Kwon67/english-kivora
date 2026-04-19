'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, CheckCircle2, RotateCcw, Volume2, X } from 'lucide-react'
import { getDueCards, submitCardReview } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AudioButton from '@/components/shared/AudioButton'
import { Card, Pack } from '@/types/database.types'

interface DueCard {
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
    className: 'border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)] hover:bg-[rgba(43,122,11,0.16)]',
  },
  {
    quality: 5,
    label: 'Fácil',
    shortcut: '3',
    time: '',
    className: 'border-[rgba(43,122,11,0.22)] bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[rgba(223,236,205,0.9)]',
  },
]

const qualityShortcutMap = new Map(qualityButtons.map((button) => [button.shortcut, button.quality]))

export default function ReviewPage() {
  const router = useRouter()
  const [dueCards, setDueCards] = useState<DueCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)
  const [stats, setStats] = useState({
    newCards: 0,
    learning: 0,
    review: 0,
    dailyLimit: 0,
  })

  const loadDueCards = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await getDueCards()
      const cards = result.dueCards as unknown as DueCard[]
      setDueCards(cards)

      const newCards = cards.filter((card) => card.isNew).length
      const learning = cards.filter((card) => !card.isNew && card.repetitions < 2).length
      const review = cards.filter((card) => !card.isNew && card.repetitions >= 2).length

      setStats({
        newCards,
        learning,
        review,
        dailyLimit: result.newCardsLimit || 0,
      })
    } catch (error) {
      console.error('Error loading due cards:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDueCards()
  }, [loadDueCards])

  const currentCard = dueCards[currentIndex]
  const progress = dueCards.length > 0 ? (currentIndex / dueCards.length) * 100 : 0
  const remaining = Math.max(dueCards.length - currentIndex - 1, 0)

  const handleReview = useCallback(async (quality: number) => {
    if (!currentCard) return

    setIsLoading(true)

    try {
      await submitCardReview({
        cardId: currentCard.card_id || currentCard.id,
        packId: currentCard.pack_id,
        quality,
        previousInterval: currentCard.isNew ? undefined : currentCard.interval_days,
        previousEaseFactor: currentCard.isNew ? undefined : currentCard.ease_factor,
        previousRepetitions: currentCard.isNew ? undefined : currentCard.repetitions,
        previousTotalReviews: currentCard.isNew ? 0 : currentCard.total_reviews || 0,
      })

      setCompletedCount((prev) => prev + 1)

      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setShowAnswer(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        router.push('/home?reviewComplete=true', { transitionTypes: navBackTransitionTypes })
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentCard, currentIndex, dueCards.length, router])

  useEffect(() => {
    if (!showAnswer || isLoading) return

    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
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
          <h2 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">Loading review</h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
            Preparing your cards for a calmer, sharper review session.
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
            <button
              type="button"
              onClick={() => loadDueCards()}
              className="btn-ghost"
            >
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
              <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">Daily Review</h1>
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
        <section className="premium-card relative aspect-[4/3] overflow-hidden border-[rgba(193,200,196,0.28)] p-8 shadow-[0_8px_32px_rgba(27,28,24,0.05)]">
          <div className="absolute left-6 top-6">
            <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
              {currentCard.isNew ? 'New card' : `Review ${currentCard.repetitions}`}
            </span>
          </div>

          {currentCard.cards.audio_url && (
            <div className="absolute right-5 top-5">
              <AudioButton url={currentCard.cards.audio_url} autoPlay={true} className="!mt-0" />
            </div>
          )}

          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="max-w-xl text-balance text-5xl font-bold tracking-tight text-[var(--color-text)] sm:text-6xl">
              {currentCard.cards.english_phrase}
            </h2>

            {showAnswer ? (
              <div className="mt-6 space-y-3 animate-fade-in">
                <p className="text-lg text-[var(--color-text-muted)]">
                  {currentCard.cards.portuguese_translation}
                </p>
                {!currentCard.isNew && (
                  <p className="text-sm italic text-[var(--color-text-subtle)]">
                    Intervalo atual: {currentCard.interval_days} dia{currentCard.interval_days === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-8">
                <p className="text-sm text-[var(--color-text-subtle)]">Tap to reveal</p>
                <button
                  type="button"
                  onClick={() => setShowAnswer(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-container-low)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)]"
                >
                  <Volume2 className="h-4 w-4" strokeWidth={2} />
                  Mostrar resposta
                </button>
              </div>
            )}
          </div>
        </section>

        {showAnswer && (
          <section className="grid grid-cols-3 gap-3 animate-slide-up">
            {qualityButtons.map((button) => {
              const estimate =
                button.quality === 3
                  ? currentCard.isNew
                    ? '1d'
                    : `${Math.round(currentCard.interval_days * currentCard.ease_factor)}d`
                  : button.quality === 5
                    ? currentCard.isNew
                      ? '4d'
                      : `${Math.round(currentCard.interval_days * currentCard.ease_factor * 1.5)}d`
                    : '1m'

              const cardClass =
                button.quality === 0
                  ? 'bg-[var(--color-surface-container-low)] text-[var(--color-error)] border-[rgba(186,26,26,0.08)]'
                  : button.quality === 3
                    ? 'bg-[var(--color-surface-container-low)] text-[var(--color-accent)] border-[rgba(115,88,2,0.08)]'
                    : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[rgba(70,98,89,0.18)] shadow-[0_4px_16px_rgba(70,98,89,0.2)]'

              return (
                <button
                  key={button.quality}
                  type="button"
                  onClick={() => handleReview(button.quality)}
                  disabled={isLoading}
                  className={`flex flex-col items-center gap-1 rounded-[1.5rem] border py-4 text-center transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${cardClass}`}
                >
                  <span className="text-lg font-semibold">{button.quality === 0 ? 'Again' : button.quality === 3 ? 'Hard' : 'Easy'}</span>
                  <span className={`text-xs uppercase tracking-[0.14em] ${button.quality === 5 ? 'text-[var(--color-on-primary-container)]/80' : 'opacity-70'}`}>
                    {estimate}
                  </span>
                </button>
              )
            })}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="stitch-panel p-5">
            <p className="section-kicker">Session mix</p>
            <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{stats.newCards}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Novos cards hoje</p>
          </div>
          <div className="stitch-panel p-5">
            <p className="section-kicker">Learning</p>
            <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{stats.learning}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Ainda em consolidação</p>
          </div>
          <div className="stitch-panel p-5">
            <p className="section-kicker">Remaining</p>
            <p className="mt-4 text-3xl font-extrabold text-[var(--color-primary)]">{remaining}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Cards restantes nesta rodada</p>
          </div>
        </section>
      </main>
    </div>
  )
}
