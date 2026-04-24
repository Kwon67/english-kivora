import Link from 'next/link'
import { ArrowLeft, Play, Search } from 'lucide-react'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { formatAppDateTime, getAppDayStartUtcIso, getAppDateString, shiftAppDate } from '@/lib/timezone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProblemSession = {
  completed_at: string
  session_errors: Array<{
    id: string
    created_at: string
    card_id: string | null
    cards: {
      english_phrase: string
      portuguese_translation: string
      audio_url?: string | null
    } | null
  }>
}

type ReviewCard = {
  card_id: string
  repetitions: number
  quality: number
  next_review_date: string
  cards: {
    english_phrase: string
    portuguese_translation: string
  } | null
}

export default async function ProblemWordsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const since = shiftAppDate(getAppDateString(), -30)

  const [sessionsResult, reviewsResult] = await Promise.all([
    supabase
      .from('game_sessions')
      .select('completed_at,session_errors(id,created_at,card_id,cards(english_phrase,portuguese_translation,audio_url))')
      .eq('user_id', user.id)
      .gte('completed_at', getAppDayStartUtcIso(since))
      .order('completed_at', { ascending: false })
      .limit(40),
    supabase
      .from('card_reviews')
      .select('card_id,repetitions,quality,next_review_date,cards(english_phrase,portuguese_translation)')
      .eq('user_id', user.id)
      .order('next_review_date', { ascending: true })
      .limit(80),
  ])

  const sessions = (sessionsResult.data as unknown as ProblemSession[] | null) || []
  const reviews = (reviewsResult.data as unknown as ReviewCard[] | null) || []

  const problemMap = new Map<
    string,
    { id: string; en: string; pt: string; count: number; lastSeen: string }
  >()

  for (const session of sessions) {
    for (const error of session.session_errors || []) {
      if (!error.card_id || !error.cards) continue
      const existing = problemMap.get(error.card_id) || {
        id: error.card_id,
        en: error.cards.english_phrase,
        pt: error.cards.portuguese_translation,
        count: 0,
        lastSeen: error.created_at,
      }
      existing.count += 1
      if (new Date(error.created_at).getTime() > new Date(existing.lastSeen).getTime()) {
        existing.lastSeen = error.created_at
      }
      problemMap.set(error.card_id, existing)
    }
  }

  const topProblemWords = [...problemMap.values()].sort((a, b) => b.count - a.count).slice(0, 8)
  const almostMastered = reviews
    .filter((review) => review.cards && review.repetitions >= 2 && review.quality >= 3)
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          transitionTypes={navBackTransitionTypes}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Kivora English</p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Palavras críticas</p>
        </div>
      </div>

      <section className="premium-card p-6 sm:p-7">
        <h1 className="text-4xl font-extrabold text-[var(--color-text)]">Palavras Críticas</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          Foque nestes termos que você erra com frequência para melhorar sua precisão.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-[1rem] bg-[var(--color-surface-container-low)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--color-text-subtle)]" />
          <span className="text-sm text-[var(--color-text-subtle)]">Buscar suas palavras críticas...</span>
        </div>
      </section>

      <section className="space-y-3">
        {topProblemWords.length > 0 ? (
          topProblemWords.map((word) => {
            const severity =
              word.count >= 3
                ? 'CRÍTICO'
                : word.count === 2
                  ? 'MÉDIO'
                  : 'LEVE'

            return (
              <article key={word.id} className="premium-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text)]">{word.en}</h2>
                      <span
                        className={`stitch-pill ${
                          severity === 'HIGH'
                            ? 'bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]'
                            : severity === 'MEDIUM'
                              ? 'bg-[rgba(115,88,2,0.08)] text-[var(--color-accent)]'
                              : 'bg-[var(--color-surface-container)] text-[var(--color-text-subtle)]'
                        }`}
                      >
                        {severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{word.pt}</p>
                    <p className="mt-3 text-xs text-[var(--color-text-subtle)]">
                      Último erro: {formatAppDateTime(word.lastSeen)}
                    </p>
                  </div>
                  <Link
                    href="/review"
                    transitionTypes={navForwardTransitionTypes}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Praticar agora
                  </Link>
                </div>
              </article>
            )
          })
        ) : (
          <div className="premium-card p-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Ainda não há erros suficientes para montar esta lista.
            </p>
          </div>
        )}
      </section>

      {almostMastered.length > 0 && (
        <section className="premium-card p-6 sm:p-7">
          <p className="section-kicker">Quase dominadas</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {almostMastered.map((review) => (
              <div key={review.card_id} className="rounded-[1rem] bg-[var(--color-surface-container-low)] p-4">
                <p className="text-sm font-bold text-[var(--color-text)]">{review.cards?.english_phrase}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{review.cards?.portuguese_translation}</p>
                <p className="mt-3 text-xs text-[var(--color-text-subtle)]">
                  Próxima revisão: {formatAppDateTime(review.next_review_date)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
