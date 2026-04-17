import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  LayoutList,
  TrendingUp,
  Users,
} from 'lucide-react'
import DeleteMemberButton from './DeleteMemberButton'
import AssignmentsList from './AssignmentsList'
import type { AssignmentItem } from './AssignmentsList'
import AddMemberModal from './AddMemberModal'
import DateFilter from './DateFilter'
import AdminDashboardRealtime from './AdminDashboardRealtime'
import { isAssignmentCompleted } from '@/lib/assignmentStatus'
import { buildWeeklyLeaderboard, getLeaderboardTier } from '@/lib/leaderboard'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatAppDate, formatAppDateTime, getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import type { SessionErrorLog } from '@/components/shared/SessionErrorsViewer'
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
  session_errors: SessionErrorLog[]
}

const assignmentModeLabel: Record<string, string> = {
  multiple_choice: 'Múltipla escolha',
  flashcard: 'Flashcard',
  typing: 'Digitação',
  matching: 'Combinação',
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
    .select('*, profiles(username), assignments(game_mode, packs(name)), session_errors(*, cards(english_phrase, portuguese_translation, audio_url))')
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
      label: 'Conclusao hoje',
      value: `${completionRate}%`,
      icon: TrendingUp,
      accent: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
      subtitle: `${todayCompleted} de ${todayAssignments.length} tarefas concluídas`,
    },
    {
      label: 'Cards dominados',
      value: totalCorrect.toLocaleString(),
      icon: BookOpen,
      accent: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
      subtitle: 'Soma de acertos nos últimos 30 dias',
    },
    {
      label: 'Membros ativos',
      value: members?.length || 0,
      icon: Users,
      accent: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
      subtitle: 'Base registrada no workspace',
    },
  ]

  // ── Group by member for the table ─────────────────────────────────────────
  // Each row = one member. Stats are aggregated across all their assignments
  // in the selected date range (or all time if no filter).
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

  // Sort: members with activity first
  memberRows.sort((a, b) => {
    if (a.hasAny && !b.hasAny) return -1
    if (!a.hasAny && b.hasAny) return 1
    return a.username.localeCompare(b.username)
  })

  const weaknessCardMap = new Map<
    string,
    { id: string; en: string; pt: string; count: number }
  >()

  const packWeaknessMap = new Map<
    string,
    { packName: string; correct: number; wrong: number; sessions: number }
  >()

  const memberModeWeaknessMap = new Map<
    string,
    { username: string; modeLabel: string; correct: number; wrong: number; sessions: number }
  >()

  for (const session of typedRecentSessions) {
    const packName = session.assignments?.packs?.name || null
    const modeLabel = assignmentModeLabel[session.assignments?.game_mode || ''] || session.assignments?.game_mode || 'Outro'
    const username = session.profiles?.username || 'Membro'

    if (packName) {
      const existing = packWeaknessMap.get(packName) || {
        packName,
        correct: 0,
        wrong: 0,
        sessions: 0,
      }
      existing.correct += session.correct_answers
      existing.wrong += session.wrong_answers
      existing.sessions += 1
      packWeaknessMap.set(packName, existing)
    }

    const memberModeKey = `${username}:${modeLabel}`
    const memberModeExisting = memberModeWeaknessMap.get(memberModeKey) || {
      username,
      modeLabel,
      correct: 0,
      wrong: 0,
      sessions: 0,
    }
    memberModeExisting.correct += session.correct_answers
    memberModeExisting.wrong += session.wrong_answers
    memberModeExisting.sessions += 1
    memberModeWeaknessMap.set(memberModeKey, memberModeExisting)

    for (const error of session.session_errors || []) {
      if (!error.card_id || !error.cards) continue

      const existing = weaknessCardMap.get(error.card_id) || {
        id: error.card_id,
        en: error.cards.english_phrase,
        pt: error.cards.portuguese_translation,
        count: 0,
      }
      existing.count += 1
      weaknessCardMap.set(error.card_id, existing)
    }
  }

  const topWeakCards = [...weaknessCardMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const weakestPacks = [...packWeaknessMap.values()]
    .map((item) => {
      const total = item.correct + item.wrong
      const accuracy = total > 0 ? Math.round((item.correct / total) * 100) : 0
      return {
        ...item,
        total,
        accuracy,
      }
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, 5)

  const weakestMemberModes = [...memberModeWeaknessMap.values()]
    .map((item) => {
      const total = item.correct + item.wrong
      const accuracy = total > 0 ? Math.round((item.correct / total) * 100) : 0
      return {
        ...item,
        total,
        accuracy,
      }
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, 5)
  const weeklyLeaderboard = buildWeeklyLeaderboard(
    (members || [])
      .filter((member: Profile) => member.role !== 'admin')
      .map((member: Profile) => ({ id: member.id, username: member.username })),
    typedRecentSessions.map((session) => ({
      user_id: session.user_id,
      correct_answers: session.correct_answers,
      wrong_answers: session.wrong_answers,
      max_streak: session.max_streak,
    }))
  ).slice(0, 8)

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="surface-hero p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Operations overview</p>
            <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
              Controle diário do programa de inglês da equipe.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
              Visão centralizada de atribuições, execução e consistência dos alunos em um painel mais limpo e legível.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <AdminDashboardRealtime />
            <div className="rounded-[26px] bg-[linear-gradient(135deg,rgba(17,32,51,0.96),rgba(43,122,11,0.92))] px-5 py-4 text-white shadow-[0_34px_80px_-50px_rgba(17,32,51,0.9)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Hoje</p>
              <p className="mt-2 text-3xl font-semibold">{todayLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon

            return (
              <div key={stat.label} className="metric-tile">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                      {stat.label}
                    </p>
                    <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ${stat.accent}`}>
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{stat.subtitle}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-4 sm:px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Leaderboard</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
              Ranking interno da semana
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Ordenado por pontuação semanal, precisão e volume de sessões nos últimos 7 dias.
            </p>
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-white/72 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
            7 dias
          </span>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {weeklyLeaderboard.length > 0 ? (
            weeklyLeaderboard.map((entry) => (
              <div
                key={entry.userId}
                className="flex flex-col gap-3 px-4 sm:px-6 py-4 transition-colors hover:bg-white/72 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container)] font-bold text-[var(--color-text)]">
                    #{entry.rank}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--color-text)]">{entry.username}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {entry.sessions} sessões · {entry.accuracy}% de precisão · streak {entry.bestStreak}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    {entry.score} pts
                  </span>
                  <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white/76 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    {getLeaderboardTier(entry.score)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="px-6 py-10 text-center text-[var(--color-text-muted)]">
              Ainda não há sessões suficientes nesta semana para montar o ranking interno.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(254,242,242,0.92)] text-red-600">
              <AlertCircle className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="section-kicker">Fraquezas</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Cards mais errados</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {topWeakCards.length > 0 ? (
              topWeakCards.map((card) => (
                <div key={card.id} className="rounded-[20px] border border-[var(--color-border)] bg-white/76 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-[var(--color-text)]">{card.en}</p>
                      <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">{card.pt}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                      {card.count}x
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Ainda não há erros suficientes no período para apontar um padrão.
              </p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="section-kicker">Fraquezas</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Packs com pior taxa</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {weakestPacks.length > 0 ? (
              weakestPacks.map((pack) => (
                <div key={pack.packName} className="rounded-[20px] border border-[var(--color-border)] bg-white/76 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-[var(--color-text)]">{pack.packName}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {pack.sessions} {pack.sessions === 1 ? 'sessão' : 'sessões'} · {pack.total} respostas
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]">
                      {pack.accuracy}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Sem sessões suficientes ainda para ranquear packs por dificuldade.
              </p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <LayoutList className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="section-kicker">Fraquezas</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Membros por modo</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {weakestMemberModes.length > 0 ? (
              weakestMemberModes.map((entry) => (
                <div key={`${entry.username}-${entry.modeLabel}`} className="rounded-[20px] border border-[var(--color-border)] bg-white/76 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-[var(--color-text)]">{entry.username}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {entry.modeLabel} · {entry.sessions} {entry.sessions === 1 ? 'sessão' : 'sessões'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]">
                      {entry.accuracy}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Ainda não há base suficiente para destacar dificuldade por modo.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-4 sm:px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Daily status</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
              Desempenho dos alunos
              {activeDate && (
                <span className="ml-3 text-lg font-normal text-[var(--color-text-muted)]">
                  — {formatAppDate(`${activeDate}T12:00:00Z`, { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              )}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateFilter value={activeDate ?? ''} />
            <a
              href="/admin/assign"
              className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-white"
            >
              Atribuir nova tarefa
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
            <thead className="bg-white/72 text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold">Membro</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center">Ses.</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center">Ac.</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center">Er.</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center">Taxa</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center">Streak</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-center">Concluído</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {memberRows.map(row => {
                const total = row.totalCorrect + row.totalWrong
                const pct = total > 0 ? Math.round((row.totalCorrect / total) * 100) : 0

                return (
                  <tr key={row.memberId} className="transition-colors hover:bg-white/72">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <Link
                        href={`/admin/members/${row.memberId}`}
                        transitionTypes={navForwardTransitionTypes}
                        className="flex items-center gap-2 sm:gap-3 group"
                      >
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-bold text-[var(--color-text)]">
                          {row.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate max-w-[80px] sm:max-w-none">
                          {row.username}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center font-semibold text-[var(--color-text)]">
                      {row.hasAny ? row.sessions : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center font-semibold text-[var(--color-primary)]">
                      {row.hasAny ? row.totalCorrect : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center font-semibold text-[var(--color-text-muted)]">
                      {row.hasAny ? row.totalWrong : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      {row.hasAny && total > 0 ? (
                        <span className={`inline-flex rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold ${
                          pct >= 80
                            ? 'border border-[var(--color-primary-container)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                            : pct >= 50
                              ? 'border border-[var(--color-secondary-container)] bg-[var(--color-secondary-container)] text-[var(--color-secondary)]'
                              : 'border border-[var(--color-border)] bg-[var(--color-surface-container)] text-[var(--color-text-muted)]'
                        }`}>
                          {pct}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      {row.bestStreak > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-secondary-container)] bg-[var(--color-secondary-container)] px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold text-[var(--color-secondary)]">
                          <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.2} />
                          {row.bestStreak}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-[var(--color-text-muted)]">
                      {row.lastCompletedAt
                        ? formatAppDateTime(row.lastCompletedAt)
                        : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {!row.hasAny ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
                          Sem dados
                        </span>
                      ) : row.allCompleted ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-container)] bg-[var(--color-primary-container)] px-3 py-1 text-xs font-semibold text-[var(--color-on-primary-container)]">
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                          {row.completedAssignments}/{row.totalAssignments} concluídas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-secondary-container)] bg-[var(--color-secondary-container)] px-3 py-1 text-xs font-semibold text-[var(--color-secondary)]">
                          <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
                          {row.completedAssignments}/{row.totalAssignments} concluídas
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

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-4 sm:px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Assignments</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
              Atribuições
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Remova uma lição atribuída a qualquer momento. Ao excluir a atribuição, o progresso relacionado também é apagado.
            </p>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-white/72 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
            {visibleAssignments.length} atribuiç{visibleAssignments.length === 1 ? 'ão' : 'ões'}
          </div>
        </div>

        <AssignmentsList assignments={visibleAssignments as AssignmentItem[]} />
      </section>

      {/* ===== MEMBER MANAGEMENT ===== */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 sm:px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Team management</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Membros do workspace</h2>
          </div>
          <AddMemberModal />
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {members?.map((member: Profile) => (
            <div key={member.id} className="flex flex-col gap-3 px-4 sm:px-6 py-4 transition-colors hover:bg-white/72 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {/* Avatar + name */}
              <Link
                href={`/admin/members/${member.id}`}
                transitionTypes={navForwardTransitionTypes}
                className="flex items-center gap-3 min-w-0 flex-1 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-bold text-[var(--color-text)]">
                  {member.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{member.username}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{member.email}</p>
                </div>
              </Link>

              {/* Actions row — always visible, wraps on mobile */}
              <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  member.role === 'admin'
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {member.role}
                </span>
                <Link
                  href={`/admin/members/${member.id}`}
                  transitionTypes={navForwardTransitionTypes}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-white"
                >
                  Ver histórico
                </Link>
                {member.role !== 'admin' && (
                  <DeleteMemberButton userId={member.id} username={member.username || ''} />
                )}
              </div>
            </div>
          ))}


          {(!members || members.length === 0) && (
            <p className="px-6 py-10 text-center text-[var(--color-text-muted)]">Nenhum membro registrado.</p>
          )}
        </div>
      </section>
    </div>
  )
}
