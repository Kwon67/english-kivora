import { Fragment } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  Check,
  Flame,
  Percent,
  TrendingUp,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import HistoryChart from '@/app/(dashboard)/history/HistoryChart'
import SessionErrorsViewer, { SessionErrorLog } from '@/components/shared/SessionErrorsViewer'
import type { GameSession, Pack, Profile } from '@/types/database.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type MemberSession = GameSession & {
  assignments: {
    status: string
    game_mode: string
    packs: Pick<Pack, 'name'> | null
  } | null
  session_errors: SessionErrorLog[]
}

export default async function MemberHistoryPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createClient()

  // Gate: only admins
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') redirect('/home')

  // Fetch target member profile
  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!member) notFound()

  // Fetch all sessions for this member
  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('*, assignments(status, game_mode, pack_id, packs(name)), session_errors(*, cards(english_phrase, portuguese_phrase))')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(100)

  // Aggregate stats
  const totalSessions = sessions?.length || 0
  const totalCorrect = sessions?.reduce((s, r) => s + r.correct_answers, 0) || 0
  const totalWrong = sessions?.reduce((s, r) => s + r.wrong_answers, 0) || 0
  const totalCards = totalCorrect + totalWrong
  const accuracy = totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0
  const bestStreak = sessions?.reduce((b, r) => Math.max(b, r.max_streak), 0) || 0

  // Chart data (chronological)
  const chartData = (sessions ?? [])
    .slice()
    .reverse()
    .map((s: MemberSession) => ({
      date: new Date(s.completed_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      acerto:
        s.correct_answers + s.wrong_answers > 0
          ? Math.round((s.correct_answers / (s.correct_answers + s.wrong_answers)) * 100)
          : 0,
      pack: s.assignments?.packs?.name || '',
    }))

  const statCards = [
    {
      label: 'Sessões',
      value: totalSessions,
      sub: 'Partidas registradas',
      color: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
      icon: BarChart3,
    },
    {
      label: 'Acerto médio',
      value: `${accuracy}%`,
      sub: 'Precisão consolidada',
      color: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
      icon: Percent,
    },
    {
      label: 'Cards certos',
      value: totalCorrect,
      sub: 'Soma de acertos',
      color: 'bg-emerald-50 text-emerald-600',
      icon: Check,
    },
    {
      label: 'Cards errados',
      value: totalWrong,
      sub: 'Soma de erros',
      color: 'bg-red-50 text-red-500',
      icon: X,
    },
    {
      label: 'Melhor streak',
      value: bestStreak,
      sub: 'Sequência máxima',
      color: 'bg-orange-50 text-orange-500',
      icon: Flame,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="surface-hero p-6 sm:p-8">
        <Link
          href="/admin/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          Voltar ao dashboard
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-3xl font-bold text-[var(--color-text)]">
              {(member as Profile).username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="section-kicker">Histórico individual</p>
              <h1 className="mt-2 text-responsive-lg font-semibold text-[var(--color-text)]">
                {(member as Profile).username}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">{(member as Profile).email}</p>
            </div>
          </div>

          <div className="rounded-[22px] border border-[var(--color-border)] bg-white/64 px-5 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
              Membro desde
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {new Date((member as Profile).created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="metric-tile">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] ${stat.color}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{stat.sub}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Accuracy chart */}
      {chartData.length > 0 && (
        <section className="card p-6 sm:p-7">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Accuracy curve</p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                Evolução da taxa de acerto
              </h2>
            </div>
            <div className="rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
              <TrendingUp className="mr-1.5 inline h-4 w-4" strokeWidth={2} />
              {chartData.length} sessões
            </div>
          </div>
          <HistoryChart data={chartData} />
        </section>
      )}

      {/* Session log table */}
      <section className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <p className="section-kicker">Session log</p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
            Detalhes de cada partida
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-white/72 text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Pack</th>
                <th className="px-6 py-4 font-semibold">Modo</th>
                <th className="px-6 py-4 text-center font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.4} />
                    Certo
                  </span>
                </th>
                <th className="px-6 py-4 text-center font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <X className="h-3.5 w-3.5 text-red-500" strokeWidth={2.4} />
                    Errado
                  </span>
                </th>
                <th className="px-6 py-4 text-center font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Taxa
                  </span>
                </th>
                <th className="px-6 py-4 text-center font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.4} />
                    Streak
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {sessions && sessions.length > 0 ? (
                sessions.map((session: MemberSession) => {
                  const total = session.correct_answers + session.wrong_answers
                  const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0
                  const modeLabelMap: Record<string, string> = {
                    multiple_choice: 'Múltipla escolha',
                    flashcard: 'Flashcard',
                    typing: 'Digitação',
                    matching: 'Associação',
                  }
                  const modeLabel = modeLabelMap[session.assignments?.game_mode ?? ''] ?? session.assignments?.game_mode ?? '—'

                  return (
                    <Fragment key={session.id}>
                    <tr className="transition-colors hover:bg-white/72">
                      <td className="px-6 py-4 text-[var(--color-text-muted)]">
                        <div>
                          <p>{new Date(session.completed_at).toLocaleDateString('pt-BR')}</p>
                          <p className="text-xs text-[var(--color-text-subtle)]">
                            {new Date(session.completed_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[var(--color-text)]">
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">
                            {session.assignments?.packs?.name ?? '—'}
                          </p>
                          {session.assignments?.status === 'incomplete' && (
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-500">
                              Abandonada (Incompleta)
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                          {modeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-600">
                        {session.correct_answers}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-red-500">
                        {session.wrong_answers}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            pct >= 80
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
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
                        <td colSpan={7} className="p-0 border-0">
                           <SessionErrorsViewer errors={session.session_errors} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[var(--color-text-muted)]">
                    Nenhuma partida registrada para este membro ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
