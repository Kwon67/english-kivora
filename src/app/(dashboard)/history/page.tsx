import Link from 'next/link'
import { ArrowLeft, BookOpen, Flame, Percent, TrendingUp } from 'lucide-react'
import { parseAssignmentStatus } from '@/lib/assignmentStatus'
import { createClient } from '@/lib/supabase/server'
import { formatAppDate } from '@/lib/timezone'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import HistoryChart from './HistoryChart'
import SessionErrorsViewer, { SessionErrorLog } from '@/components/shared/SessionErrorsViewer'

type HistorySession = {
  id: string
  completed_at: string
  correct_answers: number
  wrong_answers: number
  max_streak: number
  assignments: {
    status: string
    packs: { name: string } | null
  } | null
  session_errors: SessionErrorLog[]
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { date: filterDate } = await searchParams

  let query = supabase
    .from('game_sessions')
    .select('id,completed_at,correct_answers,wrong_answers,max_streak,assignments(status,packs(name)),session_errors(id,created_at,card_id,cards(english_phrase,portuguese_translation,audio_url))')
    .eq('user_id', user.id)

  if (filterDate) {
    query = query.gte('completed_at', `${filterDate}T00:00:00.000Z`).lte('completed_at', `${filterDate}T23:59:59.999Z`)
  } else {
    query = query.limit(50)
  }

  const { data: sessions, error: sessionsError } = await query.order('completed_at', { ascending: false })

  if (sessionsError) {
    console.error('History page query failed', { userId: user.id, sessionsError })
    throw new Error('Falha ao carregar o histórico do usuário.')
  }

  const typedSessions = (sessions ?? []) as unknown as HistorySession[]

  const chartData = typedSessions.map((session) => ({
    date: formatAppDate(session.completed_at, { day: '2-digit', month: '2-digit' }),
    acerto:
      session.correct_answers + session.wrong_answers > 0
        ? Math.round((session.correct_answers / (session.correct_answers + session.wrong_answers)) * 100)
        : 0,
    pack: session.assignments?.packs?.name || '',
  }))

  const totalSessions = typedSessions.length
  const totalCorrect = typedSessions.reduce((sum, session) => sum + session.correct_answers, 0)
  const totalWrong = typedSessions.reduce((sum, session) => sum + session.wrong_answers, 0)
  const averageAccuracy =
    totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0
  const bestStreak = typedSessions.reduce((best, session) => Math.max(best, session.max_streak), 0)

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8 animate-fade-in">
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
          <div className="flex items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">History analytics</p>
            {filterDate && (
              <span className="rounded-full bg-[rgba(115,88,2,0.12)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-accent)]">
                {filterDate.split('-').reverse().join('/')}
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="premium-card p-6 text-center">
          <p className="section-kicker mx-auto">English proficiency</p>
          <p className="mt-5 text-4xl font-extrabold text-[var(--color-primary)]">{averageAccuracy}%</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Precisão média consolidada</p>
        </article>

        <article className="premium-card p-6 text-center">
          <p className="section-kicker mx-auto">Total correct</p>
          <p className="mt-5 text-4xl font-extrabold text-[var(--color-text)]">{totalCorrect}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Respostas corretas acumuladas</p>
        </article>

        <article className="premium-card p-6 text-center">
          <p className="section-kicker mx-auto">Best streak</p>
          <p className="mt-5 text-4xl font-extrabold text-[var(--color-accent)]">{bestStreak}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Maior sequência em uma sessão</p>
        </article>
      </section>

      {chartData.length > 0 && (
        <section className="premium-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Rank progression</p>
              <h1 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">History Analytics</h1>
            </div>
            <div className="rounded-full bg-[var(--color-surface-container-low)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
              {totalSessions} sessões
            </div>
          </div>
          <div className="mt-6 h-72">
            <HistoryChart data={chartData.reverse()} />
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="stitch-panel p-5">
          <TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{totalSessions}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Sessões registradas</p>
        </article>
        <article className="stitch-panel p-5">
          <Percent className="h-5 w-5 text-[var(--color-primary)]" />
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{totalWrong}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Erros identificados</p>
        </article>
        <article className="stitch-panel p-5">
          <Flame className="h-5 w-5 text-[var(--color-accent)]" />
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{bestStreak}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Foco máximo</p>
        </article>
      </section>

      <section className="premium-card overflow-hidden">
        <div className="border-b border-[rgba(193,200,196,0.32)] px-4 py-5 sm:px-6">
          <h2 className="text-2xl font-extrabold text-[var(--color-text)]">Focus Areas</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Leitura rápida das suas sessões recentes.</p>
        </div>

        <div className="divide-y divide-[rgba(193,200,196,0.24)]">
          {typedSessions.length > 0 ? (
            typedSessions.slice(0, 10).map((session) => {
              const total = session.correct_answers + session.wrong_answers
              const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0
              const statusMeta = parseAssignmentStatus(session.assignments?.status)

              return (
                <div key={session.id} className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--color-text)]">
                        {session.assignments?.packs?.name || 'Sessão'}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                        {formatAppDate(session.completed_at, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}{' '}
                        •{' '}
                        {statusMeta.baseStatus === 'incomplete'
                          ? 'Abandonada'
                          : statusMeta.completedWithinTime === false
                            ? 'Fora do tempo'
                            : 'Concluída'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="stitch-pill bg-[rgba(70,98,89,0.1)] text-[var(--color-primary)]">
                        {session.correct_answers} certos
                      </span>
                      <span className="stitch-pill bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]">
                        {session.wrong_answers} erros
                      </span>
                      <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {session.session_errors && session.session_errors.length > 0 && (
                    <div className="mt-4">
                      <SessionErrorsViewer errors={session.session_errors} />
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="px-6 py-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-[var(--color-text-subtle)]" />
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                {filterDate 
                  ? 'Nenhuma sessão registrada neste dia.'
                  : 'Jogue uma lição para começar a formar seu histórico.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
