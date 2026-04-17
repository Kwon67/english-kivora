import Link from 'next/link'
import { AlertCircle, ArrowLeft, ArrowRight, Brain, Flame, Target } from 'lucide-react'
import type { SessionErrorLog } from '@/components/shared/SessionErrorsViewer'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { formatAppDateTime, getAppDayStartUtcIso, getAppDateString, shiftAppDate } from '@/lib/timezone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProblemSession = {
  completed_at: string
  session_errors: SessionErrorLog[]
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
    { en: string; pt: string; count: number; lastSeen: string }
  >()

  for (const session of sessions) {
    for (const error of session.session_errors || []) {
      if (!error.card_id || !error.cards) continue

      const existing = problemMap.get(error.card_id) || {
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

  const topProblemWords = [...problemMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const recentSlips = [...problemMap.values()]
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, 8)

  const almostMastered = reviews
    .filter((review) => review.cards && review.repetitions >= 2 && review.quality >= 3)
    .slice(0, 8)

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <Link
        href="/home"
        transitionTypes={navBackTransitionTypes}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-white"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
        Voltar à home
      </Link>

      <section className="surface-hero p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Problem words</p>
            <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
              As palavras que mais te puxam para trás, agora organizadas.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              Use esta leitura para entender onde insistir, o que está quase firme e quais termos ainda precisam de repetição deliberada.
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
            <AlertCircle className="h-8 w-8" strokeWidth={1.8} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Palavras críticas
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{topProblemWords.length}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Escorregões recentes
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{recentSlips.length}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Quase dominadas
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{almostMastered.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-red-500" strokeWidth={1.8} />
            <div>
              <p className="section-kicker">Mais erradas</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Top palavras problemáticas</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {topProblemWords.length > 0 ? (
              topProblemWords.map((word) => (
                <div key={`${word.en}-${word.pt}`} className="rounded-[22px] border border-[var(--color-border)] bg-white/76 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-[var(--color-text)]">{word.en}</p>
                      <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">{word.pt}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                      {word.count}x
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Ainda não há erros suficientes para montar esta lista.
              </p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={1.8} />
            <div>
              <p className="section-kicker">Recentes</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Escorregões mais recentes</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentSlips.length > 0 ? (
              recentSlips.map((word) => (
                <div key={`${word.en}-${word.lastSeen}`} className="rounded-[22px] border border-[var(--color-border)] bg-white/76 p-4">
                  <p className="break-words font-semibold text-[var(--color-text)]">{word.en}</p>
                  <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">{word.pt}</p>
                  <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
                    Último erro: {formatAppDateTime(word.lastSeen)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nenhum escorregão recente por aqui.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={1.8} />
          <div>
            <p className="section-kicker">Quase dominadas</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Palavras que estão perto de firmar</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {almostMastered.length > 0 ? (
            almostMastered.map((review) => (
              <div key={review.card_id} className="rounded-[22px] border border-[var(--color-border)] bg-white/76 p-4">
                <p className="break-words font-semibold text-[var(--color-text)]">
                  {review.cards?.english_phrase}
                </p>
                <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">
                  {review.cards?.portuguese_translation}
                </p>
                <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
                  Próxima revisão: {formatAppDateTime(review.next_review_date)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Ainda não há cards quase dominados suficientes para listar.
            </p>
          )}
        </div>

        <div className="mt-6">
          <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary">
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
            Ir para a revisão
          </Link>
        </div>
      </section>
    </div>
  )
}
