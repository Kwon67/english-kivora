import { DecoCheck } from '@/components/ui/DecorativeSvgs'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  Brain,
  ChevronDown,
  CheckCircle2,
  Clock,
  Medal,
  Settings,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { getPackReviewLabel } from '@/features/cefr/lib/cefrLevels'
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
import { logger } from '@/lib/logger'
import {
  DEFAULT_DAILY_NEW_CARDS_LIMIT,
  DEFAULT_REVIEW_SESSION_CARD_LIMIT,
  type ReviewQueueSummary,
} from '@/features/review/lib/reviewQueue'
import HomeRealtime from './HomeRealtime'
import HomeAnalytics from './HomeAnalytics'
import HomeNotice from './HomeNotice'
import NavWayfindingHint from '@/components/navigation/NavWayfindingHint'
import HomeFooter from './HomeFooter'
import DailyQuestsWidget from './DailyQuestsWidget'
import PacksHubCard from './PacksHubCard'
import NewMaterialNotice from './NewMaterialNotice'
import { countCatalogPacksNotInRoutine } from '@/features/review/lib/catalogAvailability'
import { getNewMaterialStatus } from '@/features/review/lib/newMaterialStatus'
import StaggeredFadeIn from '@/components/ui/StaggeredFadeIn'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import FirstDayGuide from './FirstDayGuide'
import { getFirstDayPlan } from '@/features/onboarding/lib/firstDayPlan'
import OnboardingWelcomeBanner from '@/components/onboarding/OnboardingWelcomeBanner'
import { getUserOnboardingStatus, isRecentUser } from '@/features/onboarding/lib/onboardingStatus'
import type { OnboardingDailyGoalMinutes } from '@/features/onboarding/lib/onboardingInterests'
import {
  getLearningProfilePlan,
  type LearningProfileInput,
} from '@/features/learning-profile/lib/learningProfile'
import {
  getLearningPlanMemory,
  recordLearningPlanSnapshot,
} from '@/features/learning-profile/lib/learningPlanHistory'
import TodaysStudyButton from '@/features/learning-profile/components/TodaysStudyButton'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  homeAssignmentCardClass,
  homeCardButton,
  homeCardClass,
  homeHeroCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeSectionTitleClass,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'

/* Narrower and shorter than the old p-6/w-280 tile: these are glanceable stats, so on mobile two
   should peek into view at once rather than each one filling the viewport. */
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
  unseenInRoutine: 0,
  introducedToday: 0,
  newCardsLimit: DEFAULT_DAILY_NEW_CARDS_LIMIT,
  sessionLimit: DEFAULT_REVIEW_SESSION_CARD_LIMIT,
  dailyCardsReviewed: 0,
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

type HomeStreak = {
  current_streak: number | null
  longest_streak: number | null
  last_activity_date: string | null
  streak_frozen_until: string | null
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

type HomeAction = {
  href: string
  label: string
  icon: LucideIcon
}

type HomePrimaryAction = HomeAction & {
  title: string
  description: string
}

/**
 * Single source of truth for the hero CTA: the badge above the title (kicker)
 * and the CTA itself always agree because they're derived from the same branch.
 */
function resolvePrimaryHomeAction(options: {
  streakStatus: StreakStatus
  hasPendingReviews: boolean
  reviewDue: number
  nextAssignment: HomeAssignment | undefined
  showBlitzCta: boolean
  blitzBestScore: number
  incompleteBlitzQuestCount: number
}): { action: HomePrimaryAction; kicker: string } {
  if (options.streakStatus === 'risk' && !options.hasPendingReviews) {
    return {
      kicker: 'Sequência em risco',
      action: {
        href: '/blitz/play',
        label: 'Jogar Blitz agora',
        title: 'Sua sequência está em risco.',
        description: 'Jogue uma partida rápida hoje para manter seu ritmo.',
        icon: Zap,
      },
    }
  }
  if (options.hasPendingReviews) {
    return {
      kicker: 'Revisão curta',
      action: {
        href: '/review',
        label: 'Revisar agora',
        title: 'Sua revisão curta está pronta.',
        description: `${options.reviewDue} frase${options.reviewDue === 1 ? '' : 's'} esperando por você.`,
        icon: Brain,
      },
    }
  }
  if (options.nextAssignment) {
    return {
      kicker: 'Próxima lição',
      action: {
        href: `/play/${options.nextAssignment.id}`,
        label: 'Começar atividade',
        title: getPackReviewLabel(options.nextAssignment.packs?.level),
        description: options.nextAssignment.packs?.description || 'Sessão pronta para hoje.',
        icon: BookOpen,
      },
    }
  }
  if (options.showBlitzCta) {
    return {
      kicker: 'Blitz do dia',
      action: {
        href: '/blitz/play',
        label: 'Jogar Blitz',
        title:
          options.blitzBestScore > 0
            ? `Bater seu recorde de ${options.blitzBestScore} pontos.`
            : 'Desafio relâmpago para manter o ritmo.',
        description:
          options.incompleteBlitzQuestCount > 0
            ? `Falta${options.incompleteBlitzQuestCount === 1 ? '' : 'm'} ${options.incompleteBlitzQuestCount} missão${options.incompleteBlitzQuestCount === 1 ? '' : 'ões'} de Blitz para fechar o dia.`
            : 'Tudo em dia. Um Blitz mantém o ritmo.',
        icon: Zap,
      },
    }
  }
  return {
    kicker: 'Tudo em dia',
    action: {
      href: '/history',
      label: 'Ver histórico',
      title: 'Tudo em dia por agora.',
      description: 'Acompanhe sua evolução ou explore novos conteúdos.',
      icon: CheckCircle2,
    },
  }
}

function getVictoryEmptyAction(options: {
  nextAssignment: HomeAssignment | undefined
  hasPendingReviews: boolean
}): HomeAction {
  if (options.nextAssignment) {
    return { href: `/play/${options.nextAssignment.id}`, label: 'Começar lição', icon: BookOpen }
  }
  if (options.hasPendingReviews) {
    return { href: '/review', label: 'Fazer revisão', icon: Brain }
  }
  return { href: '/blitz/play', label: 'Jogar Blitz', icon: Zap }
}

function DailyPlanSummary({
  title,
  description,
  completionRate,
  reviewDue,
}: {
  title: string
  description: string
  completionRate: number
  reviewDue: number
}) {
  const statusLabel =
    reviewDue > 0
      ? `${reviewDue} ${reviewDue === 1 ? 'frase na revisão' : 'frases na revisão'}`
      : 'Tudo concluído por hoje'

  return (
    <article className={`${homeCardClass} p-5 sm:p-6`}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,0.7fr)] sm:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <div className={`h-11 w-11 ${homeIconBox}`}>
            <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-bold text-brand-dark">{title}</h3>
            <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary">
              {description}
            </p>
          </div>
        </div>

        <div className="min-w-0 rounded-container border border-brand-dark/30 bg-bg-primary/70 p-4">
          <div className="flex items-center justify-between gap-3 font-body text-xs font-semibold text-brand-secondary">
            <span>Progresso de hoje</span>
            <span className="font-heading text-sm font-bold text-brand-dark">{completionRate}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full border border-brand-dark/30 bg-bg-card"
            role="progressbar"
            aria-label="Progresso do plano de hoje"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionRate}
          >
            <div
              className="h-full rounded-full bg-brand-accent transition-[width] duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="mt-3 flex items-center gap-2 font-body text-xs font-semibold text-brand-secondary">
            {reviewDue > 0 ? (
              <Brain className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            )}
            {statusLabel}
          </p>
        </div>
      </div>
    </article>
  )
}

function OnboardingHome() {
  return (
    <div className={`${homeShellClass} min-h-[calc(100svh-5rem)] pb-8`}>
      <div className="relative z-10 space-y-6 pb-8">
        <section className="space-y-3">
          <SectionBadge label="Início" animate={false} />
          <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] text-brand-dark sm:text-5xl">
            Bem-vindo ao Kivora English
          </h1>
          <p className="max-w-2xl text-base leading-7 text-brand-secondary">
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
    supabase.from('profiles').select('username,role,created_at').eq('id', userId).single(),
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
      .select('current_streak,longest_streak,last_activity_date,streak_frozen_until')
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

  void materializeScheduledReviewReleasesForUser(user.id).catch((error) => {
    logger.error('Failed to materialize scheduled review releases', { userId: user.id, error })
  })

  // Both batches are independent of each other, so they run as a single round trip
  // instead of two sequential awaits.
  const [dashboardData, reviewQueryResults, catalogPacksAvailable] = await Promise.all([
    withTimeout(fetchHomeDashboardData(supabase, user.id), QUERY_TIMEOUT_MS, HOME_DASHBOARD_FALLBACK),
    Promise.all([
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
      withTimeout(getUserOnboardingStatus(supabase, user.id), QUERY_TIMEOUT_MS, {
        completed: false,
        row: null,
      }).catch(() => ({ completed: false, row: null })),
    ]),
    // Fora do Promise.all interno de propósito: aquele já tinha seis elementos e o sétimo estourava
    // o limite de inferência de tipos do TypeScript (TS2589). Aqui roda igualmente em paralelo.
    withTimeout(
      countCatalogPacksNotInRoutine(
        supabase as unknown as Parameters<typeof countCatalogPacksNotInRoutine>[0],
        user.id
      ),
      QUERY_TIMEOUT_MS,
      0
    ).catch(() => 0),
  ])
  const [profileResult, assignmentsResult, questsResult, streakResult] = dashboardData
  const [reviewStats, problemWordsCount, blitzBest, cefrProfile, b2Path, onboardingStatus] =
    reviewQueryResults

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
  const isRecentSignup = isRecentUser(user.created_at || profile?.created_at)
  const hasAssignedPack = allAssignments.some((assignment) => Boolean(assignment.packs))
  const hasCompletedReviewSession = reviewStats.totalReviews > 0
  const isNewUser = !hasAssignedPack && !hasCompletedReviewSession

  if (isNewUser && isRecentSignup) {
    return <OnboardingHome />
  }

  const totalAssignments = assignments.length
  const pendingAssignments = assignments.filter((assignment) => !isAssignmentCompleted(assignment.status))
  const completedAssignments = assignments.filter((assignment) => isAssignmentCompleted(assignment.status))

  // Quem termina o onboarding sai com um pack, então cai fora do portão acima e recebia o
  // dashboard inteiro de uma vez. No primeiro dia isso é escolha demais: o guia abaixo mostra uma
  // ação por vez e some sozinho quando os três passos terminam.
  const newMaterial = getNewMaterialStatus({
    unseenInRoutine: reviewStats.unseenInRoutine,
    dailyNewLimit: reviewStats.newCardsLimit,
    catalogPacksAvailable,
  })

  const firstDayPlan = getFirstDayPlan({
    isRecentSignup,
    hasAssignedPack,
    introducedToday: reviewStats.introducedToday,
    dailyCardsReviewed: reviewStats.dailyCardsReviewed,
    totalReviews: reviewStats.totalReviews,
    pendingAssignments: pendingAssignments.length,
    completedAssignments: completedAssignments.length,
  })

  if (firstDayPlan.active) {
    return (
      <div className={`${homeShellClass} min-h-[calc(100svh-5rem)] pb-8`}>
        <div className="relative z-10 space-y-6 pb-8">
          <FirstDayGuide plan={firstDayPlan} firstName={profile?.username ?? null} />
          <NavWayfindingHint />
        </div>
      </div>
    )
  }
  const pendingCount = pendingAssignments.length
  const completedCount = totalAssignments - pendingCount
  const completedReviewsToday = reviewStats.dailyCardsReviewed
  const totalReviewWork = completedReviewsToday + reviewStats.totalDue
  const totalDailyWork = totalAssignments + totalReviewWork
  const completedDailyWork = completedCount + completedReviewsToday
  const isDailyPlanEmpty = totalDailyWork === 0
  const completionRate =
    totalDailyWork > 0 ? Math.round((completedDailyWork / totalDailyWork) * 100) : 0
  const hasPendingReviews = reviewStats.totalDue > 0
  const nextAssignment = pendingAssignments[0]
  const quests = (questsResult.data as HomeQuest[] | null) || []
  const { incompleteBlitzQuestCount } = getIncompleteQuestCounts(quests)
  const blitzBestScore = blitzBest?.bestScore ?? 0
  const showBlitzCta =
    completionRate === 100 || isDailyPlanEmpty || streakStatus === 'risk' || incompleteBlitzQuestCount > 0
  const blitzHeroLabel = getBlitzHeroLabel({
    streakStatus,
    incompleteBlitzQuestCount,
    blitzBestScore,
  })
  const { action: primaryAction, kicker: heroKicker } = resolvePrimaryHomeAction({
    streakStatus,
    hasPendingReviews,
    reviewDue: reviewStats.totalDue,
    nextAssignment,
    showBlitzCta,
    blitzBestScore,
    incompleteBlitzQuestCount,
  })
  const PrimaryActionIcon = primaryAction.icon
  const planCompleteTitle =
    completionRate === 100 || isDailyPlanEmpty ? 'Plano de hoje concluído' : 'Lições do plano concluídas'
  const planCompleteDescription = hasPendingReviews
    ? 'Falta só uma revisão curta.'
    : 'Sem lições pendentes agora.'
  const planCompletionRate = isDailyPlanEmpty ? 100 : completionRate
  const victoryEmptyAction = getVictoryEmptyAction({ nextAssignment, hasPendingReviews })
  const VictoryEmptyActionIcon = victoryEmptyAction.icon
  const recentWins = [
    completedCount > 0
      ? {
        id: 'lessons',
        title: `${completedCount} ${completedCount === 1 ? 'lição concluída' : 'lições concluídas'}`,
        description: pendingCount > 0
          ? `${pendingCount} ${pendingCount === 1 ? 'lição ainda espera' : 'lições ainda esperam'} no plano.`
          : 'Suas lições programadas estão em dia.',
        icon: CheckCircle2,
      }
      : null,
    completedReviewsToday > 0
      ? {
        id: 'reviews-today',
        title: `${completedReviewsToday} ${completedReviewsToday === 1 ? 'revisão feita' : 'revisões feitas'} hoje`,
        description: hasPendingReviews
          ? `${reviewStats.totalDue} ${reviewStats.totalDue === 1 ? 'frase ainda está' : 'frases ainda estão'} na fila.`
          : 'A revisão diária está sob controle.',
        icon: Brain,
      }
      : null,
    blitzBestScore > 0
      ? {
        id: 'blitz-best',
        title: `${blitzBestScore} pontos no Blitz`,
        description: 'Seu melhor resultado semanal já está registrado.',
        icon: Zap,
      }
      : null,
    b2Path.b2Completed > 0
      ? {
        id: 'b2-path',
        title: `${b2Path.b2Completed} ${b2Path.b2Completed === 1 ? 'pack B2 concluído' : 'packs B2 concluídos'}`,
        description: `${b2Path.b2Percent}% do caminho B2 no escopo atual.`,
        icon: Medal,
      }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item)).slice(0, 3)

  // Uma decisão por vez: o secundário aponta para outra área do app, nunca para o mesmo
  // destino do botão principal (a checagem de href acontece no JSX).
  const secondaryAction =
    hasPendingReviews && nextAssignment
      ? { href: `/play/${nextAssignment.id}`, label: 'Abrir lição', Icon: ArrowRight }
      : showBlitzCta
        ? { href: '/blitz/play', label: blitzHeroLabel, Icon: Zap }
        : { href: '/explore', label: 'Explorar', Icon: BookOpen }

  const onboardingRow = onboardingStatus.row
  const dailyGoalMinutes: OnboardingDailyGoalMinutes | null =
    onboardingRow?.daily_goal_minutes === 5 ||
    onboardingRow?.daily_goal_minutes === 10 ||
    onboardingRow?.daily_goal_minutes === 15
      ? onboardingRow.daily_goal_minutes
      : null
  const learningPlanMemory = await withTimeout(
    getLearningPlanMemory(supabase, user.id),
    QUERY_TIMEOUT_MS,
    { recentPlans: [], recentOpenedResourceIds: [] }
  ).catch(() => ({ recentPlans: [], recentOpenedResourceIds: [] }))
  const learningProfileInput: LearningProfileInput = {
    cefrProfile,
    reviewStats,
    problemWordsCount,
    pendingAssignmentsCount: pendingCount,
    completedReviewsToday,
    streakStatus,
    dailyGoalMinutes,
    interests: onboardingRow?.interests ?? [],
    learningMemory: learningPlanMemory,
  }
  const learningProfilePlan = getLearningProfilePlan(learningProfileInput)
  void recordLearningPlanSnapshot(
    supabase,
    user.id,
    today,
    learningProfilePlan,
    learningProfileInput
  ).catch((error) => {
    logger.error('Failed to record learning plan snapshot', { userId: user.id, error })
  })
  const onboardingCompletedAt = onboardingRow?.onboarding_completed_at
  const onboardingCompletedDate = onboardingCompletedAt
    ? getAppDateString(onboardingCompletedAt)
    : null
  const showOnboardingWelcome =
    onboardingStatus.completed &&
    dailyGoalMinutes != null &&
    onboardingCompletedDate != null &&
    onboardingCompletedDate >= shiftAppDate(today, -14)

  let starterPackName: string | null = null
  let starterPackHref: string | null = null

  if (showOnboardingWelcome && onboardingRow?.starter_pack_id) {
    const [{ data: starterPack }, { data: starterAssignment }] = await Promise.all([
      supabase.from('packs').select('name').eq('id', onboardingRow.starter_pack_id).maybeSingle(),
      supabase
        .from('assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('pack_id', onboardingRow.starter_pack_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    starterPackName = starterPack?.name ?? null
    starterPackHref = starterAssignment?.id ? `/play/${starterAssignment.id}` : null
  }

  return (
    <div className={homeShellClass}>
      <div className="relative z-10 space-y-6 pb-8">
        <HomeRealtime />
        <HomeAnalytics streakStatus={streakStatus} longestStreak={longestStreak} />
        <Suspense fallback={null}>
          <HomeNotice />
        </Suspense>

        <StaggeredFadeIn className="relative z-10 space-y-6" animateOnMount>
          {showOnboardingWelcome && dailyGoalMinutes ? (
            <OnboardingWelcomeBanner
              dailyGoalMinutes={dailyGoalMinutes}
              levelSource={onboardingRow?.level_source}
              placementConfidence={onboardingRow?.placement_confidence}
              starterPackName={starterPackName}
              starterPackHref={starterPackHref}
            />
          ) : null}

          <section className={`${homeHeroCardClass} relative overflow-hidden`}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                // Só o brilho lime do canto. O segundo gradiente daqui era um
                // `linear-gradient(135deg, ...)` com uma faixa de 1%, que desenhava um risco
                // diagonal atravessando o card inteiro.
                background:
                  'radial-gradient(circle at 92% 0%, rgba(213, 224, 107, 0.75), transparent 34%)',
              }}
            />
            <div className="relative z-10 p-6 sm:p-8">
              <div className="relative z-10">
                <div className={`inline-flex p-2 ${homeIconBox}`}>
                  <PrimaryActionIcon className="h-6 w-6" strokeWidth={2} />
                </div>
                <SectionBadge label={heroKicker} className="mt-5" />
                {/* Meta diária saiu para a Conta: é consulta, não ação. Só fica o que muda o
                    que a pessoa faz agora — quantas lições ainda esperam por ela. */}
                {pendingCount > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/study"
                      transitionTypes={navForwardTransitionTypes}
                      prefetch={false}
                      className={homeSmallPillClass}
                    >
                      {pendingCount} lição{pendingCount === 1 ? '' : 'ões'} pendente{pendingCount === 1 ? '' : 's'}
                    </Link>
                  </div>
                ) : null}
                <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-tight text-brand-dark sm:text-4xl">
                  {primaryAction.title}
                </h1>
                <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
                  {primaryAction.description}
                </p>
                {/* One unmistakable action. The secondary goes somewhere *different* from the
                    primary, and the plan explainer sits below as a quiet link — a beginner should
                    never have to choose between three buttons of similar weight. */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href={primaryAction.href}
                    transitionTypes={navForwardTransitionTypes}
                    prefetch={false}
                    className={`${homePrimaryButton} w-full sm:w-auto`}
                  >
                    <PrimaryActionIcon className="h-4 w-4" />
                    {primaryAction.label}
                  </Link>
                  {/* O secundário só existe quando leva a um lugar DIFERENTE do primário.
                      Sem esta checagem o herói mostrava "Jogar Blitz" e "Bater recorde" lado a
                      lado, com o mesmo peso visual e o mesmo destino — dois botões para uma
                      decisão só, que é exatamente o que deixava a Home confusa. */}
                  {secondaryAction && secondaryAction.href !== primaryAction.href ? (
                    <Link
                      href={secondaryAction.href}
                      transitionTypes={navForwardTransitionTypes}
                      prefetch={false}
                      className={`${homeSecondaryButton} w-full sm:w-auto`}
                    >
                      <secondaryAction.Icon className="h-4 w-4" />
                      {secondaryAction.label}
                    </Link>
                  ) : null}
                </div>
                <div className="mt-4">
                  <TodaysStudyButton
                    primaryAction={{
                      href: primaryAction.href,
                      label: primaryAction.label,
                      title: primaryAction.title,
                      description: primaryAction.description,
                    }}
                    plan={learningProfilePlan}
                  />
                </div>
              </div>

            </div>

          </section>

          {/* Order below the hero is act -> understand -> track: the concrete task list first,
              then why it was recommended, and only then the glanceable stats. Metrics used to sit
              directly under the hero, which pushed the actual plan a full screen down on mobile. */}
          <section className="content-visibility-section space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <SectionBadge label="Rotina de hoje" />
                <h2 className={`mt-3 ${homeSectionTitleClass}`}>Plano do dia</h2>
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
                <Link href="/admin/dashboard" transitionTypes={navForwardTransitionTypes} prefetch={false} className={homeCardButton}>
                  <Settings className="h-4 w-4" />
                  Painel
                </Link>
              )}
            </div>

            {assignments.length > 0 ? (
              <div className="space-y-5">
                {pendingAssignments.length > 0 ? (
                  <StaggeredFadeIn className="grid gap-4" animateOnMount>
                    {pendingAssignments.slice(0, 3).map((assignment) => {
                      const statusMeta = parseAssignmentStatus(assignment.status)
                      const mode = gameModeConfig[getGameModeOption(assignment.game_mode).id] || gameModeConfig.multiple_choice

                      return (
                        <Link
                          key={assignment.id}
                          href={`/play/${assignment.id}`}
                          transitionTypes={navForwardTransitionTypes}
                          prefetch={false}
                          data-testid="assignment-card"
                          className={`${homeAssignmentCardClass} cursor-pointer`}
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <div className={`h-11 w-11 shrink-0 ${homeIconBox}`}>
                              {assignment.badges ? (
                                <span
                                  role="img"
                                  aria-label={assignment.badges.name}
                                  title={assignment.badges.name}
                                  className="text-xl"
                                >
                                  🏅
                                </span>
                              ) : (
                                <BookOpen className="h-5 w-5" strokeWidth={2} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className={homeSmallPillClass}>{mode.label}</span>
                              <h3 className="mt-3 font-heading text-lg font-bold text-brand-dark">
                                {getPackReviewLabel(assignment.packs?.level)}
                              </h3>
                              <p className="mt-1 line-clamp-2 font-body text-sm leading-relaxed text-brand-secondary">
                                {assignment.packs?.description || 'Sessão pronta para hoje.'}
                              </p>
                              <div className="mt-3 flex items-center gap-2 font-body text-xs font-semibold text-brand-secondary">
                                <Clock className="h-3.5 w-3.5" />
                                {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Foco diário'}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <span
                              data-testid="assignment-start-button"
                              className={homePrimaryButton}
                            >
                              Começar
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </StaggeredFadeIn>
                ) : (
                  <DailyPlanSummary
                    title={planCompleteTitle}
                    description={planCompleteDescription}
                    completionRate={planCompletionRate}
                    reviewDue={reviewStats.totalDue}
                  />
                )}

                {completedAssignments.length > 0 ? (
                  <details className={`${homeCardClass} group overflow-hidden`}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none sm:px-5">
                      <span className="font-heading text-sm font-bold uppercase tracking-widest text-brand-secondary">
                        Concluídas
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className={homeSmallPillClass}>
                          {completedAssignments.length} feita{completedAssignments.length === 1 ? '' : 's'}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-brand-secondary transition-transform group-open:rotate-180" strokeWidth={2.4} />
                      </span>
                    </summary>
                    <div className="grid gap-3 border-t border-brand-dark p-4 sm:p-5">
                      {completedAssignments.slice(0, 2).map((assignment) => {
                        const statusMeta = parseAssignmentStatus(assignment.status)
                        const mode = gameModeConfig[getGameModeOption(assignment.game_mode).id] || gameModeConfig.multiple_choice

                        return (
                          <article
                            key={assignment.id}
                            data-testid="assignment-card"
                            className={`${homeAssignmentCardClass} border-brand-dark/40 bg-bg-card/70 opacity-80 hover:translate-y-0`}
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div className={`h-11 w-11 shrink-0 ${homeIconBox}`}>
                                {assignment.badges ? (
                                  <span
                                    role="img"
                                    aria-label={assignment.badges.name}
                                    title={assignment.badges.name}
                                    className="text-xl"
                                  >
                                    🏅
                                  </span>
                                ) : (
                                  <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className={homeSmallPillClass}>{mode.label}</span>
                                <h3 className="mt-3 font-heading text-lg font-bold text-brand-dark">
                                  {getPackReviewLabel(assignment.packs?.level)}
                                </h3>
                                <div className="mt-3 flex items-center gap-2 font-body text-xs font-semibold text-brand-secondary">
                                  <Clock className="h-3.5 w-3.5" />
                                  {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Foco diário'}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <span className={homeSmallPillClass}>Concluído</span>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : isRecentSignup ? (
              <OnboardingChecklist variant="tile" secondaryHref="/study" secondaryLabel="Montar minha rotina" />
            ) : (
              <DailyPlanSummary
                title={planCompleteTitle}
                description={planCompleteDescription}
                completionRate={planCompletionRate}
                reviewDue={reviewStats.totalDue}
              />
            )}
          </section>


          <DailyQuestsWidget quests={questsResult.data || []} />
        </StaggeredFadeIn>

        {problemWordsCount > 0 ? (
          <section className={`${homeCardClass} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <SectionBadge label="Dificuldades" />
                <p className="mt-3 font-heading text-lg font-bold text-brand-dark">
                  {problemWordsCount} termo{problemWordsCount === 1 ? '' : 's'} para revisar
                </p>
                <p className="mt-2 font-body text-sm text-brand-secondary">
                  Revise seus termos mais difíceis.
                </p>
              </div>
              <Link
                href="/problem-words"
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className={homeSecondaryButton}
              >
                <Brain className="h-4 w-4" />
                Ver dificuldades
              </Link>
            </div>
          </section>
        ) : null}

        <NewMaterialNotice status={newMaterial} />

        <PacksHubCard isEmptyRoutine={assignments.length === 0} isRecentSignup={isRecentSignup} />

        <StaggeredFadeIn
          className="relative z-10 space-y-6"
          staggerDelay={0.05}
          maxItemDelay={0.08}
          animateOnMount
        >
          <section>
            <article className={`${homeCardClass} relative flex h-full flex-col p-6 sm:p-8`}>
              <DecoCheck className="absolute left-4 top-4 h-7 w-7 opacity-25" />
              <div className="flex items-center justify-between gap-3">
                <div className="relative z-10">
                  <SectionBadge label="Conquistas" />
                  <h2 className={`mt-3 ${homeSectionTitleClass}`}>Vitórias recentes</h2>
                </div>
                <div className={`relative z-10 h-11 w-11 ${homeIconBox}`}>
                  <Medal className="h-5 w-5" />
                </div>
              </div>
              {recentWins.length > 0 ? (
                <div className="relative z-10 mt-6 grid flex-1 gap-3 md:grid-cols-3">
                  {recentWins.map((win) => {
                    const Icon = win.icon
                    return (
                      <div key={win.id} className={`home-nested-card overflow-hidden p-5 ${homeNestedCardClass}`}>
                        <div className={`h-10 w-10 ${homeIconBox}`}>
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <p className="mt-3 font-heading text-base font-bold leading-tight text-brand-dark">
                          {win.title}
                        </p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                          {win.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={`relative z-10 mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${homeNestedCardClass}`}>
                  <div className="min-w-0">
                    <p className="font-heading text-base font-bold text-brand-dark">
                      Complete uma atividade para registrar sua próxima vitória.
                    </p>
                    <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                      Uma atividade já registra progresso aqui.
                    </p>
                  </div>
                  <Link
                    href={victoryEmptyAction.href}
                    transitionTypes={navForwardTransitionTypes}
                    prefetch={false}
                    className={homeSecondaryButton}
                  >
                    <VictoryEmptyActionIcon className="h-4 w-4" />
                    {victoryEmptyAction.label}
                  </Link>
                </div>
              )}
            </article>
          </section>

        </StaggeredFadeIn>

        <HomeFooter />
      </div>
    </div>
  )
}
