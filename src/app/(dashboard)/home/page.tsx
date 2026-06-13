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
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'
const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]'
const loginButton =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#183b16] px-5 py-3.5 font-montserrat text-sm font-bold text-[#f7f8ef] shadow-[0_10px_22px_rgba(24,59,22,0.22)] transition-colors hover:bg-[#24551d] focus:outline-none focus:ring-2 focus:ring-[#183b16]/40 dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]'
const softButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#172113]/20 bg-[#eef3d6] px-5 py-3.5 text-sm font-bold text-[#183b16] shadow-sm transition-colors hover:bg-[#dfe9bd] dark:border-[#d5e6a9]/20 dark:bg-[#b8ff5c]/8 dark:text-[#b8ff5c] dark:hover:bg-[#b8ff5c]/16'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]'

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
    <div className="home-mobile-optimized relative -mx-4 -my-6 min-h-[calc(100svh-5rem)] overflow-hidden bg-[#f4f5e8] px-4 py-6 pb-8 text-[#10130f] sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#050704] dark:text-[#f4f7e9]">
      <div className="home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_38%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.72)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(184,255,92,0.16),transparent_34%),linear-gradient(135deg,rgba(24,59,22,0.36),transparent_64%)]" />

      <div className="relative z-10 space-y-10 rounded-[28px] border border-[#172113]/25 bg-[#f7f8ef] p-4 shadow-[0_24px_70px_rgba(18,21,12,0.24)] sm:p-6 dark:border-[#d5e6a9]/18 dark:bg-[#080b06]">
      <section className="space-y-3">
        <h1 className="font-montserrat text-3xl font-bold leading-tight text-[#10130f] dark:text-[#f4f7e9] sm:text-4xl">
          Bem-vindo ao Kivora English 👋
        </h1>
        <p className="max-w-2xl font-inter text-base leading-7 text-[#425039] dark:text-[#b9c3a4]">
          Veja por onde começar sua jornada no inglês.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {actionCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.title}
              className={`${glassTile} flex min-h-[260px] flex-col p-6 transition-transform hover:-translate-y-0.5`}
            >
              <Icon className="h-8 w-8 text-[#183b16] dark:text-[#b8ff5c]" strokeWidth={1.9} />
              <h2 className="mt-5 font-montserrat text-lg font-bold text-[#10130f] dark:text-[#f4f7e9]">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#425039] dark:text-[#b9c3a4]">{card.description}</p>
              <Link
                href={card.href}
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-[#183b16] transition-colors hover:text-[#24551d] dark:text-[#b8ff5c] dark:hover:text-[#cbff83]"
              >
                {card.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          )
        })}

        <article className={`${glassTile} flex min-h-[260px] flex-col bg-[#eef3d6] p-6 transition-transform hover:-translate-y-0.5 dark:bg-[#11160e]`}>
          <GraduationCap className="h-8 w-8 text-[#183b16] dark:text-[#b8ff5c]" strokeWidth={1.9} />
          <h2 className="mt-5 font-montserrat text-lg font-bold text-[#10130f] dark:text-[#f4f7e9]">Tutor vai atribuir tarefas</h2>
          <p className="mt-3 text-sm leading-6 text-[#425039] dark:text-[#b9c3a4]">
            Seu tutor pode atribuir packs e tarefas diretamente para você. Volte aqui depois da primeira atribuição.
          </p>
        </article>
      </section>

      <section className="flex flex-col gap-3 border-t border-dashed border-[#172113]/24 pt-6 text-sm text-[#5a664e] sm:flex-row sm:items-center dark:border-[#d5e6a9]/20 dark:text-[#9ea98b]">
        <span>Quer praticar enquanto isso?</span>
        <Link
          href="/tutor"
          transitionTypes={navForwardTransitionTypes}
          prefetch={false}
          className="inline-flex items-center gap-2 font-bold text-[#183b16] transition-colors hover:text-[#24551d] dark:text-[#b8ff5c] dark:hover:text-[#cbff83]"
        >
          <Mic className="h-4 w-4" />
          Iniciar conversa com o Tutor de Voz IA
        </Link>
      </section>
      </div>
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
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-hidden bg-[#f4f5e8] px-4 py-6 pb-10 text-[#10130f] sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#050704] dark:text-[#f4f7e9]">
      <div className="home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[30rem] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)]" />

    <div className="relative z-10 space-y-6 pb-8">
      <HomeRealtime />

      <StaggeredFadeIn className="relative z-10 space-y-6">
        <section className={`${glassPanel} p-5 sm:p-7`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.75),rgba(251,252,242,0.18)_42%,transparent)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.10),rgba(17,22,14,0)_48%)]" />
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.62fr] lg:items-center">
            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#172113]/18 bg-[#e3ecc2] text-[#183b16] shadow-sm dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
                <PrimaryActionIcon className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className={`${softKicker} mt-5`}>Revisão diária</p>
              <h1 className="mt-4 max-w-2xl font-montserrat text-3xl font-bold leading-tight text-[#10130f] sm:text-4xl dark:text-[#f4f7e9]">
                {primaryAction.title}
              </h1>
              <p className="mt-4 max-w-2xl font-inter text-sm leading-relaxed text-[#425039] sm:text-base dark:text-[#b9c3a4]">
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

            <div className="home-hero-visual relative z-10 mx-auto w-full max-w-[20rem] overflow-hidden rounded-[22px] border border-[#172113]/22 bg-[#183b16] p-4 text-[#f7f8ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:border-[#d5e6a9]/20 dark:bg-[#0b1308]">
              <div className="flex items-center justify-between border-b border-[#f7f8ef]/16 pb-3 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#dfe9bd] dark:text-[#b8ff5c]">
                <span>Daily overview</span>
                <span>{completionRate}%</span>
              </div>
              <div className="mt-4 grid grid-cols-[0.82fr_1.18fr] gap-3">
                <div className="space-y-2.5">
                  {[reviewStats.totalDue, pendingCount, completedCount].map((value, index) => (
                    <div key={index} className="rounded-2xl border border-[#f7f8ef]/12 bg-[#f7f8ef]/8 p-2.5">
                      <div className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#dfe9bd]/80">
                        {index === 0 ? 'Review' : index === 1 ? 'Pending' : 'Done'}
                      </div>
                      <div className="mt-1 font-montserrat text-xl font-bold">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-[#f7f8ef]/12 bg-[#dfe9bd] p-3 text-[#183b16] dark:bg-[#b8ff5c] dark:text-[#050704]">
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 25 }).map((_, index) => {
                      const active = index < Math.round((completionRate / 100) * 25)
                      return (
                        <span
                          key={index}
                          className={`aspect-square rounded-[4px] ${active ? 'bg-[#183b16] dark:bg-[#b8ff5c]' : 'bg-[#183b16]/14 dark:bg-[#b8ff5c]/16'}`}
                        />
                      )
                    })}
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#183b16]/14">
                    <div
                      className="h-full rounded-full bg-[#183b16] transition-all duration-500 dark:bg-[#b8ff5c]"
                      style={{ width: `${Math.max(12, Math.min(100, completionRate))}%` }}
                    />
                  </div>
                  <p className="mt-4 text-[0.62rem] font-black uppercase tracking-[0.12em]">
                    Study load
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <article className={`${glassTile} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className={softKicker}>Sequência</p>
                <p className="mt-3 font-montserrat text-2xl font-bold leading-tight text-[#10130f] dark:text-[#f4f7e9]">
                  {streakTitle}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  streakStatus === 'risk'
                    ? 'animate-pulse bg-[#f4d36b]/35 text-[#6d4a00] dark:bg-[#f4d36b]/18 dark:text-[#ffd86a]'
                    : streakStatus === 'lost'
                      ? 'bg-[#e6e8dc] text-[#68715e] dark:bg-[#1a1f16] dark:text-[#879378]'
                      : 'bg-[#e3ecc2] text-[#183b16] dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]'
                }`}
              >
                {streakStatus === 'risk' ? (
                  <AlertTriangle className="h-5 w-5" strokeWidth={2.4} />
                ) : (
                  <Flame className="h-5 w-5" strokeWidth={2.4} />
                )}
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#5a664e] dark:text-[#9ea98b]">{streakDescription}</p>
            <p className="mt-1 text-xs font-bold text-[#5a664e] dark:text-[#9ea98b]">Recorde: {longestStreak} dias</p>
          </article>

          <article className={`${glassTile} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={softKicker}>Meta diária</p>
                <p className="mt-3 font-montserrat text-3xl font-bold text-[#10130f] dark:text-[#f4f7e9]">{completionRate}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
                <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full border border-[#172113]/18 bg-[#eef3d6] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/8">
              <div
                className="h-full rounded-full bg-[#183b16] transition-all duration-500 dark:bg-[#b8ff5c]"
                style={{ width: `${Math.max(12, Math.min(100, completionRate))}%` }}
              />
            </div>
            <p className="mt-3 text-xs font-semibold text-[#5a664e] dark:text-[#9ea98b]">
              {completedDailyWork} de {totalDailyWork} tarefas do dia concluídas.
            </p>
          </article>

          <article className={`${glassTile} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={softKicker}>Nível atual</p>
                <p className="mt-3 font-montserrat text-3xl font-bold text-[#183b16] dark:text-[#b8ff5c]">
                  {user.user_metadata?.english_level || 'B2'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
                <Medal className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-[#425039] dark:text-[#b9c3a4]">
              {user.user_metadata?.english_level_name || 'Intermediário Superior'}
            </p>
          </article>
        </section>

      <DailyQuestsWidget quests={questsResult.data || []} />

      <section className="content-visibility-section space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className={softKicker}>Plano do dia</p>
            <h2 className="mt-3 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">Atividades pendentes</h2>
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
                    <span className="inline-flex items-center rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
                      {mode.label}
                    </span>
                    {assignment.badges ? (
                      <span title={assignment.badges.name} className="text-2xl drop-shadow-sm">🏅</span>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3d6] text-[#5a664e] ring-1 ring-[#172113]/18 dark:bg-[#b8ff5c]/8 dark:text-[#9ea98b] dark:ring-[#d5e6a9]/18">
                        <BookOpen className="h-5 w-5" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-5 font-montserrat text-lg font-bold text-[#10130f] dark:text-[#f4f7e9]">
                    {assignment.packs?.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
                    {assignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.'}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#5a664e] dark:text-[#9ea98b]">
                      <Clock className="h-3.5 w-3.5" />
                      {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Foco diário'}
                    </div>
                    {isCompleted ? (
                      <span className="inline-flex items-center rounded-full bg-[#e3ecc2] px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-[#183b16] dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">Concluído</span>
                    ) : (
                  <Link
                        href={`/play/${assignment.id}`}
                        transitionTypes={navForwardTransitionTypes}
                        prefetch={false}
                        data-testid="assignment-start-button"
                        className="inline-flex items-center justify-center rounded-full bg-[#183b16] px-4 py-2 text-xs font-bold text-[#f7f8ef] shadow-sm transition-colors hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]"
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
          <div className="render-contained flex h-20 max-h-20 items-center gap-3 rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] px-5 text-sm font-semibold text-[#5a664e] shadow-[0_12px_34px_rgba(31,43,18,0.08)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:text-[#9ea98b]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] ring-1 ring-[#172113]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c] dark:ring-[#d5e6a9]/18">
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span>Tudo em dia. Nenhuma atividade pendente.</span>
          </div>
        )}
      </section>

      <section className="content-visibility-section grid items-stretch gap-4 lg:grid-cols-2">
        <RankingWidget topLeaderboard={topLeaderboard} />

        <article className={`${glassPanel} flex h-full flex-col p-6`}>
          <DecoCheck className="absolute left-4 top-4 h-7 w-7 opacity-25" />
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
          <div className="flex items-center justify-between gap-3">
            <div className="relative z-10">
              <p className={softKicker}>Conquistas</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">Vitórias recentes</h2>
            </div>
            <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] ring-1 ring-[#172113]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c] dark:ring-[#d5e6a9]/18">
              <Medal className="h-5 w-5" />
            </div>
          </div>
          <div className="relative z-10 mt-6 grid flex-1 gap-3 sm:grid-cols-2">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div key={achievement.id} className="home-nested-card overflow-hidden rounded-[18px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] p-4 shadow-[0_12px_30px_rgba(31,43,18,0.08)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">{achievement.label}</p>
                </div>
              )
            })}
            {achievements.length < 4 && (
              <div className="flex min-h-[120px] flex-col items-center justify-center overflow-hidden rounded-[18px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] p-5 text-center text-sm font-semibold text-[#5a664e] shadow-[0_12px_30px_rgba(31,43,18,0.08)] sm:col-span-2 dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:text-[#9ea98b]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] ring-1 ring-[#172113]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c] dark:ring-[#d5e6a9]/18">
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
