import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Medal,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import DateFilter from './DateFilter'
import AdminDashboardHeader from './AdminDashboardHeader'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { isPlayableAssignmentGameMode } from '@/features/review/lib/reviewSchedules'
import { homeIconGlyphSm } from '@/lib/homeStyles'
import {
  adminDashboardActionTile,
  adminDashboardIconBox,
  adminDashboardMemberAvatar,
  adminDashboardPanel,
  adminDashboardPrimaryBtn,
  adminDashboardSectionHeader,
  adminDashboardSectionTitle,
  adminDashboardShell,
  adminDashboardSpotlightCard,
  adminDashboardStatusPill,
  adminDashboardTelemetryBand,
  adminDashboardTelemetryCell,
} from '@/features/admin/lib/adminDashboardUi'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatAppDate, formatAppDateTime, getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import type { Assignment, GameSession, Pack, Profile } from '@/types/database.types'
import SectionBadge from '@/components/ui/SectionBadge'
import { redirect } from 'next/navigation'

const DASHBOARD_MEMBER_SELECT = 'id, username, role, last_seen_at' as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type DashboardMember = Pick<Profile, 'id' | 'username' | 'role' | 'last_seen_at'>

type DashboardAssignment = Assignment & {
  packs: Pack
  profiles: Pick<Profile, 'id' | 'username'>
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

function TelemetryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className={adminDashboardTelemetryCell}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-dark" strokeWidth={2.2} aria-hidden />
      </div>
      <p className="font-heading text-lg font-bold leading-none text-brand-dark sm:text-xl">{value}</p>
    </div>
  )
}

function getLatestSession(sessions: GameSession[] = []) {
  return [...sessions].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )[0] ?? null
}

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || '?'
}

function getCompletionPct(completed: number, total: number) {
  if (total <= 0) return 0
  return Math.round((completed / total) * 100)
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const sessionClient = await createClient()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await sessionClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') redirect('/home')

  const supabase = createAdminClient() ?? sessionClient
  const today = getAppDateString()
  const todayLabel = formatAppDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })

  const { date: filterDate } = await searchParams
  const activeDate = filterDate || null

  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select(DASHBOARD_MEMBER_SELECT)
    .order('username')

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
  const todayAssignments = visibleAssignments.filter((a) => a.assigned_date === today)
  const todayCompleted = todayAssignments.filter((a) => isAssignmentCompleted(a.status)).length
  const completionRate = todayAssignments.length > 0 ? Math.round((todayCompleted / todayAssignments.length) * 100) : 0
  const totalCorrect = typedRecentSessions.reduce((sum, s) => sum + s.correct_answers, 0)
  const memberCount = members?.length || 0

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

  const memberRows: MemberRow[] = (members ?? []).map((member: DashboardMember) => {
    const memberAssignments = visibleAssignments?.filter((a) => a.user_id === member.id) ?? []

    const completedAssignments = memberAssignments.filter((a) => isAssignmentCompleted(a.status))
    const latestSessions = completedAssignments
      .map((a) => getLatestSession(a.game_sessions ?? []))
      .filter((session): session is GameSession => session !== null)

    const tCorrect = latestSessions.reduce((s, gs) => s + gs.correct_answers, 0)
    const tWrong = latestSessions.reduce((s, gs) => s + gs.wrong_answers, 0)
    const bestStreak = latestSessions.reduce((b, gs) => Math.max(b, gs.max_streak), 0)
    const lastCompletedAt =
      latestSessions
        .map((gs) => gs.completed_at)
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
      assignmentIds: memberAssignments.map((a) => a.id),
    }
  })

  memberRows.sort((a, b) => {
    if (a.hasAny && !b.hasAny) return -1
    if (!a.hasAny && b.hasAny) return 1
    return a.username.localeCompare(b.username)
  })

  const activeToday = memberRows.filter((row) => {
    if (!row.lastCompletedAt) return false
    return getAppDateString(new Date(row.lastCompletedAt)) === today
  }).length

  const inProgressCount = memberRows.filter((row) => row.hasAny && !row.allCompleted).length

  const spotlight = [...memberRows]
    .filter((row) => row.hasAny && row.totalCorrect > 0)
    .sort((a, b) => b.totalCorrect - a.totalCorrect)
    .slice(0, 3)

  const spotlightMedals = ['#1', '#2', '#3']

  return (
    <div className={adminDashboardShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl space-y-6 pb-8 animate-fade-in sm:space-y-8">
        <AdminMotionSection>
          <AdminDashboardHeader todayLabel={todayLabel} />
        </AdminMotionSection>

        <AdminMotionSection className={adminDashboardTelemetryBand} stagger>
          <AdminMotionItem>
            <TelemetryMetric label="Conclusão" value={`${completionRate}%`} icon={TrendingUp} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric
              label="Tarefas"
              value={todayAssignments.length > 0 ? `${todayCompleted}/${todayAssignments.length}` : '—'}
              icon={CheckCircle2}
            />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Acertos 30d" value={totalCorrect.toLocaleString()} icon={BookOpen} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Membros" value={String(memberCount)} icon={Users} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Ativos hoje" value={String(activeToday)} icon={UserCheck} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Em progresso" value={String(inProgressCount)} icon={Clock} />
          </AdminMotionItem>
        </AdminMotionSection>

        {spotlight.length > 0 ? (
          <AdminMotionSection>
            <section className={adminDashboardPanel}>
              <div className="mb-5 flex items-center gap-3">
                <span className={adminDashboardIconBox}>
                  <Medal className={homeIconGlyphSm} strokeWidth={2.2} />
                </span>
                <div>
                  <SectionBadge label="Destaques" animate={false} />
                  <h2 className={`${adminDashboardSectionTitle} mt-2 text-xl sm:text-2xl`}>Top desempenho</h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {spotlight.map((row, index) => {
                  const total = row.totalCorrect + row.totalWrong
                  const pct = total > 0 ? Math.round((row.totalCorrect / total) * 100) : 0

                  return (
                    <div key={row.memberId} className={adminDashboardSpotlightCard}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
                          {spotlightMedals[index]}
                        </span>
                        {row.bestStreak > 0 ? (
                          <span className={`${adminDashboardStatusPill} bg-brand-accent text-brand-dark`}>
                            <Flame className="h-3 w-3" strokeWidth={3} />
                            {row.bestStreak}
                          </span>
                        ) : null}
                      </div>
                      <Link
                        href={`/admin/members/${row.memberId}`}
                        transitionTypes={navForwardTransitionTypes}
                        className="mt-3 flex items-center gap-3 group"
                      >
                        <div className={adminDashboardMemberAvatar}>{getInitial(row.username)}</div>
                        <div className="min-w-0">
                          <p className="truncate font-heading text-sm font-bold text-brand-dark group-hover:text-brand-secondary">
                            {row.username}
                          </p>
                          <p className="font-body text-xs text-brand-secondary">{row.totalCorrect} acertos</p>
                        </div>
                      </Link>
                      <div className="admin-member-rail mt-3">
                        <div className="admin-member-rail-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1.5 font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
                        {pct}% precisão
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          </AdminMotionSection>
        ) : null}

        <AdminMotionSection>
          <section id="desempenho" className={`${adminDashboardPanel} scroll-mt-4`}>
            <div className={adminDashboardSectionHeader}>
              <div>
                <SectionBadge label="Quadro operacional" animate={false} />
                <h2 className={`${adminDashboardSectionTitle} mt-3`}>
                  Desempenho dos alunos
                  {activeDate ? (
                    <span className="ml-2 font-body text-sm font-semibold text-brand-secondary">
                      — {formatAppDate(`${activeDate}T12:00:00Z`, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  ) : null}
                </h2>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <DateFilter value={activeDate ?? ''} />
                <Link href="/admin/assign" className={adminDashboardPrimaryBtn}>
                  Atribuir tarefa
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto pt-5">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="home-frosted-subtle border-b border-brand-dark/15 font-heading text-2xs font-bold uppercase tracking-[0.1em] text-brand-secondary">
                    <th className="px-4 py-3 sm:px-5">Membro</th>
                    <th className="px-3 py-3 text-center">Ses.</th>
                    <th className="px-3 py-3 text-center">Ac.</th>
                    <th className="px-3 py-3 text-center">Er.</th>
                    <th className="px-3 py-3 text-center">Taxa</th>
                    <th className="px-3 py-3 text-center">Sequência</th>
                    <th className="px-3 py-3 text-center">Concluído</th>
                    <th className="px-4 py-3 sm:px-5">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-dark/10">
                  {memberRows.map((row) => {
                    const total = row.totalCorrect + row.totalWrong
                    const pct = total > 0 ? Math.round((row.totalCorrect / total) * 100) : 0
                    const progressPct = getCompletionPct(row.completedAssignments, row.totalAssignments)

                    return (
                      <tr key={row.memberId} className="transition-colors hover:bg-bg-primary/80">
                        <td className="px-4 py-3 sm:px-5">
                          <Link
                            href={`/admin/members/${row.memberId}`}
                            transitionTypes={navForwardTransitionTypes}
                            className="group flex items-center gap-3"
                          >
                            <div className={`${adminDashboardMemberAvatar} transition-transform group-hover:scale-105`}>
                              {getInitial(row.username)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-heading font-bold text-brand-dark transition-colors group-hover:text-brand-secondary">
                                {row.username}
                              </span>
                              {row.hasAny ? (
                                <div className="admin-member-rail mt-1.5 max-w-[140px]">
                                  <div className="admin-member-rail-fill" style={{ width: `${progressPct}%` }} />
                                </div>
                              ) : null}
                            </div>
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
                              className={`${adminDashboardStatusPill} ${
                                pct >= 80
                                  ? 'bg-brand-accent text-brand-dark'
                                  : pct >= 50
                                    ? 'bg-bg-primary text-brand-dark'
                                    : 'bg-bg-card text-brand-secondary'
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
                            <span className={`${adminDashboardStatusPill} bg-brand-accent text-brand-dark`}>
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
                        <td className="px-4 py-3 sm:px-5">
                          {!row.hasAny ? (
                            <span className={`${adminDashboardStatusPill} bg-bg-primary text-brand-secondary`}>
                              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Sem dados
                            </span>
                          ) : row.allCompleted ? (
                            <span className={`${adminDashboardStatusPill} bg-brand-accent text-brand-dark`}>
                              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Finalizado
                            </span>
                          ) : (
                            <span className={`${adminDashboardStatusPill} bg-bg-primary text-brand-dark`}>
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

        <AdminMotionSection id="acoes" className="grid gap-3 sm:grid-cols-2" stagger>
          <AdminMotionItem>
            <Link href="/admin/reports" className={adminDashboardActionTile}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={adminDashboardIconBox}>
                  <BarChart2 className={homeIconGlyphSm} strokeWidth={2.2} />
                </span>
                <span className="truncate">Relatórios completos</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-brand-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          </AdminMotionItem>

          <AdminMotionItem>
            <Link href="/admin/members" className={adminDashboardActionTile}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={adminDashboardIconBox}>
                  <Users className={homeIconGlyphSm} strokeWidth={2.2} />
                </span>
                <span className="truncate">Gerenciar membros</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-brand-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          </AdminMotionItem>
        </AdminMotionSection>
      </div>
    </div>
  )
}
