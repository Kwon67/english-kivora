import { Fragment } from 'react'
import { notFound, redirect } from 'next/navigation'
import {
  BarChart3,
  Check,
  Clock,
  Flame,
  LogIn,
  LogOut,
  Percent,
  X,
} from 'lucide-react'
import { parseAssignmentStatus } from '@/features/game/lib/assignmentStatus'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatAppDate, formatAppDateTime, formatAppTime } from '@/lib/timezone'
import HistoryChart from '@/features/review/components/HistoryChart'
import SessionErrorsViewer, { SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
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

  // Fetch auth user for metadata (english level + last sign in)
  const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId)
  const userMeta = authUser?.user?.user_metadata || {}
  const englishLevel = userMeta.english_level || 'B2'
  const lastSignInAt = authUser?.user?.last_sign_in_at || null
  const lastSeenAt = (member as Profile).last_seen_at || null
  
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
      icon: BarChart3,
      accent: 'bg-[var(--color-surface-container-high)] text-text-muted border-border',
    },
    {
      label: 'Acerto médio',
      value: `${accuracy}%`,
      sub: 'Precisão consolidada',
      icon: Percent,
      accent: 'bg-primary-light text-primary border-[var(--color-primary-light)]',
    },
    {
      label: 'Cards certos',
      value: totalCorrect,
      sub: 'Soma de acertos',
      icon: Check,
      accent: 'bg-[var(--color-secondary-container)] text-[var(--color-secondary)] border-[var(--color-secondary-container)]',
    },
    {
      label: 'Cards errados',
      value: totalWrong,
      sub: 'Soma de erros',
      icon: X,
      accent: 'bg-[rgba(186,26,26,0.08)] text-[var(--color-error)] border-[rgba(186,26,26,0.18)]',
    },
    {
      label: 'Melhor streak',
      value: bestStreak,
      sub: 'Sequência máxima',
      icon: Flame,
      accent: 'bg-[var(--color-accent-light)] text-[var(--color-warning)] border-[var(--color-accent-light)]',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-container-high)] text-lg font-semibold text-text-muted">
              {(member as Profile).username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="section-kicker">Perfil do membro</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                {(member as Profile).username}
              </h1>
              <p className="mt-1 text-sm text-text-muted">{(member as Profile).email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LevelSelector englishLevel={englishLevel} action={updateLevelAction} />

            <div className="rounded-[0.9rem] border border-border bg-[var(--color-surface-container-low)] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                Inscrito em
              </p>
              <p className="mt-1 text-sm font-medium text-text">
                {formatAppDate((member as Profile).created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Entry / Exit times */}
        <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[0.9rem] border border-border bg-[var(--color-surface-container-low)] p-4">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                Horário de entrada
                </p>
                <LogIn className="h-4 w-4 text-text-subtle" />
              </div>
              <p className="mt-2 text-sm font-medium text-text">
                {lastSignInAt
                  ? formatAppDateTime(lastSignInAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Nunca logou'}
              </p>
              {lastSignInAt && (
                <p className="mt-1 text-xs text-text-muted">
                  Último login registrado
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[0.9rem] border border-border bg-[var(--color-surface-container-low)] p-4">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Horário de saída</p>
                <LogOut className="h-4 w-4 text-text-subtle" />
              </div>
              <p className="mt-2 text-sm font-medium text-text">
                {lastSeenAt
                  ? formatAppDateTime(lastSeenAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Sem registro'}
              </p>
              {lastSeenAt && (
                <p className="mt-1 text-xs text-text-muted">
                  Última atividade registrada
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[0.9rem] border border-border bg-[var(--color-surface-container-low)] p-4 sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Tempo na sessão</p>
                <Clock className="h-4 w-4 text-text-subtle" />
              </div>
              <p className="mt-2 text-sm font-medium text-text">
                {lastSignInAt && lastSeenAt
                  ? (() => {
                      const diffMs = new Date(lastSeenAt).getTime() - new Date(lastSignInAt).getTime()
                      if (diffMs < 0) return 'Sessão ativa'
                      const hours = Math.floor(diffMs / 3600000)
                      const minutes = Math.floor((diffMs % 3600000) / 60000)
                      const seconds = Math.floor((diffMs % 60000) / 1000)
                      const parts: string[] = []
                      if (hours > 0) parts.push(`${hours}h`)
                      if (minutes > 0) parts.push(`${minutes}min`)
                      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)
                      return parts.join(' ')
                    })()
                  : 'Indisponível'}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Diferença entre entrada e última atividade
              </p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-[0.9rem] border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-text">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${stat.accent}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-text-muted">{stat.sub}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Accuracy chart */}
      {chartData.length > 0 && (
        <section className="card overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Análise de desempenho</p>
              <h2 className="mt-2 text-xl font-bold text-text">Curva de acerto</h2>
            </div>
            <div className="text-xs text-text-muted">
              {chartData.length} sessões registradas
            </div>
          </div>
          <div className="rounded-[0.9rem] border border-border bg-[var(--color-surface-container-low)] p-4">
            <HistoryChart data={chartData} />
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="border-b border-border px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Registro de atividades</p>
          <h2 className="mt-2 text-xl font-bold text-text">Sessões completas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-[var(--color-surface-container-low)] text-xs uppercase tracking-wide text-text-subtle">
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Pack</th>
                <th className="px-4 py-3 font-semibold">Modo</th>
                <th className="px-4 py-3 text-center font-semibold">Certo</th>
                <th className="px-4 py-3 text-center font-semibold">Errado</th>
                <th className="px-4 py-3 text-center font-semibold">Precisão</th>
                <th className="px-4 py-3 text-center font-semibold">Sequência</th>
              </tr>
            </thead>

            <tbody>
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
                    <tr className="border-b border-border/30 transition-colors hover:bg-surface-container-low">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text">
                          {formatAppDate(session.completed_at)}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {formatAppTime(session.completed_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text">
                          {session.assignments?.packs?.name ?? 'Revisão'}
                        </p>
                        {statusMeta.baseStatus === 'incomplete' && (
                          <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-error)] bg-[var(--color-error)]/10 px-1.5 py-0.5 rounded w-max">
                            Incompleta
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-border bg-[var(--color-surface-container)] px-2 py-0.5 text-xs font-medium text-text-muted">
                          {modeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-primary">
                        {session.correct_answers}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-[var(--color-error)]">
                        {session.wrong_answers}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ pct >= 80 ? 'bg-primary-light text-primary border border-[var(--color-primary-light)]' : pct >= 50 ? 'bg-[var(--color-accent-light)] text-[var(--color-warning)] border-[var(--color-accent-light)]' : 'bg-[rgba(186,26,26,0.08)] text-[var(--color-error)] border-[rgba(186,26,26,0.18)]' }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent-light)] bg-[var(--color-accent-light)]/30 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
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
                    <p className="text-sm font-bold text-text-subtle uppercase tracking-widest">Sem registros</p>
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
