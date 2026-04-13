'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, CheckCircle2, RotateCcw, X } from 'lucide-react'
import { getDueCards, submitCardReview } from '@/app/actions'
import { Card, Pack } from '@/types/database.types'

interface DueCard {
  id: string
  card_id: string
  pack_id: string
  cards: Card
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
    label: 'Apaguei',
    shortcut: '1',
    time: '1 min',
    className: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  },
  {
    quality: 1,
    label: 'Muito difícil',
    shortcut: '2',
    time: '10 min',
    className: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
  },
  {
    quality: 2,
    label: 'Dificil',
    shortcut: '3',
    time: '1 dia',
    className: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
  },
  {
    quality: 3,
    label: 'Bom',
    shortcut: '4',
    time: '',
    className: 'border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)] hover:bg-[rgba(43,122,11,0.16)]',
  },
  {
    quality: 4,
    label: 'Facil',
    shortcut: '5',
    time: '',
    className: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
  },
  {
    quality: 5,
    label: 'Muito fácil',
    shortcut: '6',
    time: '',
    className: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  },
]

export default function ReviewPage() {
  const router = useRouter()
  const [dueCards, setDueCards] = useState<DueCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [isHeaderHidden, setIsHeaderHidden] = useState(false)
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

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY

      setIsHeaderCollapsed(currentScrollY > 96)
      setIsHeaderHidden(showAnswer && currentScrollY > 180)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [showAnswer])

  useEffect(() => {
    if (!showAnswer) {
      setIsHeaderHidden(false)
    }
  }, [showAnswer])

  const currentCard = dueCards[currentIndex]
  const progress = dueCards.length > 0 ? (currentIndex / dueCards.length) * 100 : 0
  const remaining = Math.max(dueCards.length - currentIndex - 1, 0)

  async function handleReview(quality: number) {
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
      } else {
        router.push('/home?reviewComplete=true')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && dueCards.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="premium-card w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
            <Brain className="h-9 w-9 animate-pulse" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">Carregando revisão</h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
            Preparando seus cards para uma sessão mais focada.
          </p>
        </div>
      </div>
    )
  }

  if (dueCards.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 pb-10">
        <div className="premium-card w-full max-w-xl p-8 text-center sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
            <CheckCircle2 className="h-10 w-10" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-5xl font-semibold text-[var(--color-text)]">Tudo em dia.</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
            Você não tem cards para revisar agora. O sistema está limpo e pronto para a próxima rodada.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => router.push('/home')} className="btn-primary">
              Voltar para home
            </button>
            <button onClick={() => loadDueCards()} className="btn-ghost">
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
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
            <CheckCircle2 className="h-10 w-10" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-5xl font-semibold text-[var(--color-text)]">Revisão concluída.</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
            Você revisou {completedCount} cards nesta sessão. Continue sustentando o ritmo.
          </p>
          <button onClick={() => router.push('/home')} className="btn-primary mt-8">
            Voltar para home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      <header
        className={`sticky top-[5.5rem] z-40 px-4 transition-all duration-200 sm:px-6 ${
          isHeaderHidden ? 'pointer-events-none invisible -translate-y-4 opacity-0' : 'visible translate-y-0 opacity-100'
        }`}
      >
        <div
          className={`navbar-glass mx-auto max-w-[var(--page-width)] px-4 sm:px-5 transition-all duration-300 ${
            isHeaderCollapsed ? 'rounded-[22px] py-3 shadow-[0_22px_50px_-38px_rgba(17,32,51,0.65)]' : 'rounded-[28px] py-4'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)] transition-all duration-300 ${
                  isHeaderCollapsed ? 'h-10 w-10' : 'h-12 w-12'
                }`}
              >
                <Brain className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                  Focus review
                </p>
                <h1 className={`mt-1 font-semibold text-[var(--color-text)] transition-all duration-300 ${isHeaderCollapsed ? 'text-xl sm:text-2xl' : 'text-3xl'}`}>
                  {currentIndex + 1} de {dueCards.length} cards
                </h1>
                {!isHeaderCollapsed && (
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {stats.newCards} novos liberados hoje, limite diário {stats.dailyLimit}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`rounded-full border border-[var(--color-border)] bg-white/72 px-4 font-semibold text-[var(--color-text-muted)] transition-all duration-300 ${isHeaderCollapsed ? 'py-1.5 text-xs' : 'py-2 text-sm'} ${isHeaderCollapsed ? 'block' : 'hidden sm:block'}`}>
                Restam {remaining}
              </div>
              <button
                type="button"
                onClick={() => router.push('/home')}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/72 text-[var(--color-text-muted)] transition-colors hover:bg-white hover:text-[var(--color-text)]"
                aria-label="Fechar revisão"
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className={`overflow-hidden rounded-full bg-[rgba(17,32,51,0.08)] transition-all duration-300 ${isHeaderCollapsed ? 'mt-3 h-1.5' : 'mt-4 h-2'}`}>
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary))] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className={`mx-auto grid max-w-[var(--page-width)] gap-6 px-4 sm:px-6 xl:grid-cols-[1fr_320px] transition-all duration-300 ${isHeaderCollapsed ? 'mt-5' : 'mt-8'}`}>
        <section className="space-y-5">
          <div className="premium-card overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge border border-[var(--color-border)] bg-white/76 text-[var(--color-text-muted)]">
                {currentCard.isNew ? 'Novo card' : `Repeticao ${currentCard.repetitions}`}
              </span>
              {currentCard.packs?.name && (
                <span className="badge bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  {currentCard.packs.name}
                </span>
              )}
            </div>

            <div className="mt-8 rounded-[30px] bg-[linear-gradient(135deg,rgba(43,122,11,0.08),rgba(29,78,216,0.08),rgba(255,255,255,0.88))] p-6 sm:p-8">
              <svg
                aria-hidden="true"
                className="mb-6 h-auto w-full max-w-[220px]"
                viewBox="0 0 320 96"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20 56C53 34 83 23 112 23C149 23 182 35 214 58" stroke="#2B7A0B" strokeWidth="8" strokeLinecap="round" />
                <path d="M28 77C71 53 109 41 146 41C179 41 210 49 246 67" stroke="#1D4ED8" strokeWidth="8" strokeLinecap="round" />
                <circle cx="29" cy="77" r="10" fill="#112033" />
              </svg>

              <h2 className="max-w-3xl text-4xl font-semibold leading-[1.02] text-[var(--color-text)] sm:text-5xl">
                {currentCard.cards.english_phrase}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
                Leia, tente lembrar e revele a resposta so quando tiver uma tentativa mental pronta.
              </p>

              {showAnswer ? (
                <div className="mt-8 rounded-[26px] border border-[var(--color-border)] bg-white/76 p-5 animate-fade-in sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                    Tradução
                  </p>
                  <p className="mt-3 text-3xl font-semibold leading-tight text-[var(--color-primary)] sm:text-4xl">
                    {currentCard.cards.portuguese_translation}
                  </p>
                  {!currentCard.isNew && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="surface-muted p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Intervalo atual
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {currentCard.interval_days} dias
                        </p>
                      </div>
                      <div className="surface-muted p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Ease factor
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {currentCard.ease_factor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowAnswer(true)} className="btn-primary mt-8">
                  Mostrar resposta
                </button>
              )}
            </div>
          </div>

          {showAnswer && (
            <div className="card p-5 sm:p-6 animate-slide-up">
              <div className="mb-5">
                <p className="section-kicker">Rate the recall</p>
                <h3 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                  Como foi sua lembranca?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  Escolha a qualidade da resposta para recalcular o próximo momento de revisão.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {qualityButtons.map((button) => {
                  const estimate =
                    button.quality === 3
                      ? currentCard.isNew
                        ? '1 dia'
                        : `${Math.round(currentCard.interval_days * currentCard.ease_factor)} dias`
                      : button.quality === 4
                        ? currentCard.isNew
                          ? '4 dias'
                          : `${Math.round(currentCard.interval_days * currentCard.ease_factor * 1.3)} dias`
                        : button.quality === 5
                          ? currentCard.isNew
                            ? '7 dias'
                            : `${Math.round(currentCard.interval_days * currentCard.ease_factor * 1.5)} dias`
                          : button.time

                  return (
                    <button
                      key={button.quality}
                      type="button"
                      onClick={() => handleReview(button.quality)}
                      disabled={isLoading}
                      className={`rounded-[24px] border p-4 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${button.className}`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">
                        tecla {button.shortcut}
                      </p>
                      <p className="mt-3 text-lg font-semibold">{button.label}</p>
                      <p className="mt-2 text-sm opacity-80">Revisar em {estimate}</p>
                    </button>
                  )
                })}
              </div>

              <p className="mt-5 text-center text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Atalhos visuais atualizados para uma leitura mais rápida
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="section-kicker">Session mix</p>
            <div className="mt-4 grid gap-3">
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Novos
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{stats.newCards}</p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Aprendendo
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{stats.learning}</p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Revisao
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{stats.review}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <p className="section-kicker">Current card</p>
            <div className="mt-4 space-y-3">
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Concluidos
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{completedCount}</p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Restantes
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{remaining}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(17,32,51,0.97),rgba(15,118,110,0.88))] p-5 text-white shadow-[0_36px_80px_-50px_rgba(17,32,51,0.9)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Modo de foco</p>
            <p className="mt-4 text-2xl font-semibold leading-tight">
              Uma boa revisão depende de honestidade na avaliação.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/74">
              Se a lembrança veio fácil, marque fácil. Se precisou de muito esforço ou falhou, marque sem filtro.
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
