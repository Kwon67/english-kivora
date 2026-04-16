import { isAssignmentCompleted } from '@/lib/assignmentStatus'
import { getAppDateString } from '@/lib/timezone'

type MissionAssignment = {
  assigned_date: string
  status: string
}

type MissionSession = {
  completed_at: string
  correct_answers: number
  wrong_answers: number
}

type MissionReview = {
  review_date: string
  quality: number
}

type MissionSummaryInput = {
  today: string
  weeklyStart: string
  assignments: MissionAssignment[]
  sessions: MissionSession[]
  reviews: MissionReview[]
  pendingAssignmentsCount: number
  reviewStats: {
    totalDue: number
    dueToday: number
    newCardsLimit: number
  }
}

export type MissionCard = {
  id: string
  cadence: 'daily' | 'weekly'
  title: string
  description: string
  current: number
  target: number
  unitLabel: string
  rewardPoints: number
  completed: boolean
  accent: 'green' | 'blue' | 'amber'
}

export type MissionState = {
  daily: MissionCard[]
  weekly: MissionCard[]
  completedDaily: number
  completedWeekly: number
  totalDaily: number
  totalWeekly: number
  missionPoints: number
  bonusPoints: number
  totalRewardPoints: number
  dailyBundleUnlocked: boolean
  weeklyBundleUnlocked: boolean
  dailyBundleLabel: string
  weeklyBundleLabel: string
  rewardTier: string
  nextTierLabel: string | null
  nextTierRemaining: number | null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getAccuracy(session: MissionSession) {
  const total = session.correct_answers + session.wrong_answers
  if (total <= 0) return 0
  return Math.round((session.correct_answers / total) * 100)
}

function buildMissionCard(card: Omit<MissionCard, 'completed'>): MissionCard {
  return {
    ...card,
    completed: card.current >= card.target,
  }
}

export function buildMissionState({
  today,
  weeklyStart,
  assignments,
  sessions,
  reviews,
  pendingAssignmentsCount,
  reviewStats,
}: MissionSummaryInput): MissionState {
  const todayAssignments = assignments.filter((assignment) => assignment.assigned_date === today)
  const todayCompletedAssignments = todayAssignments.filter((assignment) => isAssignmentCompleted(assignment.status)).length
  const weeklyAssignments = assignments.filter((assignment) => assignment.assigned_date >= weeklyStart)
  const weeklyCompletedAssignments = weeklyAssignments.filter((assignment) => isAssignmentCompleted(assignment.status)).length
  const todaySessions = sessions.filter((session) => getAppDateString(session.completed_at) === today)
  const weeklySessions = sessions.filter((session) => getAppDateString(session.completed_at) >= weeklyStart)
  const todayReviewCount = reviews.filter((review) => getAppDateString(review.review_date) === today).length
  const weeklyGoodReviews = reviews.filter(
    (review) => getAppDateString(review.review_date) >= weeklyStart && review.quality >= 3
  ).length
  const todayStrongSessions = todaySessions.filter((session) => getAccuracy(session) >= 80).length
  const weeklyStrongSessions = weeklySessions.filter((session) => getAccuracy(session) >= 80).length
  const activityDays = new Set<string>([
    ...weeklySessions.map((session) => getAppDateString(session.completed_at)),
    ...reviews
      .filter((review) => getAppDateString(review.review_date) >= weeklyStart)
      .map((review) => getAppDateString(review.review_date)),
  ])

  const reviewBurstTarget = clamp(
    reviewStats.totalDue > 0 ? reviewStats.totalDue : Math.max(reviewStats.newCardsLimit, 6),
    6,
    12
  )
  const lessonTarget = clamp(
    todayAssignments.length > 0 ? todayAssignments.length : Math.max(pendingAssignmentsCount, 1),
    1,
    2
  )

  const daily = [
    reviewStats.totalDue > 0 || todayReviewCount > 0
      ? buildMissionCard({
          id: 'daily-review-burst',
          cadence: 'daily',
          title: `Revisar ${reviewBurstTarget} cards hoje`,
          description: 'Empurre a fila do dia enquanto a memoria ainda esta quente.',
          current: todayReviewCount,
          target: reviewBurstTarget,
          unitLabel: 'cards',
          rewardPoints: 35,
          accent: 'green',
        })
      : buildMissionCard({
          id: 'daily-open-loop',
          cadence: 'daily',
          title: 'Abrir 1 bloco de estudo hoje',
          description: 'Sem fila critica agora. O objetivo e nao deixar o motor esfriar.',
          current: todaySessions.length > 0 ? 1 : 0,
          target: 1,
          unitLabel: 'bloco',
          rewardPoints: 25,
          accent: 'green',
        }),
    buildMissionCard({
      id: 'daily-lesson-lock',
      cadence: 'daily',
      title: `Concluir ${lessonTarget} licao${lessonTarget > 1 ? 'es' : ''}`,
      description: 'Feche as tarefas visiveis para nao empurrar friccao para amanha.',
      current: todayCompletedAssignments,
      target: lessonTarget,
      unitLabel: 'licoes',
      rewardPoints: 30,
      accent: 'blue',
    }),
    buildMissionCard({
      id: 'daily-precision',
      cadence: 'daily',
      title: 'Fechar 1 sessao com 80%+',
      description: 'Nao basta volume. Hoje precisa ter pelo menos um bloco limpo.',
      current: todayStrongSessions,
      target: 1,
      unitLabel: 'sessao',
      rewardPoints: 25,
      accent: 'amber',
    }),
  ]

  const weekly = [
    buildMissionCard({
      id: 'weekly-consistency',
      cadence: 'weekly',
      title: 'Estudar em 4 dias diferentes',
      description: 'Constancia semanal segura memoria melhor do que tiros isolados.',
      current: activityDays.size,
      target: 4,
      unitLabel: 'dias',
      rewardPoints: 60,
      accent: 'green',
    }),
    buildMissionCard({
      id: 'weekly-mastery',
      cadence: 'weekly',
      title: 'Acumular 24 reviews boas',
      description: 'Qualidade 3+ indica consolidacao em vez de contato superficial.',
      current: weeklyGoodReviews,
      target: 24,
      unitLabel: 'reviews',
      rewardPoints: 70,
      accent: 'blue',
    }),
    buildMissionCard({
      id: 'weekly-sharpness',
      cadence: 'weekly',
      title:
        weeklySessions.length > 0 || weeklyCompletedAssignments === 0
          ? 'Fechar 2 sessoes com 80%+'
          : 'Concluir 3 tarefas na semana',
      description:
        weeklySessions.length > 0 || weeklyCompletedAssignments === 0
          ? 'A semana fica forte quando o nivel de precisao aparece mais de uma vez.'
          : 'Se a semana estiver mais leve em sessoes, o foco vira nao deixar tarefa aberta.',
      current:
        weeklySessions.length > 0 || weeklyCompletedAssignments === 0
          ? weeklyStrongSessions
          : weeklyCompletedAssignments,
      target: weeklySessions.length > 0 || weeklyCompletedAssignments === 0 ? 2 : 3,
      unitLabel: weeklySessions.length > 0 || weeklyCompletedAssignments === 0 ? 'sessoes' : 'tarefas',
      rewardPoints: 55,
      accent: 'amber',
    }),
  ]

  const completedDaily = daily.filter((mission) => mission.completed).length
  const completedWeekly = weekly.filter((mission) => mission.completed).length
  const missionPoints =
    [...daily, ...weekly]
      .filter((mission) => mission.completed)
      .reduce((sum, mission) => sum + mission.rewardPoints, 0)
  const dailyBundleUnlocked = completedDaily === daily.length
  const weeklyBundleUnlocked = completedWeekly === weekly.length
  const dailyBundleLabel = 'Ritual do dia'
  const weeklyBundleLabel = 'Semana blindada'
  const bonusPoints = (dailyBundleUnlocked ? 40 : 0) + (weeklyBundleUnlocked ? 100 : 0)
  const totalRewardPoints = missionPoints + bonusPoints
  const rewardTiers = [
    { label: 'Aquecimento', threshold: 0 },
    { label: 'Ritmo forte', threshold: 90 },
    { label: 'Tracao', threshold: 190 },
    { label: 'Elite operacional', threshold: 320 },
  ]
  const rewardTier =
    [...rewardTiers].reverse().find((tier) => totalRewardPoints >= tier.threshold)?.label ||
    rewardTiers[0].label
  const nextTier = rewardTiers.find((tier) => tier.threshold > totalRewardPoints) || null

  return {
    daily,
    weekly,
    completedDaily,
    completedWeekly,
    totalDaily: daily.length,
    totalWeekly: weekly.length,
    missionPoints,
    bonusPoints,
    totalRewardPoints,
    dailyBundleUnlocked,
    weeklyBundleUnlocked,
    dailyBundleLabel,
    weeklyBundleLabel,
    rewardTier,
    nextTierLabel: nextTier?.label || null,
    nextTierRemaining: nextTier ? nextTier.threshold - totalRewardPoints : null,
  }
}
