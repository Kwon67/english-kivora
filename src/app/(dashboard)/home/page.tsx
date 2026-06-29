import { DecoCheck } from '@/components/ui/DecorativeSvgs'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Medal,
  Settings,
  Zap,
} from 'lucide-react'
import CefrLevelBadge from '@/features/cefr/components/CefrLevelBadge'
import { getB2LearningPath } from '@/features/cefr/lib/b2Progress'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { getUserBlitzBest } from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
import { gameModeConfig, getGameModeOption } from '@/features/game/lib/gameModes'
import { getProblemWordsCount } from '@/features/review/lib/problemWordsSummary'
import { getReviewQueueSummaryForUser } from '@/features/review/lib/reviewQueue'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/features/review/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import { withTimeout } from '@/lib/withTimeout'
import {
  DEFAULT_DAILY_NEW_CARDS_LIMIT,
  DEFAULT_REVIEW_SESSION_CARD_LIMIT,
  type ReviewQueueSummary,
} from '@/features/review/lib/reviewQueue'
import HomeRealtime from './HomeRealtime'
import HomeNotice from './HomeNotice'
import NavWayfindingHint from '@/components/navigation/NavWayfindingHint'
import HomeFooter from './HomeFooter'
import DailyQuestsWidget from './DailyQuestsWidget'
import PacksHubCard from './PacksHubCard'
import StaggeredFadeIn from '@/components/ui/StaggeredFadeIn'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import SectionBadge from '@/components/ui/SectionBadge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const QUERY_TIMEOUT_MS = 8_000

const EMPTY_REVIEW_STATS: ReviewQueueSummary = {
  dueToday: 0,
  dueTomorrow: 0,
  newCards: 0,
  totalDue: 0,
  totalBacklogDue: 0,
  deferredDue: 0,
  totalReviews: 0,
  introducedToday: 0,
  newCardsLimit: DEFAULT_DAILY_NEW_CARDS_LIMIT,
  sessionLimit: DEFAULT_REVIEW_SESSION_CARD_LIMIT,
  dailyCardsReviewed: 0,
}

const shellClass =
  'home-mobile-optimized landing-light relative -mx-4 -my-6 min-h-0 overflow-x-hidden bg-bg-primary px-4 py-6 pb-4 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:min-h-[calc(100vh-5rem)] sm:px-6 sm:py-8 sm:pb-10'
const cardClass = 'rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)]'
const pillClass =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
const smallPillClass =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-2.5 py-1 font-heading text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark'
const loginButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-5 py-2.5 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--color-brand-accent)]'
const softButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-5 py-2.5 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white'
const cardButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white'
const metricCardClass =
  'min-w-[280px] snap-start rounded-2xl border-2 border-brand-dark bg-bg-card p-6 shadow-[5px_5px_0_var(--color-brand-dark)] md:min-w-0'

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

type HomeStreak = {
  current_streak: number | null
  longest_streak: number | null
  last_activity_date: string | null
}

type HomeQuest = {
  quest_type: string
  status: string
}

type StreakStatus = 'normal' | 'risk' | 'lost'

function getIncompleteQuestCounts(quests: HomeQuest[]) {
  const incomplete = quests.filter((quest) => quest.status !== 'completed')
  const incompleteBlitz = incomplete.filter(
    (quest) => quest.quest_type === 'blitz_session' || quest.quest_type === 'blitz_combo'
  )

  return {
    incompleteQuestCount: incomplete.length,
    incompleteBlitzQuestCount: incompleteBlitz.length,
  }
}

function getBlitzTileCopy(options: {
  streakStatus: StreakStatus
  blitzBestScore: number
  incompleteBlitzQuestCount: number
  incompleteQuestCount: number
}) {
  if (options.streakStatus === 'risk') {
    return 'Uma partida rápida mantém sua sequência.'
  }
  if (options.incompleteBlitzQuestCount > 0) {
    const count = options.incompleteBlitzQuestCount
    return `Falta${count === 1 ? '' : 'm'} ${count} missão${count === 1 ? '' : 'ões'} de Blitz hoje.`
  }
  if (options.incompleteQuestCount > 0) {
    return `Faltam ${options.incompleteQuestCount} missões diárias — o Blitz ajuda a fechar.`
  }
  if (options.blitzBestScore > 0) {
    return `Bater seu recorde: ${options.blitzBestScore} pontos.`
  }
  return 'Desafio relâmpago para manter o ritmo.'
}

function getBlitzHeroLabel(options: {
  streakStatus: StreakStatus
  incompleteBlitzQuestCount: number
  blitzBestScore: number
}) {
  if (options.streakStatus === 'risk') {
    return 'Salvar sequência'
  }
  if (options.incompleteBlitzQuestCount > 0) {
    return 'Fechar missões'
  }
  if (options.blitzBestScore > 0) {
    return 'Bater recorde'
  }
  return 'Jogar Blitz'
}

function OnboardingHome() {
  return (
    <div className={`${shellClass} min-h-[calc(100svh-5rem)] pb-8`}>
      <div className="relative z-10 space-y-6 pb-8">
        <section className="space-y-3">
          <h1 className="font-heading text-3xl font-bold leading-tight text-brand-dark sm:text-4xl">
            Bem-vindo ao Kivora English
          </h1>
          <p className="max-w-2xl font-body text-base leading-7 text-brand-secondary">
            Veja por onde começar sua jornada no inglês.
          </p>
        </section>

        <NavWayfindingHint />
        <OnboardingChecklist variant="panel" showTertiary />
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

async function fetchHomeDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  return Promise.all([
    supabase.from('profiles').select('username,role').eq('id', userId).single(),
    supabase
      .from('assignments')
      .select('id,assigned_date,status,game_mode,packs(name,description,level),badges(name,icon_name)')
      .eq('user_id', userId)
      .order('assigned_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('user_quests')
      .select('id,quest_type,target,progress,status')
      .eq('user_id', userId)
      .order('status', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('user_streaks')
      .select('current_streak,longest_streak,last_activity_date')
      .eq('user_id', userId)
      .maybeSingle(),
  ])
}

type HomeDashboardData = Awaited<ReturnType<typeof fetchHomeDashboardData>>

const HOME_DASHBOARD_FALLBACK = [
  { data: null, error: null },
  { data: [], error: null },
  { data: [], error: null },
  { data: null, error: null },
] as unknown as HomeDashboardData

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await withTimeout(
    supabase.auth.getUser(),
    QUERY_TIMEOUT_MS,
    { data: { user: null }, error: null } as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>
  )
  if (!user) redirect('/login')

  void materializeScheduledReviewReleasesForUser(user.id).catch(() => undefined)

  const [
    profileResult,
    assignmentsResult,
    questsResult,
    streakResult,
  ] = await withTimeout(
    fetchHomeDashboardData(supabase, user.id),
    QUERY_TIMEOUT_MS,
    HOME_DASHBOARD_FALLBACK
  )

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
        ? `${streak} ${streak === 1 ? 'dia' : 'dias'} — Estude hoje!`
        : 'Sequência zerada'
  const streakDescription =
    streakStatus === 'normal'
      ? 'Continue hoje para não perder!'
      : streakStatus === 'risk'
        ? 'Estude pelo menos 1 card para manter sua sequência.'
        : 'Comece uma nova sequência hoje.'
  const [reviewStats, problemWordsCount, blitzBest, cefrProfile, b2Path] = await Promise.all([
    withTimeout(getReviewStats(user.id, supabase), QUERY_TIMEOUT_MS, EMPTY_REVIEW_STATS).catch(
      () => EMPTY_REVIEW_STATS
    ),
    withTimeout(getProblemWordsCount(supabase, user.id), QUERY_TIMEOUT_MS, 0).catch(() => 0),
    withTimeout(getUserBlitzBest(supabase, user.id), QUERY_TIMEOUT_MS, null).catch(() => null),
    withTimeout(getUserCefrProfile(supabase, user.id, user.user_metadata), QUERY_TIMEOUT_MS, {
      level: null,
      levelName: 'Em avaliação',
      confidence: 0,
      totalInteractions: 0,
      assessing: true,
      nextLevel: 'A1' as const,
      progressToNext: 0,
      source: 'auto' as const,
    }).catch(() => ({
      level: null,
      levelName: 'Em avaliação',
      confidence: 0,
      totalInteractions: 0,
      assessing: true,
      nextLevel: 'A1' as const,
      progressToNext: 0,
      source: 'auto' as const,
    })),
    withTimeout(getB2LearningPath(supabase, user.id), QUERY_TIMEOUT_MS, {
      completedByLevel: { A1: 0, A2: 0, B1: 0, B2: 0 },
      totalPublicByLevel: { A1: 0, A2: 0, B1: 0, B2: 0 },
      b2Completed: 0,
      b2Total: 1,
      b2Percent: 0,
      nextMilestone: 'Explore packs B2 para avançar na trilha.',
    }).catch(() => ({
      completedByLevel: { A1: 0, A2: 0, B1: 0, B2: 0 },
      totalPublicByLevel: { A1: 0, A2: 0, B1: 0, B2: 0 },
      b2Completed: 0,
      b2Total: 1,
      b2Percent: 0,
      nextMilestone: 'Explore packs B2 para avançar na trilha.',
    })),
  ])
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
  const completedReviewsToday = reviewStats.dailyCardsReviewed
  const totalReviewWork = completedReviewsToday + reviewStats.totalDue
  const totalDailyWork = totalAssignments + totalReviewWork
  const completedDailyWork = completedCount + completedReviewsToday
  const doneCount = completedDailyWork
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
  const quests = (questsResult.data as HomeQuest[] | null) || []
  const { incompleteQuestCount, incompleteBlitzQuestCount } = getIncompleteQuestCounts(quests)
  const blitzBestScore = blitzBest?.bestScore ?? 0
  const showBlitzCta =
    completionRate === 100 || streakStatus === 'risk' || incompleteBlitzQuestCount > 0
  const blitzTileCopy = getBlitzTileCopy({
    streakStatus,
    blitzBestScore,
    incompleteBlitzQuestCount,
    incompleteQuestCount,
  })
  const blitzHeroLabel = getBlitzHeroLabel({
    streakStatus,
    incompleteBlitzQuestCount,
    blitzBestScore,
  })
  const blitzPrimaryAction =
    streakStatus === 'risk' && !hasPendingReviews
      ? {
        href: '/blitz/play',
        label: 'Jogar Blitz agora',
        title: 'Sua sequência está em risco.',
        description:
          'Uma partida rápida de Blitz conta como atividade de hoje e mantém sua sequência.',
        icon: Zap,
      }
      : null
  const primaryAction = blitzPrimaryAction
    ?? (hasPendingReviews
      ? {
        href: '/review',
        label: 'Revisar agora',
        title: 'Sua revisão curta está pronta.',
        description: `Até ${reviewStats.totalDue} frase${reviewStats.totalDue === 1 ? '' : 's'} para manter o inglês em dia.`,
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
        : showBlitzCta
          ? {
            href: '/blitz/play',
            label: 'Jogar Blitz',
            title:
              blitzBestScore > 0
                ? `Bater seu recorde de ${blitzBestScore} pontos.`
                : 'Desafio relâmpago para manter o ritmo.',
            description:
              incompleteBlitzQuestCount > 0
                ? `Falta${incompleteBlitzQuestCount === 1 ? '' : 'm'} ${incompleteBlitzQuestCount} missão${incompleteBlitzQuestCount === 1 ? '' : 'ões'} de Blitz para fechar o dia.`
                : 'Tudo em dia por agora. Uma partida rápida ajuda a manter o ritmo e subir no ranking.',
            icon: Zap,
          }
          : {
            href: '/history',
            label: 'Ver histórico',
            title: 'Tudo em dia por agora.',
            description: 'Seu plano do dia está concluído. Use esse momento para acompanhar sua evolução ou explorar novos conteúdos.',
            icon: CheckCircle2,
          })
  const PrimaryActionIcon = primaryAction.icon
  const heroKicker = blitzPrimaryAction
    ? 'Sequência em risco'
    : hasPendingReviews
      ? 'Revisão curta'
      : nextAssignment
        ? 'Próxima lição'
        : showBlitzCta
          ? 'Blitz do dia'
          : 'Tudo em dia'

  return (
    <div className={shellClass}>
      <div className="relative z-10 space-y-6 pb-8">
        <HomeRealtime />
        <Suspense fallback={null}>
          <HomeNotice />
        </Suspense>

        <NavWayfindingHint />

        <StaggeredFadeIn className="relative z-10 space-y-6" animateOnMount>
          <section className={`${cardClass} p-6 sm:p-8`}>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.62fr] lg:items-center">
              <div className="relative z-10">
                <div className="inline-flex rounded-xl border-2 border-brand-dark bg-brand-accent p-2 text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
                  <PrimaryActionIcon className="h-6 w-6" strokeWidth={2} />
                </div>
                <SectionBadge label={heroKicker} className="mt-5" />
                {(reviewStats.totalDue > 0 || pendingCount > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reviewStats.totalDue > 0 ? (
                      <Link
                        href="/review"
                        transitionTypes={navForwardTransitionTypes}
                        prefetch={false}
                        className={smallPillClass}
                      >
                        {reviewStats.totalDue} frase{reviewStats.totalDue === 1 ? '' : 's'} hoje
                      </Link>
                    ) : null}
                    {pendingCount > 0 ? (
                      <Link
                        href="/study"
                        transitionTypes={navForwardTransitionTypes}
                        prefetch={false}
                        className={smallPillClass}
                      >
                        {pendingCount} lição{pendingCount === 1 ? '' : 'ões'} pendente{pendingCount === 1 ? '' : 's'}
                      </Link>
                    ) : null}
                  </div>
                )}
                <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-tight text-brand-dark sm:text-4xl">
                  {primaryAction.title}
                </h1>
                <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
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
                  ) : showBlitzCta ? (
                    <Link href="/blitz/play" transitionTypes={navForwardTransitionTypes} prefetch={false} className={softButton}>
                      <Zap className="h-4 w-4" />
                      {blitzHeroLabel}
                    </Link>
                  ) : (
                    <Link href="/explore" transitionTypes={navForwardTransitionTypes} prefetch={false} className={softButton}>
                      <BookOpen className="h-4 w-4" />
                      Explorar
                    </Link>
                  )}
                </div>
              </div>

              <div className="home-hero-visual relative z-10 mx-auto w-full max-w-[20rem] overflow-hidden rounded-xl border-2 border-brand-dark bg-brand-dark p-5 text-white shadow-[5px_5px_0_var(--color-brand-accent)]">
                <div className="flex items-center justify-between border-b border-white/15 pb-3 font-heading text-xs font-bold uppercase tracking-widest text-brand-accent">
                  <span>Resumo do dia</span>
                  <span>{completionRate}%</span>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {[reviewStats.totalDue, pendingCount, doneCount].map((value, index) => (
                      <div key={index} className="rounded-lg border border-white/15 bg-white/10 p-3">
                        <div className="font-body text-xs font-semibold uppercase tracking-widest text-white/60">
                          {index === 0 ? 'Revisar' : index === 1 ? 'Pendentes' : 'Concluídos'}
                        </div>
                        <div className="mt-1 font-heading text-xl font-bold text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between font-heading text-xs font-bold uppercase tracking-widest text-white/70">
                      <span>Carga de estudo</span>
                      <span>{completedDailyWork}/{totalDailyWork}</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-brand-accent transition-all duration-500"
                        style={{ width: `${Math.max(12, Math.min(100, completionRate))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
            <article className={`${metricCardClass} flex h-full flex-col`}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className={pillClass}>Sequência</p>
                  <p className="mt-4 font-heading text-3xl font-bold leading-tight text-brand-dark">
                    {streakTitle}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark"
                >
                  {streakStatus === 'risk' ? (
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.4} />
                  ) : (
                    <Flame className="h-5 w-5" strokeWidth={2.4} />
                  )}
                </div>
              </div>
              <p className="mt-3 font-body text-sm text-brand-secondary">{streakDescription}</p>
              <p className="mt-1 font-body text-sm font-semibold text-brand-secondary">Recorde: {longestStreak} dias</p>
              <div className="mt-auto pt-5">
                <Link
                  href="/study"
                  className={cardButton}
                >
                  Estudar agora
                </Link>
              </div>
            </article>

            <article className={`${metricCardClass} flex h-full flex-col`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={pillClass}>Meta diária</p>
                  <p className="mt-4 font-heading text-3xl font-bold text-brand-dark">{completionRate}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark">
                  <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-brand-border">
                <div
                  className="h-full rounded-full bg-brand-dark transition-all duration-500"
                  style={{ width: `${Math.max(12, Math.min(100, completionRate))}%` }}
                />
              </div>
              <p className="mt-3 font-body text-sm text-brand-secondary">
                {completedDailyWork} de {totalDailyWork} tarefas do dia concluídas.
              </p>
              <div className="mt-auto pt-5">
                <Link
                  href="/study"
                  className={cardButton}
                >
                  Ver tarefas
                </Link>
              </div>
            </article>

            <article className={`${metricCardClass} flex h-full flex-col`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={pillClass}>Nível detectado</p>
                  <div className="mt-4">
                    <CefrLevelBadge profile={cefrProfile} compact />
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark">
                  <Medal className="h-5 w-5" strokeWidth={2.4} />
                </div>
              </div>
              <p className="mt-3 font-body text-sm text-brand-secondary">
                {cefrProfile.assessing
                  ? 'O app avalia seu desempenho a cada revisão e lição.'
                  : cefrProfile.nextLevel
                    ? `Próximo marco: ${cefrProfile.nextLevel} (${cefrProfile.progressToNext ?? 0}%)`
                    : 'Excelência B2 detectada no escopo atual.'}
              </p>
              {showBlitzCta ? (
                <div className="mt-auto pt-5">
                  <Link
                    href="/blitz/play"
                    transitionTypes={navForwardTransitionTypes}
                    prefetch={false}
                    className={cardButton}
                  >
                    <Zap className="h-4 w-4" />
                    {blitzHeroLabel}
                  </Link>
                  <p className="mt-2 font-body text-xs text-brand-secondary">{blitzTileCopy}</p>
                </div>
              ) : null}
            </article>
          </section>

          {/* Today's Plan promoted early (core daily action per modern dashboard patterns) */}
          <section className="content-visibility-section space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <SectionBadge label="Plano do dia" />
                <h2 className="mt-3 font-heading text-2xl font-bold text-brand-dark">Atividades pendentes</h2>
                {assignments.length > 3 ? (
                  <Link
                    href="/study"
                    transitionTypes={navForwardTransitionTypes}
                    prefetch={false}
                    className="mt-2 inline-flex font-body text-sm font-semibold text-brand-dark underline underline-offset-4"
                  >
                    Ver todas ({assignments.length})
                  </Link>
                ) : null}
              </div>
              {profile?.role === 'admin' && (
                <Link href="/admin/dashboard" transitionTypes={navForwardTransitionTypes} prefetch={false} className={cardButton}>
                  <Settings className="h-4 w-4" />
                  Painel
                </Link>
              )}
            </div>

            {assignments.length > 0 ? (
              <StaggeredFadeIn className="grid gap-4" animateOnMount>
                {assignments.slice(0, 3).map((assignment) => {
                  const statusMeta = parseAssignmentStatus(assignment.status)
                  const mode = gameModeConfig[getGameModeOption(assignment.game_mode).id] || gameModeConfig.multiple_choice
                  const isCompleted = isAssignmentCompleted(assignment.status)

                  return (
                    <article
                      key={assignment.id}
                      data-testid="assignment-card"
                      className="home-assignment-card flex cursor-pointer flex-col gap-4 rounded-xl border-2 border-brand-dark bg-bg-card p-4 shadow-[4px_4px_0_var(--color-brand-dark)] transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark">
                          {assignment.badges ? (
                            <span title={assignment.badges.name} className="text-xl">🏅</span>
                          ) : (
                            <BookOpen className="h-5 w-5" strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className={smallPillClass}>{mode.label}</span>
                          <h3 className="mt-3 font-heading text-lg font-bold text-brand-dark">
                            {assignment.packs?.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 font-body text-sm leading-relaxed text-brand-secondary">
                            {assignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.'}
                          </p>
                          <div className="mt-3 flex items-center gap-2 font-body text-xs font-semibold text-brand-secondary">
                            <Clock className="h-3.5 w-3.5" />
                            {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Foco diário'}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isCompleted ? (
                          <span className={smallPillClass}>Concluído</span>
                        ) : (
                          <Link
                            href={`/play/${assignment.id}`}
                            transitionTypes={navForwardTransitionTypes}
                            prefetch={false}
                            data-testid="assignment-start-button"
                            className={loginButton}
                          >
                            Começar
                          </Link>
                        )}
                      </div>
                    </article>
                  )
                })}
              </StaggeredFadeIn>
            ) : (
              <OnboardingChecklist variant="tile" secondaryHref="/study" secondaryLabel="Montar minha rotina" />
            )}
          </section>

          <DailyQuestsWidget quests={questsResult.data || []} />
        </StaggeredFadeIn>

        {/* Progress & Insights grouped here (after daily focus) */}
        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="min-w-0">
            <SectionBadge label="Caminho para B2" />
            <p className="mt-3 font-heading text-lg font-bold text-brand-dark">
              {b2Path.b2Completed} de {b2Path.b2Total} packs B2 concluídos
            </p>
            <p className="mt-2 font-body text-sm text-brand-secondary">{b2Path.nextMilestone}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-border">
                <div
                  className="h-full rounded-full bg-brand-dark transition-all duration-500"
                  style={{ width: `${Math.max(8, Math.min(100, b2Path.b2Percent))}%` }}
                />
              </div>
              <p className="shrink-0 font-heading text-sm font-bold text-brand-secondary">{b2Path.b2Percent}%</p>
            </div>
          </div>
        </section>

        {problemWordsCount > 0 ? (
          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <SectionBadge label="Dificuldades" />
                <p className="mt-3 font-heading text-lg font-bold text-brand-dark">
                  {problemWordsCount} termo{problemWordsCount === 1 ? '' : 's'} para revisar
                </p>
                <p className="mt-2 font-body text-sm text-brand-secondary">
                  Cards que você errou recentemente — vale uma sessão focada.
                </p>
              </div>
              <Link
                href="/problem-words"
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className={softButton}
              >
                <Brain className="h-4 w-4" />
                Ver dificuldades
              </Link>
            </div>
          </section>
        ) : null}

        <PacksHubCard isEmptyRoutine={assignments.length === 0} />

        <StaggeredFadeIn
          className="relative z-10 space-y-6"
          staggerDelay={0.05}
          maxItemDelay={0.08}
          animateOnMount
        >
          <section>
            <article className={`${cardClass} relative flex h-full flex-col p-6 sm:p-8`}>
              <DecoCheck className="absolute left-4 top-4 h-7 w-7 opacity-25" />
              <div className="flex items-center justify-between gap-3">
                <div className="relative z-10">
                  <SectionBadge label="Conquistas" />
                  <h2 className="mt-3 font-heading text-2xl font-bold text-brand-dark">Vitórias recentes</h2>
                </div>
                <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
                  <Medal className="h-5 w-5" />
                </div>
              </div>
              <div className="relative z-10 mt-6 grid flex-1 gap-3 sm:grid-cols-2">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon
                  return (
                    <div key={achievement.id} className="home-nested-card overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-card p-5 shadow-[4px_4px_0_var(--color-brand-dark)]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <p className="mt-3 font-body text-sm font-semibold text-brand-dark">{achievement.label}</p>
                    </div>
                  )
                })}
                {achievements.length < 4 && (
                  <div className="flex items-center justify-center rounded-xl border-2 border-brand-dark bg-bg-card px-4 py-4 text-center font-body text-sm text-brand-secondary shadow-[4px_4px_0_var(--color-brand-dark)] sm:col-span-2">
                    Continue praticando para desbloquear novas conquistas.
                  </div>
                )}
              </div>
            </article>
          </section>

        </StaggeredFadeIn>

        <HomeFooter />
      </div>
    </div>
  )
}
