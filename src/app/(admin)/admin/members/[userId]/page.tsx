import { Fragment } from 'react'
import { notFound, redirect } from 'next/navigation'
import {
  BarChart3,
  Check,
  Flame,
  Percent,
  TrendingUp,
  X,
} from 'lucide-react'
import { parseAssignmentStatus } from '@/lib/assignmentStatus'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatAppDate, formatAppTime } from '@/lib/timezone'
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

  const adminSupabase = createAdminClient() ?? supabase

  // Fetch target member profile
  const { data: member, error: memberError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (memberError) {
    console.error('Admin member profile query failed', { userId, memberError })
  }

  if (!member) notFound()

  // Fetch all sessions for this member
  const { data: sessions, error: sessionsError } = await adminSupabase
    .from('game_sessions')
    .select('*, assignments(status, game_mode, pack_id, packs(name)), session_errors(*, cards(english_phrase, portuguese_translation, audio_url))')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(100)

  if (sessionsError) {
    console.error('Admin member sessions query failed', { userId, sessionsError })
    throw new Error('Falha ao carregar o histórico do membro.')
  }

  const typedSessions = (sessions ?? []) as unknown as MemberSession[]

  // Aggregate stats
  const totalSessions = typedSessions.length
  const totalCorrect = typedSessions.reduce((s, r) => s + r.correct_answers, 0)
  const totalWrong = typedSessions.reduce((s, r) => s + r.wrong_answers, 0)
  const totalCards = totalCorrect + totalWrong
  const accuracy = totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0
  const bestStreak = typedSessions.reduce((b, r) => Math.max(b, r.max_streak), 0)

  // Chart data (chronological)
  const chartData = typedSessions
    .slice()
    .reverse()
    .map((s) => ({
      date: formatAppDate(s.completed_at, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
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
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: BarChart3,
    },
    {
      label: 'Acerto médio',
      value: `${accuracy}%`,
      sub: 'Precisão consolidada',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      icon: Percent,
    },
    {
      label: 'Cards certos',
      value: totalCorrect,
      sub: 'Soma de acertos',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Check,
    },
    {
      label: 'Cards errados',
      value: totalWrong,
      sub: 'Soma de erros',
      color: 'bg-rose-50 text-rose-700 border-rose-100',
      icon: X,
    },
    {
      label: 'Melhor streak',
      value: bestStreak,
      sub: 'Sequência máxima',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: Flame,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 editorial-shadow">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-slate-900 text-white text-3xl font-black shadow-xl">
              {(member as Profile).username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="section-kicker">Membro do workspace</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 tracking-tighter">
                {(member as Profile).username}
              </h1>
              <p className="text-sm font-bold text-slate-400 mt-1">{(member as Profile).email}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Inscrito em
            </p>
            <p className="mt-1 text-sm font-black text-slate-700">
              {formatAppDate((member as Profile).created_at)}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 transition-all hover:bg-white hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-black text-slate-900 tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${stat.color}`}>
                    <Icon className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{stat.sub}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Accuracy chart */}
      {chartData.length > 0 && (
        <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 editorial-shadow">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
            <div>
              <p className="section-kicker">Performance analytics</p>
              <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tighter">
                Curva de acerto
              </h2>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 uppercase tracking-widest">
              {chartData.length} sessões registradas
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
            <HistoryChart data={chartData} />
          </div>
        </section>
      )}

      {/* Session log table */}
      <section className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden editorial-shadow">
        <div className="border-b border-slate-100 px-10 py-8">
          <p className="section-kicker">Activity log</p>
          <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tighter">
            Sessões completas
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-8 py-5">Data</th>
                <th className="px-6 py-5">Pack</th>
                <th className="px-6 py-5">Modo</th>
                <th className="px-6 py-5 text-center">Certo</th>
                <th className="px-6 py-5 text-center">Errado</th>
                <th className="px-6 py-5 text-center">Precisão</th>
                <th className="px-8 py-5 text-center">Streak</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {typedSessions.length > 0 ? (
                typedSessions.map((session) => {
                  const total = session.correct_answers + session.wrong_answers
                  const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0
                  const modeLabelMap: Record<string, string> = {
                    multiple_choice: 'Múltipla',
                    flashcard: 'Flashcard',
                    typing: 'Digitação',
                    matching: 'Associação',
                  }
                  const modeLabel = modeLabelMap[session.assignments?.game_mode ?? ''] ?? session.assignments?.game_mode ?? '—'
                  const statusMeta = parseAssignmentStatus(session.assignments?.status)

                  return (
                    <Fragment key={session.id}>
                    <tr className="transition-colors hover:bg-slate-50/30">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-700">
                          {formatAppDate(session.completed_at)}
                        </p>
                        <p className="text-[10px] font-black text-slate-300 uppercase mt-0.5">
                          {formatAppTime(session.completed_at)}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-800 tracking-tight">
                          {session.assignments?.packs?.name ?? 'Revisão'}
                        </p>
                        {statusMeta.baseStatus === 'incomplete' && (
                          <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded w-max">
                            Incompleta
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200">
                          {modeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-emerald-600">
                        {session.correct_answers}
                      </td>
                      <td className="px-6 py-5 text-center font-black text-rose-500">
                        {session.wrong_answers}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${
                            pct >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : pct >= 50
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700 border border-indigo-100">
                          <Flame className="h-3.5 w-3.5" strokeWidth={3} />
                          {session.max_streak}
                        </span>
                      </td>
                    </tr>
                    {session.session_errors && session.session_errors.length > 0 && (
                      <tr className="border-0">
                        <td colSpan={7} className="p-0 border-0 bg-slate-50/50">
                           <SessionErrorsViewer errors={session.session_errors} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sem registros</p>
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
