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
  easy: { label: 'Fácil', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  medium: { label: 'Médio', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  hard: { label: 'Difícil', className: 'bg-rose-50 text-rose-700 border-rose-100' },
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
      className: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    },
    {
      id: 'streak-3',
      label: 'Focado',
      description: '3 dias de ritmo',
      unlocked: streak >= 3,
      icon: Target,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      id: 'streak-7',
      label: 'Imbatível',
      description: '7 dias seguidos',
      unlocked: streak >= 7,
      icon: Flame,
      className: 'bg-rose-50 text-rose-700 border-rose-100',
    },
    {
      id: 'learned-150',
      label: 'Sábio',
      description: '150+ cards memorizados',
      unlocked: reviewStats.totalReviews >= 150,
      icon: Brain,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'perfectionist',
      label: 'Cirúrgico',
      description: 'Sessão 100% (10+ cards)',
      unlocked: sessions.some((s) => s.wrong_answers === 0 && s.correct_answers >= 10),
      icon: Medal,
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
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

      {/* 1. HERO SECTION - Minimal Slate Surface */}
      <section
        className="bg-white rounded-[2rem] p-8 md:p-12 editorial-shadow border border-slate-100 flex flex-col justify-between relative overflow-hidden animate-slide-up"
      >
        <div className="section-kicker">English flow for today</div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-responsive-lg font-bold text-slate-900 tracking-tight">
              Seu inglês fica mais afiado quando a rotina fica mais gostosa de abrir.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
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
                className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-slate-600">
                  <Settings className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Admin</p>
                  <p className="font-bold">Painel</p>
                </div>
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
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2 transition-all hover:translate-y-[-2px] ${achievement.className}`}
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
            <h2 className="mt-4 text-4xl font-bold text-slate-900">Tarefas do dia</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500">
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
                  className={`bg-white border border-slate-100 rounded-[2rem] flex flex-col justify-between p-8 editorial-shadow animate-slide-up ${isCompleted ? 'bg-slate-50' : ''}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${difficulty.className}`}>{difficulty.label}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                            {mode.label}
                          </span>
                          {statusMeta.timeLimitMinutes && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600">
                              {statusMeta.timeLimitMinutes} min
                            </span>
                          )}
                        </div>

                        <h3 className="mt-6 text-2xl font-bold text-slate-900">
                          {assignment.packs?.name}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-slate-500">
                          {assignment.packs?.description || 'Sessão preparada para manter a consistência do seu inglês.'}
                        </p>
                      </div>

                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
                        ) : (
                          <Icon className="h-7 w-7" strokeWidth={2} />
                        )}
                      </div>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                        <p className="mt-1.5 text-sm font-bold text-slate-700">
                          {isCompleted ? 'Concluído' : isIncomplete ? 'Incompleto' : 'Disponível'}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Modo</p>
                        <p className="mt-1.5 text-sm font-bold text-slate-700">{mode.label}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{statusMeta.timeLimitMinutes ? 'Tempo' : 'Nível'}</p>
                        <p className="mt-1.5 text-sm font-bold text-slate-700">
                          {statusMeta.timeLimitMinutes
                            ? `${statusMeta.timeLimitMinutes} min`
                            : level === 'easy' ? 'Base' : level === 'medium' ? 'Interm.' : 'Avançado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
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
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                        Tarefa Finalizada
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-10 text-center md:p-16 editorial-shadow">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <BookOpen className="h-8 w-8" strokeWidth={2} />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">Tudo em dia.</h2>
            <p className="mx-auto mt-3 max-w-md text-slate-500">
              O administrador ainda não atribuiu novas lições. Se quiser manter o ritmo, use a revisão.
            </p>
          </div>
        )}
      </section>

      {/* 4. SPACED REPETITION / REVIEW */}
      {reviewStats.totalDue > 0 && (
        <section
          className="bg-white border border-slate-100 p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 editorial-shadow animate-slide-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between w-full">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Brain className="h-8 w-8" strokeWidth={2} />
              </div>
              <div className="max-w-xl">
                <p className="section-kicker mb-3">Spaced Repetition</p>
                <h2 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">
                  Sua memória precisa de você.
                </h2>
                <p className="mt-2 text-slate-500 font-medium">
                  {reviewStats.dueToday} revisões vencidas e {reviewStats.newCards} novos cards hoje.
                </p>
              </div>
            </div>

            <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary px-10 shrink-0 shadow-lg shadow-emerald-600/20">
              Começar revisão
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
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
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 editorial-shadow">
          <p className="section-kicker">Daily goal</p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                {dailyGoalCompleted}/{dailyGoalTarget || 1}
              </h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Conclua as tarefas e revisões para fechar o dia.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              {dailyGoalProgress}% concluído
            </span>
          </div>
          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `${dailyGoalProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 editorial-shadow">
          <p className="section-kicker">Weekly score</p>
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{weeklyFocusScore}</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Sua pontuação total nos últimos 7 dias.
              </p>
            </div>
            <span className="inline-flex rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 border border-indigo-100 uppercase tracking-wider">
              {focusRank}
            </span>
          </div>
        </div>
      </section>

      {/* 6. ADAPTIVE COACH & WEAKNESSES */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] animate-slide-up" style={{ animationDelay: '120ms' }}>
        <AdaptiveCoachPanel plan={coachPlan} />
        
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 editorial-shadow transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-rose-500/20 hover:border-rose-200">
            <p className="section-kicker">Pontos fracos</p>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
              {topWeakCards[0]?.en || 'Consistente'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {topWeakCards[0]
                ? `A expressão "${topWeakCards[0].pt}" causou ${topWeakCards[0].count} erros recentemente.`
                : 'Você está mantendo um ótimo nível em todos os conteúdos.'}
            </p>
            <Link href="/problem-words" transitionTypes={navForwardTransitionTypes} className="btn-ghost mt-6 w-full py-3.5 text-sm !rounded-xl">
              <Target className="h-4 w-4" strokeWidth={2} />
              Lista completa
            </Link>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 editorial-shadow transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-indigo-500/20 hover:border-indigo-200">
            <p className="section-kicker">Semana</p>
            <h2 className="mt-4 text-4xl font-black text-slate-900 tracking-tighter">
              {cardsMasteredThisWeek}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              cards dominados nos últimos 7 dias.
            </p>
          </div>
        </div>
      </div>

      {/* 7. WEEKLY RANKING - Indigo & Modern Slate */}
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] animate-slide-up" style={{ animationDelay: '140ms' }}>
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 editorial-shadow transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-indigo-500/20 hover:border-indigo-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Weekly ranking</p>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">Elite da Semana</h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
              Top 5
            </span>
          </div>

          <div className="mt-8 space-y-4">
            {topLeaderboard.length > 0 ? (
              topLeaderboard.map((entry, index) => {
                const isFirst = index === 0
                return (
                  <div
                    key={entry.userId}
                    className={`relative flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition-all hover:scale-[1.02] ${
                      isFirst
                        ? 'border-orange-200 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-sm scale-[1.02]'
                        : entry.userId === user.id
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                        isFirst 
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' 
                          : 'bg-white border border-slate-100 text-slate-500 shadow-sm'
                      }`}>
                        {isFirst ? <Flame className="h-5 w-5 fill-white animate-pulse" /> : `#${entry.rank}`}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`truncate font-bold ${isFirst ? 'text-orange-950 text-base' : 'text-slate-700'}`}>
                            {entry.username}
                          </p>
                          {isFirst && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">MVP</span>
                          )}
                        </div>
                        <p className={`text-[11px] font-medium uppercase tracking-tighter ${isFirst ? 'text-orange-700/80' : 'text-slate-400'}`}>
                          {entry.sessions} sessões · {entry.accuracy}% precisão
                        </p>
                      </div>
                    </div>
                    
                    <span className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-black ${
                      isFirst 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' 
                        : 'bg-white border border-slate-100 text-slate-600'
                    }`}>
                      {entry.score} pts
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-slate-400 px-4 py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Ainda não há dados suficientes para gerar o ranking.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 editorial-shadow transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-indigo-500/20 hover:border-indigo-200">
          <p className="section-kicker">Sua posição</p>
          <h2 className="mt-4 text-4xl font-black text-slate-900 tracking-tighter">
            {currentUserLeaderboardEntry ? `#${currentUserLeaderboardEntry.rank}` : '---'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {currentUserLeaderboardEntry
              ? `Você está na faixa ${getLeaderboardTier(currentUserLeaderboardEntry.score)}.`
              : 'Complete sessões para entrar no ranking.'}
          </p>
          {currentUserLeaderboardEntry && (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pts</p>
                <p className="mt-1 text-xl font-black text-slate-800">{currentUserLeaderboardEntry.score}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">%</p>
                <p className="mt-1 text-xl font-black text-slate-800">{currentUserLeaderboardEntry.accuracy}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Strk</p>
                <p className="mt-1 text-xl font-black text-slate-800">{currentUserLeaderboardEntry.bestStreak}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
