import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Medal,
  Settings,
  Trophy,
} from 'lucide-react'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/lib/assignmentStatus'
import { buildWeeklyLeaderboard, getLeaderboardTier } from '@/lib/leaderboard'
import { getReviewQueueSummaryForUser } from '@/lib/reviewQueue'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import HomeRealtime from './HomeRealtime'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const gameModeConfig: Record<string, { label: string }> = {
  multiple_choice: { label: 'Gramática' },
  flashcard: { label: 'Revisão' },
  typing: { label: 'Digitação' },
  matching: { label: 'Associação' },
  listening: { label: 'Escuta' },
  speaking: { label: 'Fala' },
}

type HomePack = {
  name: string
  description: string | null
  level: string | null
}

type HomeAssignment = {
  id: string
  assigned_date: string
  status: string
  game_mode: string
  packs: HomePack | null
  badges: { name: string; icon_name: string } | null
}

type SessionSummary = {
  correct_answers: number
  wrong_answers: number
}

type HomeRecentReview = {
  card_id: string
  quality: number
  review_date: string
}

function calculateStreak(assignments: HomeAssignment[], today: string) {
  const completedDays = new Set(
    assignments.filter((row) => isAssignmentCompleted(row.status)).map((row) => row.assigned_date)
  )
  let streak = 0

  for (let i = 0; i < 30; i++) {
    const dateStr = shiftAppDate(today, -i)
    if (completedDays.has(dateStr)) {
      streak++
      continue
    }
    if (i > 0) break
  }

  return { streak, completedDays }
}

async function getReviewStats(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  return getReviewQueueSummaryForUser(
    supabase as unknown as Parameters<typeof getReviewQueueSummaryForUser>[0],
    userId
  )
}

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const materializePromise = materializeScheduledReviewReleasesForUser(user.id)
  const weeklyStart = shiftAppDate(getAppDateString(), -7)

  const [
    profileResult,
    assignmentsResult,
    sessionsResult,
    recentReviewsResult,
    leaderboardMembersResult,
    leaderboardSessionsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('username,role').eq('id', user.id).single(),
    supabase
      .from('assignments')
      .select('id,assigned_date,status,game_mode,packs(name,description,level),badges(name,icon_name)')
      .eq('user_id', user.id)
      .order('assigned_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase.from('game_sessions').select('correct_answers,wrong_answers').eq('user_id', user.id),
    supabase
      .from('card_reviews')
      .select('card_id,quality,review_date')
      .eq('user_id', user.id)
      .gte('review_date', `${weeklyStart}T00:00:00.000Z`)
      .order('review_date', { ascending: false }),
    supabase.from('profiles').select('id,username,role,avatar_url').order('username'),
    supabase
      .from('game_sessions')
      .select('user_id,correct_answers,wrong_answers,max_streak')
      .gte('completed_at', `${weeklyStart}T00:00:00.000Z`)
      .order('completed_at', { ascending: false }),
  ])

  await materializePromise

  const profile = profileResult.data
  const today = getAppDateString()
  const allPlayableAssignments =
    ((assignmentsResult.data as HomeAssignment[] | null) || []).filter((assignment) =>
      isPlayableAssignmentGameMode(assignment.game_mode)
    )
  const assignments = allPlayableAssignments.filter((assignment) => {
    const status = parseAssignmentStatus(assignment.status)
    return assignment.assigned_date >= today || status.baseStatus !== 'completed'
  })
  const sessions = (sessionsResult.data as SessionSummary[] | null) || []
  const recentReviews = (recentReviewsResult.data as HomeRecentReview[] | null) || []
  const leaderboardMembers =
    (leaderboardMembersResult.data || [])
      .filter((member) => member.role !== 'admin')
      .map((member) => ({ id: member.id, username: member.username, avatarUrl: member.avatar_url })) || []
  const leaderboardSessions =
    (leaderboardSessionsResult.data || []).map((session) => ({
      user_id: session.user_id,
      correct_answers: session.correct_answers,
      wrong_answers: session.wrong_answers,
      max_streak: session.max_streak,
    })) || []

  const { streak, completedDays } = calculateStreak(allPlayableAssignments, today)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const offset = i - 6
    const dateStr = shiftAppDate(today, offset)
    const dateObj = new Date(dateStr + 'T12:00:00Z')
    return {
      dateStr,
      letter: dateObj.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).charAt(0).toUpperCase(),
      completed: completedDays.has(dateStr),
    }
  })
  const reviewStats = await getReviewStats(user.id, supabase)
  const leaderboard = buildWeeklyLeaderboard(leaderboardMembers, leaderboardSessions)
  const topLeaderboard = leaderboard.slice(0, 3)
  const totalAssignments = assignments.length
  const pendingAssignments = assignments.filter((assignment) => !isAssignmentCompleted(assignment.status))
  const pendingCount = pendingAssignments.length
  const completedCount = totalAssignments - pendingCount
  const completedReviewsToday = recentReviews.filter(
    (review) => getAppDateString(review.review_date) === today
  ).length
  const totalReviewWork = completedReviewsToday + reviewStats.totalDue
  const totalDailyWork = totalAssignments + totalReviewWork
  const completedDailyWork = completedCount + completedReviewsToday
  const completionRate =
    totalDailyWork > 0 ? Math.round((completedDailyWork / totalDailyWork) * 100) : 100
  const hasPendingReviews = reviewStats.totalDue > 0
  const nextAssignment = pendingAssignments[0]
  const weeklyFocusScore = sessions.reduce(
    (sum, session) => sum + session.correct_answers * 2 + Math.max(0, 4 - session.wrong_answers),
    0
  )
  const focusRank = getLeaderboardTier(weeklyFocusScore)
  const cardsMasteredThisWeek = new Set(
    recentReviews.filter((review) => review.quality >= 3).map((review) => review.card_id)
  ).size
  const achievements = [
    { id: 'streak', label: 'Sequência ativa', unlocked: streak >= 3, icon: Flame },
    { id: 'focus', label: 'Focado', unlocked: reviewStats.totalReviews > 20, icon: Medal },
    { id: 'review', label: 'Hábito de revisão', unlocked: reviewStats.totalDue > 0, icon: Brain },
    { id: 'wins', label: 'Concluído', unlocked: completedCount > 0, icon: CheckCircle2 },
  ].filter((item) => item.unlocked)

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <HomeRealtime />

      <section className="grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
        <article className="premium-card relative overflow-hidden p-6 sm:p-8">
          <p className="section-kicker">Sequência semanal</p>
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[3.4rem] font-extrabold leading-none text-[var(--color-text)]">{streak}</span>
                <span className="pb-2 text-lg font-medium text-[var(--color-text-muted)]">Dias</span>
              </div>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
                {pendingCount > 0 && hasPendingReviews
                  ? `Você tem ${pendingCount} atividade${pendingCount === 1 ? '' : 's'} pendente${pendingCount === 1 ? '' : 's'} e ${reviewStats.totalDue} card${reviewStats.totalDue === 1 ? '' : 's'} para revisar hoje.`
                  : pendingCount > 0
                    ? `Você tem ${pendingCount} atividade${pendingCount === 1 ? '' : 's'} pendente${pendingCount === 1 ? '' : 's'} para manter o ritmo hoje.`
                    : hasPendingReviews
                      ? `Você ainda tem ${reviewStats.totalDue} card${reviewStats.totalDue === 1 ? '' : 's'} aguardando revisão hoje.`
                      : 'Seu plano do dia está concluído. Aproveite para consolidar a revisão.'}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-primary)] shadow-sm">
              <Flame className="h-6 w-6" strokeWidth={2.5} />
            </div>
          </div>

          <div className="mt-7 rounded-[1.25rem] bg-[var(--color-surface-container-low)] px-4 py-4 border border-[var(--color-border)]">
            <div className="flex items-center justify-between gap-2">
              {last7Days.map(({ dateStr, letter, completed }, index) => {
                const highlight = index === 6
                const active = completed || (highlight && streak > 0)
                return (
                  <Link
                    key={dateStr}
                    href={`/history?date=${dateStr}`}
                    transitionTypes={navForwardTransitionTypes}
                    className="flex flex-col items-center gap-2 transition-transform hover:scale-110 active:scale-95"
                  >
                    <span className={`text-[10px] font-bold tracking-wider ${highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'}`}>
                      {letter}
                    </span>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-black transition-all ${
                        highlight
                          ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_4px_12px_rgba(253,255,244,0.2)]'
                          : active
                            ? 'bg-[var(--color-primary-container)] text-[var(--color-primary)]'
                            : 'bg-[var(--color-surface-container-high)] text-[var(--color-text-subtle)]'
                      }`}
                    >
                      {highlight ? streak || 0 : (completed ? <CheckCircle2 className="h-4 w-4" /> : '•')}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </article>

        <article className="premium-card flex flex-col justify-center p-6 text-center sm:p-8">
          <p className="section-kicker mx-auto">Nível atual</p>
          <p className="mt-5 text-5xl font-black tracking-tight text-[var(--color-primary)]">
            {user.user_metadata?.english_level || 'B2'}
          </p>
          <p className="mt-2 text-base font-bold text-[var(--color-text-muted)]">
            {user.user_metadata?.english_level_name || 'Intermediário Superior'}
          </p>
          <div className="mt-8 h-3 overflow-hidden rounded-full bg-[var(--color-surface-container-high)] border border-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] shadow-[0_0_12px_rgba(253,255,244,0.15)] transition-all duration-500"
              style={{ width: `${Math.max(12, Math.min(100, completionRate))}%` }}
            />
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
            {completionRate}% da meta diária
          </p>
        </article>
      </section>

      <section className="premium-card p-4 sm:p-6 overflow-hidden">
        <div className="mx-auto flex w-full max-w-sm items-center justify-center rounded-[2rem] bg-[var(--color-surface-container-low)] p-6 sm:p-8 border border-[var(--color-border)] shadow-inner">
          <Image
            src="/images/home/english-proficiency-milestone.png"
            alt="Ilustração de aprendizado de inglês"
            width={360}
            height={319}
            className="h-auto w-full max-w-[18rem] sm:max-w-[20rem] drop-shadow-2xl"
            priority
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-[var(--color-text)]">Atividades pendentes</h2>
          {profile?.role === 'admin' && (
            <Link href="/admin/dashboard" transitionTypes={navForwardTransitionTypes} className="text-sm font-semibold text-[var(--color-primary)]">
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Painel
              </span>
            </Link>
          )}
        </div>

        {assignments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {assignments.slice(0, 3).map((assignment) => {
              const statusMeta = parseAssignmentStatus(assignment.status)
              const mode = gameModeConfig[assignment.game_mode] || gameModeConfig.multiple_choice
              const isCompleted = isAssignmentCompleted(assignment.status)

              return (
                <article key={assignment.id} data-testid="assignment-card" className="stitch-panel p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="stitch-pill bg-[var(--color-surface)] text-[var(--color-primary)]">
                      {mode.label}
                    </span>
                    {assignment.badges ? (
                      <span title={assignment.badges.name} className="text-2xl drop-shadow-sm">🏅</span>
                    ) : (
                      <BookOpen className="h-5 w-5 text-[var(--color-text-subtle)]" strokeWidth={2} />
                    )}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[var(--color-text)]">
                    {assignment.packs?.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {assignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.'}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-subtle)]">
                      <Clock className="h-3.5 w-3.5" />
                      {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Foco diário'}
                    </div>
                    {isCompleted ? (
                      <span className="stitch-pill bg-[rgba(70,98,89,0.1)] text-[var(--color-primary)]">Concluído</span>
                    ) : (
                      <Link
                        href={`/play/${assignment.id}`}
                        transitionTypes={navForwardTransitionTypes}
                        data-testid="assignment-start-button"
                        className="btn-primary px-4 py-2 text-xs"
                      >
                        Começar
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="premium-card p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--color-text-subtle)]" />
            <h3 className="mt-4 text-2xl font-bold text-[var(--color-text)]">Tudo em dia.</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Não há novas tarefas atribuídas agora.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="premium-card flex flex-col p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">3 melhores da Arena</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Ranking Semanal</h2>
            </div>
            <Trophy className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <div className="mt-6 space-y-3 flex-1">
            {topLeaderboard.length > 0 ? (
              topLeaderboard.map((entry, index) => (
                <div 
                  key={entry.userId} 
                  className={`relative overflow-hidden flex items-center justify-between rounded-[1rem] px-4 py-3 ${
                    index === 0 
                      ? 'bg-gradient-to-r from-orange-500/10 via-red-500/5 to-[var(--color-surface-container-low)] border border-orange-500/20' 
                      : 'bg-[var(--color-surface-container-low)]'
                  }`}
                >
                  {index === 0 && (
                    <div 
                      className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-color-burn" 
                      style={{
                        backgroundImage: 'radial-gradient(circle at 10% 50%, rgba(255,165,0,0.4) 0%, transparent 50%), radial-gradient(circle at 90% 50%, rgba(255,69,0,0.2) 0%, transparent 40%)'
                      }} 
                    />
                  )}
                  <Link
                    href={`/profile/${entry.username}`}
                    className="relative z-10 flex items-center gap-3 group"
                  >
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold overflow-hidden border-2 border-[var(--color-surface)] bg-[var(--color-surface-container-low)] text-[var(--color-text)] shadow-sm group-hover:border-[var(--color-primary)] transition-colors">
                        {entry.avatarUrl ? (
                          <img src={entry.avatarUrl} alt={entry.username} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm">{entry.username[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold border border-[var(--color-surface)] ${
                        index === 0 ? 'bg-gradient-to-br from-orange-400 to-red-600 text-white' :
                        index === 1 ? 'bg-slate-300 text-slate-800' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)]'
                      }`}>
                        {index === 0 ? <Flame className="h-2 w-2 fill-white" /> : index + 1}
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold group-hover:text-[var(--color-primary)] transition-colors ${index === 0 ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
                        {entry.username}
                      </p>
                      <p className={`text-xs ${index === 0 ? 'text-red-500/80' : 'text-[var(--color-text-subtle)]'}`}>
                        {entry.score} pts
                      </p>
                    </div>
                  </Link>
                  <span className={`relative z-10 text-xs font-semibold uppercase tracking-[0.14em] ${
                    index === 0 ? 'text-orange-600' : 'text-[var(--color-text-subtle)]'
                  }`}>
                    {entry.accuracy}% precisão
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Sem ranking suficiente nesta semana.</p>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <Link href="/ranking" transitionTypes={navForwardTransitionTypes} className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
              Ver ranking completo
            </Link>
          </div>
        </article>

        <article className="premium-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Conquistas</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Vitórias recentes</h2>
            </div>
            <Medal className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div key={achievement.id} className="rounded-[1rem] bg-[var(--color-surface-container-low)] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[var(--color-text)]">{achievement.label}</p>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="stitch-panel p-5">
          <p className="section-kicker">Revisão pendente</p>
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{reviewStats.totalDue}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Cards aguardando hoje.</p>
        </article>
        <article className="stitch-panel p-5">
          <p className="section-kicker">Cards dominados</p>
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{cardsMasteredThisWeek}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Consolidados nesta semana.</p>
        </article>
        <article className="stitch-panel p-5">
          <p className="section-kicker">Nível de foco</p>
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-primary)]">{focusRank}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Seu nível no foco semanal.</p>
        </article>
      </section>

      {(nextAssignment || reviewStats.totalDue > 0) && (
        <section className="premium-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Próxima ação</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
              {reviewStats.totalDue > 0 ? 'Sua revisão diária está pronta.' : 'Sua próxima atividade está pronta.'}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {reviewStats.totalDue > 0 && (
              <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary">
                <Brain className="h-4 w-4" />
                Começar revisão
              </Link>
            )}
            {nextAssignment && (
              <Link href={`/play/${nextAssignment.id}`} transitionTypes={navForwardTransitionTypes} className="btn-ghost !bg-[var(--color-surface-container-low)]">
                {nextAssignment.badges ? <span className="mr-1">🏅</span> : <ArrowRight className="h-4 w-4" />}
                Abrir lição
              </Link>
            )}
            <Link href="/history" transitionTypes={navForwardTransitionTypes} className="btn-ghost !bg-[var(--color-surface-container-low)]">
              <BarChart3 className="h-4 w-4" />
              Histórico
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
