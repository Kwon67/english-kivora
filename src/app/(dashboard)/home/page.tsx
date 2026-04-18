import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Keyboard,
  Layers,
  Medal,
  Puzzle,
  Settings,
  Target,
  Trophy,
} from 'lucide-react'
import AdaptiveCoachPanel from '@/components/home/AdaptiveCoachPanel'
import MissionBoard from '@/components/home/MissionBoard'
import MotivationalCarousel from '@/components/shared/MotivationalCarouselWrapper'
import PwaCoach from '@/components/pwa/PwaCoach'
import type { SessionErrorLog } from '@/components/shared/SessionErrorsViewer'
import StreakBadge from '@/components/shared/StreakBadge'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import {
  isAssignmentCompleted,
  isAssignmentIncomplete,
  parseAssignmentStatus,
} from '@/lib/assignmentStatus'
import { buildAdaptiveCoachPlan } from '@/lib/adaptiveCoach'
import { buildWeeklyLeaderboard, getLeaderboardTier } from '@/lib/leaderboard'
import { buildMissionState } from '@/lib/missions'
import { getReviewQueueSummaryForUser } from '@/lib/reviewQueue'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import HomeRealtime from './HomeRealtime'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const gameModeConfig: Record<string, { label: string; icon: typeof Target }> = {
  multiple_choice: { label: 'Múltipla escolha', icon: Target },
  flashcard: { label: 'Flashcard', icon: Layers },
  typing: { label: 'Digitação', icon: Keyboard },
  matching: { label: 'Combinação', icon: Puzzle },
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy: { label: 'Fácil', className: 'bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)] border border-[var(--color-primary)]' },
  medium: { label: 'Médio', className: 'bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)] border border-[rgba(43,122,11,0.14)]' },
  hard: { label: 'Difícil', className: 'bg-red-50 text-red-700 border border-red-200' },
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
}

type SessionSummary = {
  correct_answers: number
  wrong_answers: number
}

type HomeRecentSession = SessionSummary & {
  completed_at: string
  assignments: {
    game_mode: string
    packs: Pick<HomePack, 'name'> | null
  } | null
  session_errors: SessionErrorLog[]
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

  return streak
}

async function getReviewStats(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  return getReviewQueueSummaryForUser(
    supabase as unknown as Parameters<typeof getReviewQueueSummaryForUser>[0],
    userId
  )
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ reviewComplete?: string; sessionComplete?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { reviewComplete, sessionComplete } = await searchParams

  const materializePromise = materializeScheduledReviewReleasesForUser(user.id)
  const weeklyStart = shiftAppDate(getAppDateString(), -7)

  const [
    profileResult,
    assignmentsResult,
    sessionsResult,
    recentSessionsResult,
    recentReviewsResult,
    leaderboardMembersResult,
    leaderboardSessionsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('username,role').eq('id', user.id).single(),
    supabase
      .from('assignments')
      .select('id,assigned_date,status,game_mode,packs(name,description,level)')
      .eq('user_id', user.id)
      .order('assigned_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('game_sessions')
      .select('correct_answers,wrong_answers')
      .eq('user_id', user.id),
    supabase
      .from('game_sessions')
      .select('completed_at,correct_answers,wrong_answers,assignments(game_mode,packs(name)),session_errors(*, cards(english_phrase, portuguese_translation, audio_url))')
      .eq('user_id', user.id)
      .gte('completed_at', `${weeklyStart}T00:00:00.000Z`)
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase
      .from('card_reviews')
      .select('card_id,quality,review_date')
      .eq('user_id', user.id)
      .gte('review_date', `${weeklyStart}T00:00:00.000Z`)
      .order('review_date', { ascending: false }),
    supabase.from('profiles').select('id,username,role').order('username'),
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
    ((assignmentsResult.data as HomeAssignment[] | null) || []).filter((assignment) => {
      if (!isPlayableAssignmentGameMode(assignment.game_mode)) return false
      return true
    })
  const assignments = allPlayableAssignments.filter((assignment) => {
    const status = parseAssignmentStatus(assignment.status)
    return assignment.assigned_date >= today || status.baseStatus !== 'completed'
  })
  const sessions = (sessionsResult.data as SessionSummary[] | null) || []
  const recentSessions = (recentSessionsResult.data as unknown as HomeRecentSession[] | null) || []
  const recentReviews = (recentReviewsResult.data as HomeRecentReview[] | null) || []
  const leaderboardMembers =
    (leaderboardMembersResult.data || [])
      .filter((member) => member.role !== 'admin')
      .map((member) => ({ id: member.id, username: member.username })) || []
  const leaderboardSessions =
    (leaderboardSessionsResult.data || []).map((session) => ({
      user_id: session.user_id,
      correct_answers: session.correct_answers,
      wrong_answers: session.wrong_answers,
      max_streak: session.max_streak,
    })) || []

  const streak = calculateStreak(allPlayableAssignments, today)
  const reviewStats = await getReviewStats(user.id, supabase)
  const leaderboard = buildWeeklyLeaderboard(leaderboardMembers, leaderboardSessions)
  const topLeaderboard = leaderboard.slice(0, 5)
  const currentUserLeaderboardEntry = leaderboard.find((entry) => entry.userId === user.id) || null

  // Achievements calculation
  const achievements = [
    {
      id: 'first-step',
      label: 'Explorador',
      description: 'Começou a jornada',
      unlocked: reviewStats.totalReviews > 0,
      icon: Trophy,
      className: 'bg-[rgba(223,236,205,0.72)] text-[var(--color-primary)] border-[rgba(43,122,11,0.18)]',
    },
    {
      id: 'streak-3',
      label: 'Focado',
      description: '3 dias de ritmo',
      unlocked: streak >= 3,
      icon: Target,
      className: 'bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)] border-[rgba(43,122,11,0.14)]',
    },
    {
      id: 'streak-7',
      label: 'Imbatível',
      description: '7 dias seguidos',
      unlocked: streak >= 7,
      icon: Flame,
      className: 'bg-red-50 text-red-600 border-red-100',
    },
    {
      id: 'learned-150',
      label: 'Sábio',
      description: '150+ cards memorizados',
      unlocked: reviewStats.totalReviews >= 150,
      icon: Brain,
      className: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      id: 'perfectionist',
      label: 'Cirúrgico',
      description: 'Sessão 100% (10+ cards)',
      unlocked: sessions.some((s) => s.wrong_answers === 0 && s.correct_answers >= 10),
      icon: Medal,
      className: 'bg-[rgba(239,241,239,0.96)] text-[var(--color-text)] border-[rgba(43,122,11,0.12)]',
    },
  ].filter((a) => a.unlocked)

  const totalAssignments = assignments.length
  const pendingAssignments = assignments.filter((assignment) => !isAssignmentCompleted(assignment.status))
  const pendingCount = pendingAssignments.length
  const completedCount = totalAssignments - pendingCount
  const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 100
  const nextAssignment = pendingAssignments[0]
  const dailyGoalTarget = totalAssignments + (reviewStats.totalDue > 0 ? 1 : 0)
  const dailyGoalCompleted = completedCount + (reviewStats.totalDue === 0 ? (dailyGoalTarget > 0 ? 1 : 0) : 0)
  const dailyGoalProgress =
    dailyGoalTarget > 0 ? Math.min(100, Math.round((dailyGoalCompleted / dailyGoalTarget) * 100)) : 100
  const weeklyFocusScore = recentSessions.reduce(
    (sum, session) => sum + session.correct_answers * 2 + Math.max(0, 4 - session.wrong_answers),
    0
  )
  const focusRank =
    getLeaderboardTier(weeklyFocusScore)
  const cardsMasteredThisWeek = new Set(
    recentReviews.filter((review) => review.quality >= 3).map((review) => review.card_id)
  ).size
  const weaknessMap = new Map<string, { en: string; pt: string; count: number }>()

  for (const session of recentSessions) {
    for (const error of session.session_errors || []) {
      if (!error.card_id || !error.cards) continue

      const existing = weaknessMap.get(error.card_id) || {
        en: error.cards.english_phrase,
        pt: error.cards.portuguese_translation,
        count: 0,
      }
      existing.count += 1
      weaknessMap.set(error.card_id, existing)
    }
  }

  const topWeakCards = [...weaknessMap.values()].sort((a, b) => b.count - a.count).slice(0, 3)
  const coachPlan = buildAdaptiveCoachPlan({
    reviewStats,
    pendingAssignments,
    recentSessions,
    topWeakCards,
    dailyGoalProgress,
  })
  const missionState = buildMissionState({
    today,
    weeklyStart,
    assignments: allPlayableAssignments,
    sessions: recentSessions,
    reviews: recentReviews,
    pendingAssignmentsCount: pendingCount,
    reviewStats,
  })
  const showMissionPulse = reviewComplete === 'true' || sessionComplete === 'true'

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <HomeRealtime />

      {/* 1. HERO SECTION */}
      <section
        className="bg-[var(--color-surface-container-lowest)] rounded-[2rem] p-8 md:p-12 editorial-shadow ghost-border flex flex-col justify-between relative overflow-hidden animate-slide-up"
      >
        <div className="section-kicker">English flow for today</div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-responsive-lg font-semibold text-[var(--color-text)]">
              Seu inglês fica mais afiado quando a rotina fica mais gostosa de abrir.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              Olá, {profile?.username || 'estudante'}.{' '}
              {pendingCount > 0
                ? `Você tem ${pendingCount} ${pendingCount === 1 ? 'lição pendente' : 'lições pendentes'} para manter o ritmo hoje.`
                : 'Seu plano do dia está concluído. Aproveite para revisar e consolidar o vocabulário.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile?.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                transitionTypes={navForwardTransitionTypes}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,122,11,0.16)] bg-[linear-gradient(135deg,rgba(223,236,205,0.96),rgba(211,230,187,0.9))] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-[0_18px_36px_-24px_rgba(43,122,11,0.34)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(43,122,11,0.12)] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
                  <Settings className="h-4 w-4" strokeWidth={2.3} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]/70">
                    Admin
                  </span>
                  <span className="font-bold text-[var(--color-primary)]">Painel</span>
                </span>
              </Link>
            )}
            <StreakBadge count={streak} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {reviewStats.totalDue > 0 ? (
            <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary">
              <Brain className="h-4 w-4" strokeWidth={2} />
              Iniciar revisão
            </Link>
          ) : (
            <Link href="/history" transitionTypes={navForwardTransitionTypes} className="btn-primary">
              <BarChart3 className="h-4 w-4" strokeWidth={2} />
              Ver histórico
            </Link>
          )}

          {pendingCount === 0 && totalAssignments > 0 && (
            <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-ghost">
              <Clock className="h-4 w-4" strokeWidth={2} />
              Revisar tarefas
            </Link>
          )}

          {nextAssignment && (
            <Link href={`/play/${nextAssignment.id}`} transitionTypes={navForwardTransitionTypes} className="btn-ghost">
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
              Continuar lição
            </Link>
          )}
        </div>
      </section>

      {/* 2. ACHIEVEMENTS */}
      {achievements.length > 0 && (
        <section className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '40ms' }}>
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <div
                key={achievement.id}
                title={achievement.description}
                className={`flex items-center gap-2.5 rounded-full border px-4 py-2 transition-all hover:scale-105 ${achievement.className}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                <p className="text-xs font-bold">{achievement.label}</p>
              </div>
            )
          })}
        </section>
      )}

      {/* 3. PRIMARY ACTION: ASSIGNMENTS (TAREFAS DO DIA) */}
      <section className="space-y-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Daily assignments</p>
            <h2 className="mt-4 text-4xl font-semibold text-[var(--color-text)]">Tarefas do dia</h2>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-white/72 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
            {completedCount} de {totalAssignments} concluído{totalAssignments === 1 ? '' : 's'}
          </div>
        </div>

        {assignments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {assignments.map((assignment, index) => {
              const statusMeta = parseAssignmentStatus(assignment.status)
              const mode = gameModeConfig[assignment.game_mode] || gameModeConfig.multiple_choice
              const level = assignment.packs?.level || 'easy'
              const difficulty = difficultyConfig[level] || difficultyConfig.easy
              const Icon = mode.icon
              const isCompleted = isAssignmentCompleted(assignment.status)
              const isIncomplete = isAssignmentIncomplete(assignment.status)

              return (
                <article
                  key={assignment.id}
                  data-testid="assignment-card"
                  className={`bg-[var(--color-surface-container-lowest)] ghost-border rounded-[2rem] flex flex-col justify-between p-8 editorial-shadow animate-slide-up ${isCompleted ? 'border-[var(--color-border)] bg-[var(--color-surface-container-low)]' : ''}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge ${difficulty.className}`}>{difficulty.label}</span>
                          <span className="badge border border-[var(--color-border)] bg-white/70 text-[var(--color-text-muted)]">
                            {mode.label}
                          </span>
                          {statusMeta.timeLimitMinutes && (
                            <span className="badge border border-[rgba(43,122,11,0.14)] bg-[rgba(43,122,11,0.06)] text-[var(--color-primary)]">
                              {statusMeta.timeLimitMinutes} min
                            </span>
                          )}
                        </div>

                        <h3 className="mt-5 text-3xl font-semibold leading-[1.02] text-[var(--color-text)]">
                          {assignment.packs?.name}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                          {assignment.packs?.description || 'Sessão preparada para manter a consistência do seu inglês.'}
                        </p>
                      </div>

                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isCompleted ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'}`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-7 w-7" strokeWidth={1.8} />
                        ) : (
                          <Icon className="h-7 w-7" strokeWidth={1.8} />
                        )}
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Status
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {isCompleted ? 'Concluído' : isIncomplete ? 'Incompleto' : 'Pronto para jogar'}
                        </p>
                      </div>
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Modo
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{mode.label}</p>
                      </div>
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          {statusMeta.timeLimitMinutes ? 'Tempo' : 'Foco'}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {statusMeta.timeLimitMinutes
                            ? `${statusMeta.timeLimitMinutes} min`
                            : level === 'easy'
                              ? 'Base'
                              : level === 'medium'
                                ? 'Ritmo'
                                : 'Desafio'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7">
                    {!isCompleted ? (
                      <Link
                        href={`/play/${assignment.id}`}
                        transitionTypes={navForwardTransitionTypes}
                        data-testid="assignment-start-button"
                        className={`w-full py-4 ${isIncomplete ? 'btn-ghost' : 'btn-primary'}`}
                      >
                        {isIncomplete ? 'Continuar treinamento' : 'Iniciar treinamento'}
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                      </Link>
                    ) : (
                      <div
                        className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white"
                        style={{ backgroundColor: '#2B7A0B' }}
                      >
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                        Concluído
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] editorial-shadow ghost-border rounded-[2rem] p-10 text-center md:p-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-container)] text-[var(--color-text)]">
              <BookOpen className="h-9 w-9" strokeWidth={1.7} />
            </div>
            <h2 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">Tudo certo por hoje.</h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
              O administrador ainda não atribuiu novas lições. Se quiser manter o ritmo, use a revisão ou abra o histórico.
            </p>
          </div>
        )}
      </section>

      {/* 4. SPACED REPETITION / REVIEW */}
      {reviewStats.totalDue > 0 && (
        <section
          className="bg-[var(--color-surface-container)] p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 editorial-shadow animate-slide-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between w-full">
            <div className="flex items-start gap-4">
              <div className="icon-glow flex h-14 w-14 items-center justify-center rounded-[22px] text-[var(--color-primary)]">
                <Brain className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <div className="max-w-xl">
                <p className="section-kicker">Revisão espaçada</p>
                <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                  Hora de consolidar a memória.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                  Você tem {reviewStats.dueToday} revisões vencidas e {reviewStats.newCards} novos cards.
                </p>
              </div>
            </div>

            <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary shrink-0">
              Começar revisão
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      )}

      {/* 5. GAMIFICATION & STATS */}
      <MissionBoard state={missionState} showPulse={showMissionPulse} />
      
      {profile?.role !== 'admin' && (
        <PwaCoach dueCount={reviewStats.totalDue} pendingCount={pendingCount} />
      )}
      
      <MotivationalCarousel />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="card p-6">
          <p className="section-kicker">Daily goal</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--color-text)]">
                {dailyGoalCompleted}/{dailyGoalTarget || 1}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Feche as tarefas do dia e zere as revisões para completar a missão.
              </p>
            </div>
            <span className="badge border border-[var(--color-border)] bg-white/72 text-[var(--color-text-muted)]">
              {dailyGoalProgress}% concluído
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[rgba(17,32,51,0.08)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary))] transition-all duration-500"
              style={{ width: `${dailyGoalProgress}%` }}
            />
          </div>
        </div>

        <div className="card p-6">
          <p className="section-kicker">Weekly score</p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--color-text)]">{weeklyFocusScore}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Pontos por consistência e acertos (7 dias).
              </p>
            </div>
            <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
              {focusRank}
            </span>
          </div>
        </div>
      </section>

      {/* 6. ADAPTIVE COACH & WEAKNESSES */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] animate-slide-up" style={{ animationDelay: '120ms' }}>
        <AdaptiveCoachPanel plan={coachPlan} />
        
        <div className="space-y-6">
          <div className="card p-6">
            <p className="section-kicker">Pontos fracos</p>
            <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">
              {topWeakCards[0]?.en || 'Sem padrão forte'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {topWeakCards[0]
                ? `${topWeakCards[0].pt} apareceu ${topWeakCards[0].count}x nos erros recentes.`
                : 'Os erros recentes ainda não formaram um ponto fraco dominante.'}
            </p>
            <Link href="/problem-words" transitionTypes={navForwardTransitionTypes} className="btn-ghost mt-5 w-full">
              <Target className="h-4 w-4" strokeWidth={2} />
              Palavras problemáticas
            </Link>
          </div>

          <div className="card p-6">
            <p className="section-kicker">Semana</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
              {cardsMasteredThisWeek}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              cards com revisão boa nesta semana.
            </p>
          </div>
        </div>
      </div>

      {/* 7. WEEKLY RANKING */}
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] animate-slide-up" style={{ animationDelay: '140ms' }}>
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Weekly ranking</p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                Ranking da equipe
              </h2>
            </div>
            <span className="badge border border-[var(--color-border)] bg-white/72 text-[var(--color-text-muted)]">
              7 dias
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {topLeaderboard.length > 0 ? (
              topLeaderboard.map((entry, index) => {
                const isFirst = index === 0
                return (
                  <div
                    key={entry.userId}
                    className={`relative flex items-center justify-between gap-4 rounded-[24px] border px-5 py-4 transition-all animate-slide-up ${
                      isFirst
                        ? 'border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.9),rgba(254,243,199,0.8))] shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/20'
                        : entry.userId === user.id
                        ? 'border-[var(--color-primary)] bg-[rgba(43,122,11,0.08)]'
                        : 'border-[var(--color-border)] bg-white/76'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {isFirst && (
                      <div className="absolute -top-3 -left-3 z-10 animate-float">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40">
                          <Flame className="h-5 w-5 fill-current animate-pulse" />
                        </div>
                      </div>
                    )}

                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-black text-sm shadow-sm ${
                        isFirst 
                          ? 'bg-amber-400 text-amber-900 shadow-amber-200' 
                          : 'bg-[var(--color-surface-container)] text-[var(--color-text)]'
                      }`}>
                        #{entry.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`truncate font-bold ${isFirst ? 'text-amber-900 text-lg' : 'text-[var(--color-text)]'}`}>
                            {entry.username}
                          </p>
                          {isFirst && (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white animate-pulse">
                              Líder
                            </span>
                          )}
                        </div>
                        <p className={`mt-0.5 text-xs ${isFirst ? 'text-amber-700/80 font-medium' : 'text-[var(--color-text-muted)]'}`}>
                          {entry.sessions} sessões · {entry.accuracy}% precisão
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-black shadow-sm ${
                        isFirst 
                          ? 'bg-amber-500 text-white shadow-amber-200' 
                          : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      }`}>
                        {entry.score} pts
                      </span>
                      {isFirst && (
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Imbatível</p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] px-4 py-10 text-center bg-white/40 rounded-3xl border border-dashed border-[var(--color-border)]">
                Aguardando as primeiras batalhas da semana...
              </p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <p className="section-kicker">Sua posição</p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
            {currentUserLeaderboardEntry ? `#${currentUserLeaderboardEntry.rank}` : 'Sem posição'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {currentUserLeaderboardEntry
              ? `${currentUserLeaderboardEntry.score} pontos nesta semana. Faixa ${getLeaderboardTier(currentUserLeaderboardEntry.score)}.`
              : 'Ainda não há sessões suficientes para entrar no ranking semanal.'}
          </p>
          {currentUserLeaderboardEntry && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Pontos
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                  {currentUserLeaderboardEntry.score}
                </p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Precisão
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                  {currentUserLeaderboardEntry.accuracy}%
                </p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Melhor streak
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                  {currentUserLeaderboardEntry.bestStreak}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
