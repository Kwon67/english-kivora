import { Fragment } from 'react'
import Link from 'next/link'
import { BarChart3, BookOpen, Check, Flame, Percent, TrendingUp, X, ArrowLeft } from 'lucide-react'
import { parseAssignmentStatus } from '@/lib/assignmentStatus'
import { createClient } from '@/lib/supabase/server'
import { formatAppDate } from '@/lib/timezone'
import HistoryChart from './HistoryChart'
import SessionErrorsViewer, { SessionErrorLog } from '@/components/shared/SessionErrorsViewer'
import type { GameSession, Pack } from '@/types/database.types'

type HistorySession = GameSession & {
  assignments: {
    status: string
    packs: Pick<Pack, 'name'> | null
  } | null
  session_errors: SessionErrorLog[]
}

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sessions, error: sessionsError } = await supabase
    .from('game_sessions')
    .select('*, assignments(status, pack_id, packs(name)), session_errors(*, cards(english_phrase, portuguese_translation))')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(50)

  if (sessionsError) {
    console.error('History page query failed', { userId: user.id, sessionsError })
    throw new Error('Falha ao carregar o histórico do usuário.')
  }

  const typedSessions = (sessions ?? []) as unknown as HistorySession[]

  const chartData =
    typedSessions.map((session) => ({
      date: formatAppDate(session.completed_at, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      acerto:
        session.correct_answers + session.wrong_answers > 0
          ? Math.round(
              (session.correct_answers / (session.correct_answers + session.wrong_answers)) * 100
            )
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
    <div className="space-y-8 animate-fade-in pb-20">
      <Link
        href="/home"
        className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-white"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
        Voltar ao painel principal
      </Link>

      <section className="surface-hero p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Performance timeline</p>
            <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
              Seu histórico agora parece progresso, não tabela crua.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              Veja a evolucao das suas sessoes, acompanhe a taxa de acerto e identifique ritmo real de estudo.
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
            <BarChart3 className="h-8 w-8" strokeWidth={1.8} />
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Sessoes
            </p>
            <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{totalSessions}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Ultimas partidas registradas</p>
          </div>

          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Acerto medio
            </p>
            <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{averageAccuracy}%</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Precisao consolidada</p>
          </div>

          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Melhor streak
            </p>
            <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{bestStreak}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Sequência máxima em uma sessão</p>
          </div>

          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Cards certos
            </p>
            <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{totalCorrect}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Somando todas as sessoes</p>
          </div>
        </div>
      </section>

      {chartData.length > 0 && (
        <section className="card p-6 sm:p-7">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Accuracy curve</p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                Evolucao da taxa de acerto
              </h2>
            </div>

            <div className="rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
              Ultimas {chartData.length} sessoes
            </div>
          </div>

          <HistoryChart data={chartData.reverse()} />
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Session log</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Detalhes das partidas</h2>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Leitura rápida de acertos, erros e intensidade de cada treino.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/72 text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Pack</th>
                <th className="px-6 py-4 font-semibold text-center">
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={2.4} />
                    Certo
                  </span>
                </th>
                <th className="px-6 py-4 font-semibold text-center">
                  <span className="inline-flex items-center gap-1">
                    <X className="h-3.5 w-3.5 text-red-500" strokeWidth={2.4} />
                    Errado
                  </span>
                </th>
                <th className="px-6 py-4 font-semibold text-center">
                  <span className="inline-flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Taxa
                  </span>
                </th>
                <th className="px-6 py-4 font-semibold text-center">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.4} />
                    Streak
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {typedSessions.length > 0 ? (
                typedSessions.map((session) => {
                  const total = session.correct_answers + session.wrong_answers
                  const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0
                  const statusMeta = parseAssignmentStatus(session.assignments?.status)

                  return (
                    <Fragment key={session.id}>
                    <tr className="transition-colors hover:bg-white/72">
                      <td className="px-6 py-4 text-[var(--color-text-muted)]">
                        {formatAppDate(session.completed_at, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">
                            {session.assignments?.packs?.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                            {statusMeta.baseStatus === 'incomplete' ? (
                              <span className="text-red-500 font-semibold">Abandonada</span>
                            ) : statusMeta.completedWithinTime === true ? (
                              <span className="font-semibold text-[var(--color-primary)]">Dentro do tempo</span>
                            ) : statusMeta.completedWithinTime === false ? (
                              <span className="font-semibold text-amber-700">Fora do tempo</span>
                            ) : (
                              'Session'
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-[var(--color-primary)]">
                        {session.correct_answers}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-red-500">
                        {session.wrong_answers}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            pct >= 80
                              ? 'border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)]'
                              : pct >= 50
                                ? 'border border-amber-200 bg-amber-50 text-amber-700'
                                : 'border border-red-200 bg-red-50 text-red-700'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                          <Flame className="h-3.5 w-3.5" strokeWidth={2.2} />
                          {session.max_streak}
                        </span>
                      </td>
                    </tr>
                    {session.session_errors && session.session_errors.length > 0 && (
                      <tr className="border-0 bg-white/30">
                        <td colSpan={6} className="p-0 border-0">
                           <SessionErrorsViewer errors={session.session_errors} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
                        <BookOpen className="h-8 w-8" strokeWidth={1.8} />
                      </div>
                      <h3 className="mt-5 text-3xl font-semibold text-[var(--color-text)]">
                        Nenhuma sessão registrada
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                        Jogue uma lição para começar a formar o seu histórico de desempenho.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {totalSessions > 0 && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <TrendingUp className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Curva de aprendizagem</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Leitura geral
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Quanto mais regular a frequencia, mais previsivel fica a sua taxa de acerto ao longo das sessoes.
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
                <Percent className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Precisao media</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Base atual
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {averageAccuracy}% mostra seu estado geral no conjunto mais recente de partidas.
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                <Flame className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Pico de foco</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Melhor sessão
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Seu melhor streak até aqui foi {bestStreak}. Esse número indica concentração e consistência dentro da mesma partida.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
