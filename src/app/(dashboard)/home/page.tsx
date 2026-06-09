import { DecoCheck } from '@/components/ui/DecorativeSvgs'
import HomeBottomCards from './HomeBottomCards'
import HomeFooter from './HomeFooter'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Medal,
  Settings,
} from 'lucide-react'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
import { getLeaderboardTier } from '@/features/leaderboard/lib/leaderboard'
import { getWeeklyLeaderboard } from '@/features/leaderboard/lib/weeklyLeaderboard'
import { getReviewQueueSummaryForUser } from '@/features/review/lib/reviewQueue'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/features/review/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import HomeRealtime from './HomeRealtime'
import DailyQuestsWidget from './DailyQuestsWidget'
import StaggeredFadeIn from '@/components/ui/StaggeredFadeIn'
import HomeHeroIllustration from '@/features/profile/components/HomeHeroIllustration'
import EmptyState from '@/components/ui/EmptyState'
import RankingWidget from '@/features/leaderboard/components/RankingWidget'

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

const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 shadow-[0_24px_70px_rgba(24,32,29,0.12)] backdrop-blur-md'
const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/35 shadow-[0_22px_64px_rgba(24,32,29,0.10)] backdrop-blur-md'
const loginButton =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-[32px] bg-emerald-800 px-5 py-3.5 font-montserrat text-sm font-bold text-white shadow-[0px_8px_15px_0px_rgba(0,0,0,0.10)] transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600'
const softButton =
  'inline-flex items-center justify-center gap-2 rounded-[32px] border border-zinc-200/70 bg-white/45 px-5 py-3.5 text-sm font-bold text-emerald-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-emerald-700'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800'

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
  total_reviews: number
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

  const windowStartIso = `${weeklyStart}T00:00:00.000Z`

  const [
    profileResult,
    assignmentsResult,
    sessionsResult,
    recentReviewsResult,
    topLeaderboard,
    questsResult,
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
      .select('card_id,quality,review_date,total_reviews')
      .eq('user_id', user.id)
      .gte('review_date', windowStartIso)
      .order('review_date', { ascending: false }),
    getWeeklyLeaderboard(supabase as Parameters<typeof getWeeklyLeaderboard>[0], windowStartIso, 3),
    supabase
      .from('user_quests')
      .select('id,quest_type,target,progress,status')
      .eq('user_id', user.id)
      .order('status', { ascending: true }) // active first
      .order('created_at', { ascending: false }),
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
  const totalAssignments = assignments.length
  const pendingAssignments = assignments.filter((assignment) => !isAssignmentCompleted(assignment.status))
  const pendingCount = pendingAssignments.length
  const completedCount = totalAssignments - pendingCount
  const completedReviewsToday = recentReviews.filter(
    (review) => review.total_reviews > 0 && getAppDateString(review.review_date) === today
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
  const primaryAction = hasPendingReviews
    ? {
        href: '/review',
        label: 'Começar revisão',
        title: 'Sua revisão diária está pronta.',
        description: `Você tem ${reviewStats.totalDue} card${reviewStats.totalDue === 1 ? '' : 's'} aguardando revisão hoje.`,
        icon: Brain,
      }
    : nextAssignment
      ? {
          href: `/play/${nextAssignment.id}`,
          label: 'Começar atividade',
          title: nextAssignment.packs?.name || 'Sua próxima atividade está pronta.',
          description: nextAssignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.',
          icon: BookOpen,
        }
      : {
          href: '/history',
          label: 'Ver histórico',
          title: 'Tudo em dia por agora.',
          description: 'Seu plano do dia está concluído. Use esse momento para acompanhar sua evolução ou explorar novos conteúdos.',
          icon: CheckCircle2,
        }
  const PrimaryActionIcon = primaryAction.icon

  return (
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-hidden bg-zinc-50 px-4 py-6 pb-10 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.24] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,#065f46_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="home-bg-orbs pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="home-bg-orb animate-float-1 absolute -top-28 left-[6%] h-[280px] w-[280px] rounded-full bg-emerald-500/12 blur-[85px]" />
        <div className="home-bg-orb animate-float-2 absolute top-[26rem] -right-20 h-[360px] w-[360px] rounded-full bg-amber-500/10 blur-[95px]" />
        <div className="home-bg-orb animate-float-3 absolute bottom-20 left-[12%] h-[240px] w-[240px] rounded-full bg-sky-500/8 blur-[90px]" />
      </div>

    <div className="relative z-10 space-y-6 pb-8">
      <HomeRealtime />

      <StaggeredFadeIn className="relative z-10 space-y-6">
        <section className={`${glassPanel} p-6 sm:p-8`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35" />
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 shadow-sm ring-1 ring-emerald-900/10">
                <PrimaryActionIcon className="h-6 w-6" strokeWidth={2.3} />
              </div>
              <p className={`${softKicker} mt-5`}>Revisão diária</p>
              <h1 className="mt-4 max-w-2xl font-montserrat text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
                {primaryAction.title}
              </h1>
              <p className="mt-4 max-w-2xl font-inter text-sm leading-relaxed text-zinc-600 sm:text-base">
                {primaryAction.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={primaryAction.href} transitionTypes={navForwardTransitionTypes} prefetch={false} className={loginButton}>
                  <PrimaryActionIcon className="h-4 w-4" />
                  {primaryAction.label}
                </Link>
                {hasPendingReviews && nextAssignment ? (
                  <Link href={`/play/${nextAssignment.id}`} transitionTypes={navForwardTransitionTypes} prefetch={false} className={softButton}>
                    {nextAssignment.badges ? <span className="mr-1">🏅</span> : <ArrowRight className="h-4 w-4" />}
                    Abrir lição
                  </Link>
                ) : (
                  <Link href="/explore" transitionTypes={navForwardTransitionTypes} prefetch={false} className={softButton}>
                    <BookOpen className="h-4 w-4" />
                    Explorar
                  </Link>
                )}
              </div>
            </div>

            <div className="home-hero-visual relative z-10 mx-auto flex w-full max-w-sm items-center justify-center rounded-[32px] border border-zinc-200/45 bg-white/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-sm">
              <HomeHeroIllustration className="h-auto w-full max-w-[18rem] sm:max-w-[20rem]" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className={`${glassTile} p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={softKicker}>Sequência</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="font-montserrat text-4xl font-bold leading-none text-zinc-900">{streak}</span>
                  <span className="pb-1 text-sm font-bold text-zinc-500">dias</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50/75 text-emerald-800">
                <Flame className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2">
              {last7Days.map(({ dateStr, letter, completed }, index) => {
                const highlight = index === 6
                const active = completed || (highlight && streak > 0)
                return (
                  <Link
                    key={dateStr}
                    href={`/history?date=${dateStr}`}
                    transitionTypes={navForwardTransitionTypes}
                    prefetch={false}
                    className="flex flex-col items-center gap-2 transition-transform hover:scale-110 active:scale-95"
                  >
                    <span className={`text-[10px] font-bold tracking-wider ${highlight ? 'text-emerald-800' : 'text-zinc-400'}`}>
                      {letter}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black transition-all ${
                        highlight
                          ? 'bg-emerald-800 text-white shadow-sm'
                          : active
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-white/45 text-zinc-400 ring-1 ring-zinc-200/60'
                      }`}
                    >
                      {highlight ? streak || 0 : (completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : '•')}
                    </div>
                  </Link>
                )
              })}
            </div>
          </article>

          <article className={`${glassTile} p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={softKicker}>Meta diária</p>
                <p className="mt-4 font-montserrat text-4xl font-bold text-zinc-900">{completionRate}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50/75 text-emerald-800">
                <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full border border-zinc-200/70 bg-white/45">
              <div
                className="h-full rounded-full bg-emerald-800 transition-all duration-500"
                style={{ width: `${Math.max(12, Math.min(100, completionRate))}%` }}
              />
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-500">
              {completedDailyWork} de {totalDailyWork} tarefas do dia concluídas.
            </p>
          </article>

          <article className={`${glassTile} p-5`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={softKicker}>Nível atual</p>
                <p className="mt-4 font-montserrat text-4xl font-bold text-emerald-800">
                  {user.user_metadata?.english_level || 'B2'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50/75 text-emerald-800">
                <Medal className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-zinc-600">
              {user.user_metadata?.english_level_name || 'Intermediário Superior'}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Seu foco semanal está no nível {focusRank}.
            </p>
          </article>
        </section>

      <DailyQuestsWidget quests={questsResult.data || []} />

      <section className="content-visibility-section space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className={softKicker}>Plano do dia</p>
            <h2 className="mt-3 font-montserrat text-2xl font-bold text-zinc-900">Atividades pendentes</h2>
          </div>
          {profile?.role === 'admin' && (
            <Link href="/admin/dashboard" transitionTypes={navForwardTransitionTypes} prefetch={false} className={softButton}>
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
                <article key={assignment.id} data-testid="assignment-card" className={`${glassTile} home-assignment-card flex min-h-[220px] flex-col p-5 transition-transform hover:-translate-y-1`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex items-center rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-emerald-800">
                      {mode.label}
                    </span>
                    {assignment.badges ? (
                      <span title={assignment.badges.name} className="text-2xl drop-shadow-sm">🏅</span>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/45 text-zinc-500 ring-1 ring-zinc-200/60">
                        <BookOpen className="h-5 w-5" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-5 font-montserrat text-lg font-bold text-zinc-900">
                    {assignment.packs?.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">
                    {assignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.'}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                      <Clock className="h-3.5 w-3.5" />
                      {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Foco diário'}
                    </div>
                    {isCompleted ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50/80 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-emerald-800">Concluído</span>
                    ) : (
                  <Link
                        href={`/play/${assignment.id}`}
                        transitionTypes={navForwardTransitionTypes}
                        prefetch={false}
                        data-testid="assignment-start-button"
                        className="inline-flex items-center justify-center rounded-[32px] bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
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
          <EmptyState
            imageSrc="/images/home/undraw-celebration.svg"
            imageAlt="Ilustração unDraw de pessoas comemorando todas as tarefas concluídas"
            title="Tudo em dia."
            description="Não há novas tarefas atribuídas agora."
            variant="default"
            className="render-contained overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 shadow-[0_24px_70px_rgba(24,32,29,0.12)] backdrop-blur-md"
            imageClassName="max-w-36"
          />
        )}
      </section>

      <section className="content-visibility-section grid gap-4 lg:grid-cols-2">
        <RankingWidget topLeaderboard={topLeaderboard} />

        <article className={`${glassPanel} p-6 sm:p-7`}>
          <DecoCheck className="absolute left-4 top-4 h-7 w-7 opacity-40" />
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-emerald-50/30" />
          <div className="flex items-center justify-between gap-3">
            <div className="relative z-10">
              <p className={softKicker}>Conquistas</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-zinc-900">Vitórias recentes</h2>
            </div>
            <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-900/10">
              <Medal className="h-5 w-5" />
            </div>
          </div>
          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2">
            {achievements.length > 0 ? (
              achievements.map((achievement) => {
                const Icon = achievement.icon
                return (
                  <div key={achievement.id} className="home-nested-card rounded-[28px] border border-zinc-200/55 bg-white/35 p-4 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-zinc-900">{achievement.label}</p>
                  </div>
                )
              })
            ) : (
              <div className="rounded-[28px] border border-zinc-200/55 bg-white/35 p-5 text-sm font-semibold text-zinc-500 shadow-[0_12px_34px_rgba(24,32,29,0.06)] sm:col-span-2">
                Complete uma revisão ou atividade para desbloquear suas próximas vitórias.
              </div>
            )}
                </div>
        </article>
      </section>

      <HomeBottomCards
        totalDue={reviewStats.totalDue}
        cardsMasteredThisWeek={cardsMasteredThisWeek}
        focusRank={focusRank}
      />

      <HomeFooter />

      </StaggeredFadeIn>
    </div>
    </div>
  )
}
