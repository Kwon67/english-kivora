import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Users,
  BookOpen,
} from 'lucide-react'
import DateFilter from './DateFilter'
import AdminDashboardHeader from './AdminDashboardHeader'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { isPlayableAssignmentGameMode } from '@/features/review/lib/reviewSchedules'
import {
  AdminBadge,
  accentBadge,
  glassTile,
  iconClass,
  neutralBadge,
  pageInner,
  pageRoot,
  primaryBtn,
  quickLinkClass,
} from '@/features/admin/lib/adminUi'
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

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || '?'
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = createAdminClient() ?? await createClient()
  const today = getAppDateString()
  const todayLabel = formatAppDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })

  const { date: filterDate } = await searchParams
  const activeDate = filterDate || null

  const { data: members, error: membersError } = await supabase.from('profiles').select('*').order('username')

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

  const visibleAssignments = ((assignments as DashboardAssignment[] | null) || []).filter((assignment) =>
    isPlayableAssignmentGameMode(assignment.game_mode)
  )
  const typedRecentSessions = (recentSessions ?? []) as unknown as DashboardRecentSession[]
  const todayAssignments = visibleAssignments.filter(a => a.assigned_date === today)
  const todayCompleted = todayAssignments.filter(a => isAssignmentCompleted(a.status)).length
  const completionRate = todayAssignments.length > 0 ? Math.round((todayCompleted / todayAssignments.length) * 100) : 0
  const totalCorrect = typedRecentSessions.reduce((sum, s) => sum + s.correct_answers, 0)
  const memberCount = members?.length || 0

  const statCards = [
    {
      label: 'Conclusão hoje',
      value: `${completionRate}%`,
      icon: TrendingUp,
      subtitle: `${todayCompleted} de ${todayAssignments.length} tarefas concluídas`,
    },
    {
      label: 'Cards dominados',
      value: totalCorrect.toLocaleString(),
      icon: BookOpen,
      subtitle: 'Soma de acertos nos últimos 30 dias',
    },
    {
      label: 'Membros ativos',
      value: memberCount,
      icon: Users,
      subtitle: 'Base registrada no ambiente',
    },
  ]

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
    <div className={pageRoot}>
      <div className={pageInner}>
        <AdminMotionSection>
          <AdminDashboardHeader
            completionRate={completionRate}
            todayCompleted={todayCompleted}
            todayTotal={todayAssignments.length}
            totalCorrect={totalCorrect}
            memberCount={memberCount}
            todayLabel={todayLabel}
          />
        </AdminMotionSection>

        <AdminMotionSection className="grid gap-4 sm:grid-cols-3" stagger>
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <AdminMotionItem key={stat.label}>
                <article className={`${glassTile} group/stat p-5 hover:-translate-y-1`}>
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div>
                      <AdminBadge label={stat.label} />
                      <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{stat.value}</p>
                    </div>
                    <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="relative z-10 mt-4 font-body text-sm text-brand-secondary">{stat.subtitle}</p>
                </article>
              </AdminMotionItem>
            )
          })}
        </AdminMotionSection>

        <AdminMotionSection>
          <section id="desempenho" className={`${glassTile} relative overflow-hidden scroll-mt-4`}>
            <div className="relative z-10 flex flex-col gap-4 border-b-2 border-brand-dark px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <AdminBadge label="Desempenho" />
                <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                  Desempenho dos alunos
                  {activeDate && (
                    <span className="ml-2 font-body text-sm font-semibold text-brand-secondary">
                      — {formatAppDate(`${activeDate}T12:00:00Z`, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <DateFilter value={activeDate ?? ''} />
                <Link href="/admin/assign" className={primaryBtn}>
                  Atribuir tarefa
                </Link>
              </div>
            </div>

            <div className="relative z-10 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-brand-dark/15 bg-bg-primary font-heading text-[10px] font-bold uppercase tracking-[0.1em] text-brand-secondary">
                    <th className="px-5 py-3">Membro</th>
                    <th className="px-3 py-3 text-center">Ses.</th>
                    <th className="px-3 py-3 text-center">Ac.</th>
                    <th className="px-3 py-3 text-center">Er.</th>
                    <th className="px-3 py-3 text-center">Taxa</th>
                    <th className="px-3 py-3 text-center">Sequência</th>
                    <th className="px-3 py-3 text-center">Concluído</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y-2 divide-brand-dark/10">
                  {memberRows.map(row => {
                    const total = row.totalCorrect + row.totalWrong
                    const pct = total > 0 ? Math.round((row.totalCorrect / total) * 100) : 0

                    return (
                      <tr key={row.memberId} className="transition-colors hover:bg-bg-primary">
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/members/${row.memberId}`}
                            transitionTypes={navForwardTransitionTypes}
                            className="flex items-center gap-3 group"
                          >
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-brand-accent font-heading text-sm font-bold text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)] transition-transform group-hover:scale-105">
                              {getInitial(row.username)}
                            </div>
                            <span className="font-heading font-bold text-brand-dark transition-colors group-hover:text-brand-secondary">
                              {row.username}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-brand-secondary">
                          {row.hasAny ? row.sessions : '—'}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-brand-dark">
                          {row.hasAny ? row.totalCorrect : '—'}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-brand-secondary">
                          {row.hasAny ? row.totalWrong : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.hasAny && total > 0 ? (
                            <span
                              className={`inline-flex rounded-lg border px-2.5 py-1 font-heading text-[10px] font-bold uppercase ${
                                pct >= 80
                                  ? 'border-brand-dark bg-brand-accent text-brand-dark'
                                  : pct >= 50
                                    ? 'border-brand-dark bg-bg-primary text-brand-dark'
                                    : 'border-brand-dark bg-bg-card text-brand-secondary'
                              }`}
                            >
                              {pct}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.bestStreak > 0 ? (
                            <span className={`${accentBadge} inline-flex items-center gap-1`}>
                              <Flame className="h-3 w-3" strokeWidth={3} />
                              {row.bestStreak}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-body text-xs font-semibold text-brand-secondary">
                          {row.lastCompletedAt ? formatAppDateTime(row.lastCompletedAt) : '—'}
                        </td>
                        <td className="px-5 py-3">
                          {!row.hasAny ? (
                            <span className={`${neutralBadge} inline-flex items-center gap-2`}>
                              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Sem dados
                            </span>
                          ) : row.allCompleted ? (
                            <span className={`${accentBadge} inline-flex items-center gap-2`}>
                              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Finalizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-brand-dark bg-bg-primary px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
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
        </AdminMotionSection>

        <AdminMotionSection className="grid gap-3 sm:grid-cols-2" stagger>
          <AdminMotionItem>
            <Link href="/admin/reports" className={quickLinkClass}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={iconClass}>
                  <BarChart2 className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="truncate">Ver relatórios completos</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-brand-secondary transition-transform group-hover:translate-x-0.5" />
            </Link>
          </AdminMotionItem>

          <AdminMotionItem>
            <Link href="/admin/members" className={quickLinkClass}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={iconClass}>
                  <Users className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="truncate">Gerenciar membros</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-brand-secondary transition-transform group-hover:translate-x-0.5" />
            </Link>
          </AdminMotionItem>
        </AdminMotionSection>
      </div>
    </div>
  )
}