import { Fragment } from 'react'
import { notFound, redirect } from 'next/navigation'
import {
  BarChart3,
  Check,
  Flame,
  Percent,
  X,
} from 'lucide-react'
import { parseAssignmentStatus } from '@/lib/assignmentStatus'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatAppDate, formatAppTime } from '@/lib/timezone'
import HistoryChart from '@/app/(dashboard)/history/HistoryChart'
import SessionErrorsViewer, { SessionErrorLog } from '@/components/shared/SessionErrorsViewer'
import LevelSelector from './LevelSelector'
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

  // Fetch auth user for metadata (english level)
  const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId)
  const userMeta = authUser?.user?.user_metadata || {}
  const englishLevel = userMeta.english_level || 'B2'
  
  async function updateLevelAction(formData: FormData) {
    'use server'
    const { updateMemberLevel } = await import('@/app/actions')
    const levelCode = formData.get('level') as string
    const levels: Record<string, string> = {
      'A1': 'Iniciante',
      'A2': 'Básico',
      'B1': 'Intermediário',
      'B2': 'Intermediário superior',
      'C1': 'Avançado',
      'C2': 'Proficiente',
    }
    const levelName = levels[levelCode] || 'Intermediário superior'
    await updateMemberLevel(userId, levelCode, levelName)
  }

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
      <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] rounded-[2.5rem] p-8 md:p-10 editorial-shadow">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-[var(--color-primary)] text-[var(--color-on-primary)] text-3xl font-black shadow-xl">
              {(member as Profile).username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="section-kicker">Membro do ambiente</p>
              <h1 className="mt-2 text-3xl font-black text-[var(--color-text)] tracking-tighter">
                {(member as Profile).username}
              </h1>
              <p className="text-sm font-bold text-[var(--color-text-subtle)] mt-1">{(member as Profile).email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LevelSelector englishLevel={englishLevel} action={updateLevelAction} />

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-6 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                Inscrito em
              </p>
              <p className="mt-1 text-sm font-black text-[var(--color-text)]">
                {formatAppDate((member as Profile).created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-[var(--color-surface-container-low)] border border-[var(--color-border)] rounded-2xl p-6 transition-all hover:bg-[var(--color-surface-container-lowest)] hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-black text-[var(--color-text)] tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${stat.color}`}>
                    <Icon className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-tighter">{stat.sub}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Accuracy chart */}
      {chartData.length > 0 && (
        <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] rounded-[2.5rem] p-8 md:p-10 editorial-shadow">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
            <div>
              <p className="section-kicker">Análise de desempenho</p>
              <h2 className="mt-4 text-3xl font-black text-[var(--color-text)] tracking-tighter">
                Curva de acerto
              </h2>
            </div>
            <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-2 text-xs font-black text-[var(--color-primary)] uppercase tracking-widest">
              {chartData.length} sessões registradas
            </div>
          </div>
          <div className="bg-[var(--color-surface-container-low)] border border-[var(--color-border)] rounded-[2rem] p-6">
            <HistoryChart data={chartData} />
          </div>
        </section>
      )}

      {/* Session log table */}
      <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden editorial-shadow">
        <div className="border-b border-[var(--color-border)] px-10 py-8">
          <p className="section-kicker">Registro de atividades</p>
          <h2 className="mt-4 text-3xl font-black text-[var(--color-text)] tracking-tighter">
            Sessões completas
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-container-low)]/50 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] border-b border-[var(--color-border)]">
                <th className="px-8 py-5">Data</th>
                <th className="px-6 py-5">Pack</th>
                <th className="px-6 py-5">Modo</th>
                <th className="px-6 py-5 text-center">Certo</th>
                <th className="px-6 py-5 text-center">Errado</th>
                <th className="px-6 py-5 text-center">Precisão</th>
                <th className="px-8 py-5 text-center">Sequência</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {typedSessions.length > 0 ? (
                typedSessions.map((session) => {
                  const total = session.correct_answers + session.wrong_answers
                  const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0
                  const modeLabelMap: Record<string, string> = {
                    multiple_choice: 'Múltipla',
                    flashcard: 'Flashcard',
                    typing: 'Digitação',
                    matching: 'Associação',
                    listening: 'Escuta',
                    speaking: 'Fala',
                  }
                  const modeLabel = modeLabelMap[session.assignments?.game_mode ?? ''] ?? session.assignments?.game_mode ?? '—'
                  const statusMeta = parseAssignmentStatus(session.assignments?.status)

                  return (
                    <Fragment key={session.id}>
                    <tr className="transition-colors hover:bg-[var(--color-surface-container-low)]/30">
                      <td className="px-8 py-5">
                        <p className="font-bold text-[var(--color-text)]">
                          {formatAppDate(session.completed_at)}
                        </p>
                        <p className="text-[10px] font-black text-[var(--color-text-subtle)] uppercase mt-0.5">
                          {formatAppTime(session.completed_at)}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-[var(--color-text)] tracking-tight">
                          {session.assignments?.packs?.name ?? 'Revisão'}
                        </p>
                        {statusMeta.baseStatus === 'incomplete' && (
                          <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-error)] bg-[var(--color-error)]/10 px-1.5 py-0.5 rounded w-max">
                            Incompleta
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-lg bg-[var(--color-surface-container-low)] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] border border-[var(--color-border)]">
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
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : pct >= 50
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[10px] font-black text-indigo-400 border border-indigo-500/20">
                          <Flame className="h-3.5 w-3.5" strokeWidth={3} />
                          {session.max_streak}
                        </span>
                      </td>
                    </tr>
                    {session.session_errors && session.session_errors.length > 0 && (
                      <tr className="border-0">
                        <td colSpan={7} className="p-0 border-0 bg-[var(--color-surface-container-low)]/50">
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
                    <p className="text-sm font-bold text-[var(--color-text-subtle)] uppercase tracking-widest">Sem registros</p>
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
