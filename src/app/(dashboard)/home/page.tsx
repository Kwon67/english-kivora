import { DecoCheck } from '@/components/ui/DecorativeSvgs'
import Link from 'next/link'
import {
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  Medal,
  Mic,
  Settings,
  Sparkles,
} from 'lucide-react'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
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

type HomeRecentReview = {
  card_id: string
  quality: number
  review_date: string
  total_reviews: number
}

type HomeStreak = {
  current_streak: number | null
  longest_streak: number | null
  last_activity_date: string | null
}

function OnboardingHome() {
  const actionCards = [
    {
      title: 'Explorar packs',
      description: 'Navegue pelos packs de vocabulário já criados e adicione os que combinam com seu nível.',
      href: '/explore',
      label: 'Ver packs disponíveis',
      icon: BookOpen,
    },
    {
      title: 'Criar pack com IA',
      description: 'Use o Gerador IA para criar seu próprio pack de vocabulário personalizado em segundos.',
      href: '/generate',
      label: 'Abrir Gerador IA',
      icon: Sparkles,
    },
  ]

  return (
    <div className="space-y-10 pb-8">
      <HomeRealtime />

      <section className="space-y-3">
        <h1 className="font-montserrat text-3xl font-bold leading-tight text-zinc-950 sm:text-4xl">
          Bem-vindo ao Kivora English 👋
        </h1>
        <p className="max-w-2xl font-inter text-base leading-7 text-zinc-600">
          Veja por onde começar sua jornada no inglês.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {actionCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.title}
              className="flex min-h-[260px] flex-col rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-sm"
            >
              <Icon className="h-8 w-8 text-emerald-800" strokeWidth={2.2} />
              <h2 className="mt-5 font-montserrat text-lg font-bold text-zinc-950">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{card.description}</p>
              <Link
                href={card.href}
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-emerald-800 transition-colors hover:text-emerald-700"
              >
                {card.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          )
        })}

        <article className="flex min-h-[260px] flex-col rounded-xl border border-zinc-200 bg-gray-50 p-6 transition-shadow hover:shadow-sm">
          <GraduationCap className="h-8 w-8 text-emerald-800" strokeWidth={2.2} />
          <h2 className="mt-5 font-montserrat text-lg font-bold text-zinc-950">Tutor vai atribuir tarefas</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Seu tutor pode atribuir packs e tarefas diretamente para você. Volte aqui depois da primeira atribuição.
          </p>
        </article>
      </section>

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center">
        <span>Quer praticar enquanto isso?</span>
        <Link
          href="/tutor"
          transitionTypes={navForwardTransitionTypes}
          prefetch={false}
          className="inline-flex items-center gap-2 font-bold text-emerald-800 transition-colors hover:text-emerald-700"
        >
          <Mic className="h-4 w-4" />
          Iniciar conversa com o Tutor de Voz IA
        </Link>
      </section>
    </div>
  )
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
    recentReviewsResult,
    topLeaderboard,
    questsResult,
    streakResult,
  ] = await Promise.all([
    supabase.from('profiles').select('username,role').eq('id', user.id).single(),
    supabase
      .from('assignments')
      .select('id,assigned_date,status,game_mode,packs(name,description,level),badges(name,icon_name)')
      .eq('user_id', user.id)
      .order('assigned_date', { ascending: true })
      .order('created_at', { ascending: true }),
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
    supabase
      .from('user_streaks')
      .select('current_streak,longest_streak,last_activity_date')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  await materializePromise

  const profile = profileResult.data
  const today = getAppDateString()
  const allAssignments = (assignmentsResult.data as HomeAssignment[] | null) || []
  const allPlayableAssignments = allAssignments.filter((assignment) =>
    isPlayableAssignmentGameMode(assignment.game_mode)
  )
  const assignments = allPlayableAssignments.filter((assignment) => {
    const status = parseAssignmentStatus(assignment.status)
    return assignment.assigned_date >= today || status.baseStatus !== 'completed'
  })
  const recentReviews = (recentReviewsResult.data as HomeRecentReview[] | null) || []

  const assignmentStreak = calculateStreak(allPlayableAssignments, today).streak
  const streakRow = streakResult.data as HomeStreak | null
  const yesterday = shiftAppDate(today, -1)
  const streakStatus =
    streakRow?.last_activity_date === today
      ? 'normal'
      : streakRow?.last_activity_date === yesterday && (streakRow.current_streak ?? 0) > 0
        ? 'risk'
        : 'lost'
  const streak = streakStatus === 'lost' ? 0 : streakRow?.current_streak ?? 0
  const longestStreak = streakRow?.longest_streak ?? Math.max(streak, assignmentStreak)
  const streakTitle =
    streakStatus === 'normal'
      ? `🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'}`
      : streakStatus === 'risk'
        ? `⚠️ ${streak} ${streak === 1 ? 'dia' : 'dias'} — Estude hoje!`
        : 'Sequência zerada'
  const streakDescription =
    streakStatus === 'normal'
      ? 'Continue hoje para não perder!'
      : streakStatus === 'risk'
        ? 'Estude pelo menos 1 card para manter sua sequência.'
        : 'Comece uma nova sequência hoje.'
  const reviewStats = await getReviewStats(user.id, supabase)
  const hasAssignedPack = allAssignments.some((assignment) => Boolean(assignment.packs))
  const hasCompletedReviewSession = reviewStats.totalReviews > 0
  const isNewUser = !hasAssignedPack && !hasCompletedReviewSession

  if (isNewUser) {
    return <OnboardingHome />
  }

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

            <div className="home-hero-visual relative z-10 mx-auto flex w-full max-w-sm items-center justify-center overflow-hidden rounded-[32px] border border-zinc-200/45 bg-white/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-sm">
              <HomeHeroIllustration className="h-auto w-full max-w-[18rem] sm:max-w-[20rem]" />
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <article className={`${glassTile} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className={softKicker}>Sequência</p>
                <p className="mt-3 font-montserrat text-2xl font-bold leading-tight text-zinc-900">
                  {streakTitle}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  streakStatus === 'risk'
                    ? 'animate-pulse bg-amber-50/80 text-amber-700'
                    : streakStatus === 'lost'
                      ? 'bg-zinc-100/80 text-zinc-500'
                      : 'bg-emerald-50/75 text-emerald-800'
                }`}
              >
                {streakStatus === 'risk' ? (
                  <AlertTriangle className="h-5 w-5" strokeWidth={2.4} />
                ) : (
                  <Flame className="h-5 w-5" strokeWidth={2.4} />
                )}
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-500">{streakDescription}</p>
            <p className="mt-1 text-xs font-bold text-zinc-500">Recorde: {longestStreak} dias</p>
          </article>

          <article className={`${glassTile} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={softKicker}>Meta diária</p>
                <p className="mt-3 font-montserrat text-3xl font-bold text-zinc-900">{completionRate}%</p>
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

          <article className={`${glassTile} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={softKicker}>Nível atual</p>
                <p className="mt-3 font-montserrat text-3xl font-bold text-emerald-800">
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
          <div className="render-contained flex h-20 max-h-20 items-center gap-3 rounded-[24px] border border-zinc-200/55 bg-white/45 px-5 text-sm font-semibold text-zinc-500 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-900/10">
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span>Tudo em dia. Nenhuma atividade pendente.</span>
          </div>
        )}
      </section>

      <section className="content-visibility-section grid items-stretch gap-4 lg:grid-cols-2">
        <RankingWidget topLeaderboard={topLeaderboard} />

        <article className={`${glassPanel} flex h-full flex-col p-6`}>
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
          <div className="relative z-10 mt-6 grid flex-1 gap-3 sm:grid-cols-2">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div key={achievement.id} className="home-nested-card overflow-hidden rounded-[28px] border border-zinc-200/55 bg-white/35 p-4 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-zinc-900">{achievement.label}</p>
                </div>
              )
            })}
            {achievements.length < 4 && (
              <div className="flex min-h-[120px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-zinc-200/55 bg-white/35 p-5 text-center text-sm font-semibold text-zinc-500 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm sm:col-span-2">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-900/10">
                  <Medal className="h-5 w-5" strokeWidth={2.3} />
                </div>
                Continue praticando para desbloquear novas conquistas.
              </div>
            )}
          </div>
        </article>
      </section>

      </StaggeredFadeIn>
    </div>
    </div>
  )
}
