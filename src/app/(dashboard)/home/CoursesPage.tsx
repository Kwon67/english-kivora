import WorkspaceSections from '@/components/ui/WorkspaceSections'
import { Card } from '@/components/shadcn/card'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Settings,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { getUserBlitzBest } from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import { ensureDailyPlanForUser } from '@/features/study/lib/ensureDailyPlan'
import { PersonalLearningSync } from '@/features/learning/components/PersonalLearningSync'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
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
import DashboardOverview from './DashboardOverview'
import HomeRealtime from './HomeRealtime'
import HomeAnalytics from './HomeAnalytics'
import HomeNotice from './HomeNotice'
import NavWayfindingHint from '@/components/navigation/NavWayfindingHint'
import HomeGlassBackdrop from './HomeGlassBackdrop'
import DailyQuestsWidget from './DailyQuestsWidget'
import PacksHubCard from './PacksHubCard'
import LearningPath from '@/features/study/components/LearningPath'
import {
  buildLearningPath,
  summarizePackProgress,
  type CurriculumPackRow,
} from '@/features/study/lib/learningPath'
import { getCurriculumState, type CurriculumState } from '@/features/curriculum/lib/curriculumState'
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
  homeCardButton,
  homeCardClass,
  homeSecondaryButton,
  homeShellClass,
} from '@/lib/homeStyles'

/* Narrower and shorter than the old p-6/w-280 tile: these are glanceable stats, so on mobile two
   should peek into view at once rather than each one filling the viewport. */
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 180

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
  pack_id: string
  assigned_date: string
  created_at: string | null
  status: string
  game_mode: string
  assigned_by: string
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
        title: options.nextAssignment.packs?.name || 'Sessão pronta para hoje.',
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

function LearningPathEmpty() {
  return (
    <div className="relative">
      <HomeGlassBackdrop />
      <Card asChild unstyled><article className={`${homeCardClass} home-frosted-surface home-frosted-surface-soft relative z-10 flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem decorativa com dimensões conhecidas */}
        <img width={1536} height={1024}
          src="/images/mindmarket/discovery.png"
          alt=""
          aria-hidden="true"
          className="h-28 w-auto shrink-0 sm:h-32"
        />
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold text-brand-dark">
            Sua trilha começa na primeira lição
          </h3>
          <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brand-secondary">
            Cada lição que você fizer vira uma bolinha neste caminho, organizada pelo seu nível. Assim
            você sempre sabe onde parou e pode voltar a qualquer uma.
          </p>
        </div>
      </article></Card>
    </div>
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
      .select('id,pack_id,assigned_date,created_at,status,game_mode,assigned_by,reward_badge_id,packs(name,description,level),badges(name,icon_name)')
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

const FALLBACK_CURRICULUM_STATE: CurriculumState = {
  currentLevel: 'A1',
  passed: new Map(),
  lastFailedAt: null,
}

const HOME_DASHBOARD_FALLBACK = [
  { data: null, error: null },
  { data: [], error: null },
  { data: [], error: null },
  { data: null, error: null },
] as unknown as HomeDashboardData

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Reading searchParams makes `/home?sessionComplete=true` a distinct RSC request.
  // Without this, Next reuses the `/home` payload from before the lesson, so the
  // current path node never moves after the student finishes a pack.
  await searchParams

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

  /**
   * Monta o plano do dia antes de ler o painel, para o aluno nunca cair numa
   * home vazia esperando o cron. Awaited de propósito: se rodasse solto, a
   * primeira visita do dia renderizaria sem o plano que acabou de ser criado.
   * Nas visitas seguintes isso é uma consulta indexada que sai por "já
   * planejado", então o custo real é só o do primeiro acesso.
   */
  const dailyPlan = await withTimeout(
    ensureDailyPlanForUser(user.id, user.user_metadata).catch((error) => {
      logger.error('Failed to ensure daily plan', { userId: user.id, error })
      return null
    }),
    QUERY_TIMEOUT_MS,
    null
  )

  // Both batches are independent of each other, so they run as a single round trip
  // instead of two sequential awaits.
  const [dashboardData, reviewQueryResults, curriculumResults] = await Promise.all([
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
      withTimeout(getUserOnboardingStatus(supabase, user.id), QUERY_TIMEOUT_MS, {
        completed: false,
        row: null,
      }).catch(() => ({ completed: false, row: null })),
    ]),
    // Currículo: aprovações nas provas de nível + packs públicos na ordem pedagógica. A lista de
    // packs é o catálogo inteiro (~170 linhas, só metadados); o corte por nível acontece na trilha.
    Promise.all([
      withTimeout(getCurriculumState(user.id), QUERY_TIMEOUT_MS, FALLBACK_CURRICULUM_STATE).catch(
        () => FALLBACK_CURRICULUM_STATE
      ),
      withTimeout(
        Promise.resolve(
          supabase
            .from('packs')
            .select('id,name,description,level,category,curriculum_position,created_at')
            .eq('is_public', true)
        ).then(({ data }) => (data || []) as CurriculumPackRow[]),
        QUERY_TIMEOUT_MS,
        [] as CurriculumPackRow[]
      ).catch(() => [] as CurriculumPackRow[]),
    ]),
  ])
  const [curriculumState, curriculumPacks] = curriculumResults
  const [profileResult, assignmentsResult, questsResult, streakResult] = dashboardData
  const [reviewStats, problemWordsCount, blitzBest, cefrProfile, onboardingStatus] =
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
    return <><PersonalLearningSync active={dailyPlan?.reason === 'personalizing'} /><OnboardingHome /></>
  }

  const totalAssignments = assignments.length
  const pendingAssignments = assignments.filter((assignment) => !isAssignmentCompleted(assignment.status))
  const completedAssignments = assignments.filter((assignment) => isAssignmentCompleted(assignment.status))

  // Quem termina o onboarding sai com um pack, então cai fora do portão acima e recebia o
  // dashboard inteiro de uma vez. No primeiro dia isso é escolha demais: o guia abaixo mostra uma
  // ação por vez e some sozinho quando os três passos terminam.
  const firstDayPlan = getFirstDayPlan({
    isRecentSignup,
    hasAssignedPack,
    introducedToday: reviewStats.introducedToday,
    dailyCardsReviewed: reviewStats.dailyCardsReviewed,
    totalReviews: reviewStats.totalReviews,
    pendingAssignments: pendingAssignments.length,
    completedAssignments: completedAssignments.length,
    // O guia do primeiro dia substitui a Home inteira, então a trilha não está na tela:
    // o passo de prática aponta direto para a lição pendente.
    practiceHref: pendingAssignments[0] ? `/play/${pendingAssignments[0].id}` : undefined,
  })

  if (firstDayPlan.active) {
    return (
      <div className={`${homeShellClass} min-h-[calc(100svh-5rem)] pb-8`}>
        <PersonalLearningSync active={dailyPlan?.reason === 'personalizing'} />
        <div className="relative z-10 space-y-6 pb-8">
          <FirstDayGuide plan={firstDayPlan} firstName={profile?.username ?? null} />
          <NavWayfindingHint />
        </div>
      </div>
    )
  }
  const pendingCount = pendingAssignments.length
  const learningPath = buildLearningPath({
    packs: curriculumPacks,
    progress: summarizePackProgress(allAssignments, isAssignmentCompleted),
    passedLevels: curriculumState.passed,
    currentLevel: curriculumState.currentLevel,
  })
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
      <PersonalLearningSync active={dailyPlan?.reason === 'personalizing'} />
      <div className="relative z-10 space-y-6 pb-8">
        <HomeRealtime />
        <HomeAnalytics streakStatus={streakStatus} longestStreak={longestStreak} />
        <Suspense fallback={null}>
          <HomeNotice />
        </Suspense>

        <DashboardOverview
          username={profile?.username ?? null}
          level={learningPath.currentLevel}
          completed={learningPath.doneCount}
          total={learningPath.totalCount}
          completionRate={completionRate}
          streak={streak}
          due={reviewStats.totalDue}
          reviewed={completedReviewsToday}
          pending={pendingCount}
          kicker={heroKicker}
          action={primaryAction}
          secondary={secondaryAction && secondaryAction.href !== primaryAction.href ? <Link href={secondaryAction.href} prefetch={false} className="premium-text-link">{secondaryAction.label}<ArrowRight className="h-4 w-4" /></Link> : null}
          plan={<TodaysStudyButton primaryAction={{ href: primaryAction.href, label: primaryAction.label, title: primaryAction.title, description: primaryAction.description }} plan={learningProfilePlan} />}
        />

<WorkspaceSections label="Organização dos estudos" tabs={[{id:'curriculo',label:'Sua trilha',description:'Continue seu percurso, uma lição por vez.',icon:'course',anchors:['trilha']},{id:'metas',label:'Missões',description:'Objetivos do dia e palavras que precisam de atenção.',icon:'target'},{id:'descobrir',label:'Explorar',description:'Encontre conteúdos para ampliar sua prática.',icon:'book'}]}><div>        <section id="trilha" className="premium-curriculum relative z-10 scroll-mt-4 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">Sua trilha</h2>
            </div>
            {profile?.role === 'admin' && (
              <Link href="/admin/dashboard" transitionTypes={navForwardTransitionTypes} prefetch={false} className={homeCardButton}>
                <Settings className="h-4 w-4" />
                Painel
              </Link>
            )}
          </div>

          {learningPath.totalCount > 0 ? (
            <LearningPath path={learningPath} />
          ) : isRecentSignup ? (
            <OnboardingChecklist variant="tile" />
          ) : (
            <LearningPathEmpty />
          )}
        </section>

</div><div className="workspace-panel-stack">        <StaggeredFadeIn className="relative z-10 space-y-6" animateOnMount>
          {showOnboardingWelcome && dailyGoalMinutes ? (
            <OnboardingWelcomeBanner
              dailyGoalMinutes={dailyGoalMinutes}
              levelSource={onboardingRow?.level_source}
              placementConfidence={onboardingRow?.placement_confidence}
              starterPackName={starterPackName}
              starterPackHref={starterPackHref}
            />
          ) : null}

          <DailyQuestsWidget quests={questsResult.data || []} />
        </StaggeredFadeIn>

        {problemWordsCount > 0 ? (
          <div className="relative">
            <HomeGlassBackdrop />
            <Card asChild unstyled><section className={`${homeCardClass} home-frosted-surface home-frosted-surface-soft relative z-10 p-5 sm:p-6`}>
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
            </section></Card>
          </div>
        ) : null}

</div><div>        <PacksHubCard isEmptyRoutine={assignments.length === 0} isRecentSignup={isRecentSignup} /></div></WorkspaceSections>


      </div>
    </div>
  )
}
