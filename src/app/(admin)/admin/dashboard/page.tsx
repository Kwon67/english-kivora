import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Users,
  BookOpen,
} from 'lucide-react'
import DateFilter from './DateFilter'
import AdminDashboardRealtime from './AdminDashboardRealtime'
import { isAssignmentCompleted } from '@/lib/assignmentStatus'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatAppDate, formatAppDateTime, getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import type { Assignment, GameSession, Pack, Profile } from '@/types/database.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type DashboardAssignment = Assignment & {
  packs: Pack
  profiles: Profile
  game_sessions: GameSession[]
}

type DashboardRecentSession = GameSession & {
  profiles: Pick<Profile, 'username'> | null
  assignments:
    | {
        game_mode: string
        packs: Pick<Pack, 'name'> | null
      }
    | null
}

function getLatestSession(sessions: GameSession[] = []) {
  return [...sessions].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )[0] ?? null
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = createAdminClient() ?? await createClient()
  const today = getAppDateString()
  const todayLabel = formatAppDate(new Date())

  const { date: filterDate } = await searchParams
  const activeDate = filterDate || null

  const { data: members, error: membersError } = await supabase.from('profiles').select('*').order('username')

  // Fetch assignments — filtered by date if selected, otherwise all completed + today pending
  let query = supabase
    .from('assignments')
    .select('*, packs(*), profiles(id, username), game_sessions(*)')
    .order('assigned_date', { ascending: false })

  if (activeDate) {
    query = query.eq('assigned_date', activeDate)
  } else {
    query = query.limit(200)
  }

  const { data: assignments, error: assignmentsError } = await query

  const analyticsSince = shiftAppDate(today, -30)

  const { data: recentSessions, error: recentSessionsError } = await supabase
    .from('game_sessions')
    .select('*, profiles(username), assignments(game_mode, packs(name))')
    .gte('completed_at', getAppDayStartUtcIso(analyticsSince))
    .order('completed_at', { ascending: false })

  if (membersError || assignmentsError || recentSessionsError) {
    console.error('Admin dashboard query failed', {
      membersError,
      assignmentsError,
      recentSessionsError,
    })

    throw new Error('Falha ao carregar os dados do painel administrativo.')
  }

  // Stats: today's assignments for summary cards
  const visibleAssignments = ((assignments as DashboardAssignment[] | null) || []).filter((assignment) =>
    isPlayableAssignmentGameMode(assignment.game_mode)
  )
  const typedRecentSessions = (recentSessions ?? []) as unknown as DashboardRecentSession[]
  const todayAssignments = visibleAssignments.filter(a => a.assigned_date === today)
  const todayCompleted = todayAssignments.filter(a => isAssignmentCompleted(a.status)).length
  const completionRate = todayAssignments.length > 0 ? Math.round((todayCompleted / todayAssignments.length) * 100) : 0
  const totalCorrect = typedRecentSessions.reduce((sum, s) => sum + s.correct_answers, 0)

  const statCards = [
    {
      label: 'Conclusão hoje',
      value: `${completionRate}%`,
      icon: TrendingUp,
      accent: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-light)]',
      subtitle: `${todayCompleted} de ${todayAssignments.length} tarefas concluídas`,
    },
    {
      label: 'Cards dominados',
      value: totalCorrect.toLocaleString(),
      icon: BookOpen,
      accent: 'bg-[var(--color-secondary-container)] text-[var(--color-secondary)] border-[var(--color-secondary-container)]',
      subtitle: 'Soma de acertos nos últimos 30 dias',
    },
    {
      label: 'Membros ativos',
      value: members?.length || 0,
      icon: Users,
      accent: 'bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)] border-[var(--color-border)]',
      subtitle: 'Base registrada no workspace',
    },
  ]

  // ── Group by member for the table ─────────────────────────────────────────
  type MemberRow = {
    memberId: string
    username: string
    totalCorrect: number
    totalWrong: number
    bestStreak: number
    sessions: number
    completedAssignments: number
    totalAssignments: number
    allCompleted: boolean
    hasAny: boolean
    lastCompletedAt: string | null
    assignmentIds: string[]
  }

  const memberRows: MemberRow[] = (members ?? []).map((member: Profile) => {
    const memberAssignments = visibleAssignments
      ?.filter(a => a.user_id === member.id) ?? []

    const completedAssignments = memberAssignments.filter(a => isAssignmentCompleted(a.status))
    const latestSessions = completedAssignments
      .map(a => getLatestSession(a.game_sessions ?? []))
      .filter((session): session is GameSession => session !== null)

    const tCorrect = latestSessions.reduce((s, gs) => s + gs.correct_answers, 0)
    const tWrong = latestSessions.reduce((s, gs) => s + gs.wrong_answers, 0)
    const bestStreak = latestSessions.reduce((b, gs) => Math.max(b, gs.max_streak), 0)
    const lastCompletedAt = latestSessions
      .map(gs => gs.completed_at)
      .sort()
      .at(-1) ?? null

    return {
      memberId: member.id,
      username: member.username,
      totalCorrect: tCorrect,
      totalWrong: tWrong,
      bestStreak,
      sessions: latestSessions.length,
      completedAssignments: completedAssignments.length,
      totalAssignments: memberAssignments.length,
      allCompleted: memberAssignments.length > 0 && completedAssignments.length === memberAssignments.length,
      hasAny: memberAssignments.length > 0,
      lastCompletedAt,
      assignmentIds: memberAssignments.map(a => a.id),
    }
  })

  memberRows.sort((a, b) => {
    if (a.hasAny && !b.hasAny) return -1
    if (!a.hasAny && b.hasAny) return 1
    return a.username.localeCompare(b.username)
  })

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-6 sm:p-8 editorial-shadow">
        <div className="flex flex-col gap-5 sm:gap-6 xl:flex-row xl:items-end xl:justify-between px-2">
          <div className="max-w-3xl">
            <p className="section-kicker">Operations overview</p>
            <h1 className="mt-5 text-responsive-lg font-bold text-[var(--color-text)] tracking-tight">
              Controle diário do programa
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] font-medium">
              Visão centralizada de atribuições e progresso diário dos alunos.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 xl:items-end">
            <AdminDashboardRealtime />
            <div className="rounded-2xl bg-[var(--color-primary)] px-6 py-4 text-[var(--color-on-primary)] shadow-xl shadow-[var(--color-primary)]/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Hoje</p>
              <p className="mt-1 text-2xl font-black">{todayLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-[var(--color-surface-container-low)] border border-[var(--color-border)] rounded-2xl p-6 transition-all hover:bg-[var(--color-surface-container-lowest)] hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-black text-[var(--color-text)] tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${stat.accent}`}>
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium text-[var(--color-text-muted)]">{stat.subtitle}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] overflow-hidden editorial-shadow">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Daily status</p>
            <h2 className="mt-4 text-3xl font-bold text-[var(--color-text)] tracking-tight">
              Desempenho dos alunos
              {activeDate && (
                <span className="ml-3 text-lg font-normal text-[var(--color-text-subtle)]">
                  — {formatAppDate(`${activeDate}T12:00:00Z`, { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              )}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateFilter value={activeDate ?? ''} />
            <Link
              href="/admin/assign"
              className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-5 py-2.5 text-sm font-bold text-[var(--color-text)] transition-all hover:bg-[var(--color-surface-container-low)] hover:border-[var(--color-primary-container)]"
            >
              Atribuir tarefa
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-container-low)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] border-b border-[var(--color-border)]">
                <th className="px-6 py-4">Membro</th>
                <th className="px-4 py-4 text-center">Ses.</th>
                <th className="px-4 py-4 text-center">Ac.</th>
                <th className="px-4 py-4 text-center">Er.</th>
                <th className="px-4 py-4 text-center">Taxa</th>
                <th className="px-4 py-4 text-center">Streak</th>
                <th className="px-4 py-4 text-center">Concluído</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]/30">
              {memberRows.map(row => {
                const total = row.totalCorrect + row.totalWrong
                const pct = total > 0 ? Math.round((row.totalCorrect / total) * 100) : 0

                return (
                  <tr key={row.memberId} className="transition-colors hover:bg-[var(--color-surface-container-low)]/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/members/${row.memberId}`}
                        transitionTypes={navForwardTransitionTypes}
                        className="flex items-center gap-3 group"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] font-bold text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary-light)] group-hover:text-[var(--color-primary)] transition-colors">
                          {row.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-bold text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                          {row.username}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-[var(--color-text-subtle)]">
                      {row.hasAny ? row.sessions : '-'}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-[var(--color-primary)]">
                      {row.hasAny ? row.totalCorrect : '-'}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-[var(--color-text-subtle)] opacity-50">
                      {row.hasAny ? row.totalWrong : '-'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {row.hasAny && total > 0 ? (
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${
                          pct >= 80
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary-light)]'
                            : pct >= 50
                              ? 'bg-[var(--color-secondary-container)] text-[var(--color-secondary)] border border-[var(--color-secondary-container)]'
                              : 'bg-[var(--color-surface-container)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                        }`}>
                          {pct}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {row.bestStreak > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent-light)]/30 px-2.5 py-1 text-[10px] font-black text-[var(--color-accent)] border border-[var(--color-accent-light)]/50">
                          <Flame className="h-3 w-3" strokeWidth={3} />
                          {row.bestStreak}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-[var(--color-text-subtle)]">
                      {row.lastCompletedAt
                        ? formatAppDateTime(row.lastCompletedAt)
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {!row.hasAny ? (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-surface-container)] px-3 py-1 text-[10px] font-black uppercase text-[var(--color-text-subtle)]">
                          <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Sem dados
                        </span>
                      ) : row.allCompleted ? (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-light)] px-3 py-1 text-[10px] font-black uppercase text-[var(--color-primary)] border border-[var(--color-primary-light)]">
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Finalizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-secondary-container)] px-3 py-1 text-[10px] font-black uppercase text-[var(--color-secondary)] border border-[var(--color-secondary-container)]">
                          <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {row.completedAssignments}/{row.totalAssignments}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link href="/admin/reports" className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] group p-8 editorial-shadow transition-all hover:translate-y-[-2px] hover:border-[var(--color-primary-container)]">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary-light)]">
              <TrendingUp className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text)]">Relatórios e Ranking</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)] font-medium">Desempenho detalhado e elite da semana.</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/members" className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] group p-8 editorial-shadow transition-all hover:translate-y-[-2px] hover:border-[var(--color-primary-container)]">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
              <Users className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text)]">Gerenciar Equipe</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)] font-medium">Adicione membros e veja históricos.</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
