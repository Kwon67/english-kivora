import type { SupabaseClient } from '@supabase/supabase-js'
import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import type {
  LearningFocus,
  LearningProfileInput,
  LearningProfilePlan,
} from '@/features/learning-profile/lib/learningProfile'
import type { Database, Json } from '@/types/database.types'

type TypedSupabaseClient = SupabaseClient<Database>

export type LearningPlanOutcomeStatus = 'pending' | 'engaged' | 'improved' | 'stalled'

export type LearningPlanHistoryItem = {
  planDate: string
  stage: LearningFocus
  level: LearnerCefrLevel | null
  resourceIds: string[]
  outcomeStatus: LearningPlanOutcomeStatus
}

export type LearningPlanMemory = {
  recentPlans: LearningPlanHistoryItem[]
  recentOpenedResourceIds: string[]
}

type LearningPlanHistoryRow = {
  id: string
  plan_date: string
  stage: string
  level: string | null
  resource_ids: string[]
  outcome_status: string
  created_at: string
  metrics: Json
}

type LearningResourceEventRow = {
  resource_id: string
  created_at: string
}

type LearningPlanMetrics = {
  reviewTotalDue: number
  reviewBacklogDue: number
  problemWordsCount: number
  pendingAssignmentsCount: number
  completedReviewsToday: number
  totalReviews: number
}

const LEARNING_FOCUS_VALUES = new Set<LearningFocus>([
  'diagnostic',
  'vocabulary',
  'srs-repair',
  'listening',
  'shadowing',
  'reading',
  'fluency',
])

function isLearningFocus(value: string): value is LearningFocus {
  return LEARNING_FOCUS_VALUES.has(value as LearningFocus)
}

function isLearnerLevel(value: string | null): value is LearnerCefrLevel {
  return value === 'A1' || value === 'A2' || value === 'B1' || value === 'B2'
}

function isLearningTableMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false
  return (
    error.code === '42P01' ||
    /learning_plan_history|learning_resource_events/i.test(error.message || '')
  )
}

function metricsFromInput(input: LearningProfileInput): LearningPlanMetrics {
  return {
    reviewTotalDue: input.reviewStats.totalDue,
    reviewBacklogDue: input.reviewStats.totalBacklogDue,
    problemWordsCount: input.problemWordsCount,
    pendingAssignmentsCount: input.pendingAssignmentsCount,
    completedReviewsToday: input.completedReviewsToday,
    totalReviews: input.reviewStats.totalReviews,
  }
}

function parseMetrics(value: Json): Partial<LearningPlanMetrics> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Partial<LearningPlanMetrics>
}

function hasImproved(previous: Partial<LearningPlanMetrics>, current: LearningPlanMetrics) {
  if (
    typeof previous.reviewBacklogDue === 'number' &&
    current.reviewBacklogDue < previous.reviewBacklogDue
  ) {
    return true
  }

  if (
    typeof previous.problemWordsCount === 'number' &&
    current.problemWordsCount < previous.problemWordsCount
  ) {
    return true
  }

  if (
    typeof previous.reviewTotalDue === 'number' &&
    previous.reviewTotalDue > 0 &&
    current.completedReviewsToday > 0
  ) {
    return true
  }

  return false
}

function normalizeHistoryRow(row: LearningPlanHistoryRow): LearningPlanHistoryItem | null {
  if (!isLearningFocus(row.stage)) return null

  return {
    planDate: row.plan_date,
    stage: row.stage,
    level: isLearnerLevel(row.level) ? row.level : null,
    resourceIds: Array.isArray(row.resource_ids) ? row.resource_ids : [],
    outcomeStatus: isOutcomeStatus(row.outcome_status) ? row.outcome_status : 'pending',
  }
}

function isOutcomeStatus(value: string): value is LearningPlanOutcomeStatus {
  return value === 'pending' || value === 'engaged' || value === 'improved' || value === 'stalled'
}

export async function getLearningPlanMemory(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<LearningPlanMemory> {
  const [historyResult, eventsResult] = await Promise.all([
    supabase
      .from('learning_plan_history')
      .select('id,plan_date,stage,level,resource_ids,outcome_status,created_at,metrics')
      .eq('user_id', userId)
      .order('plan_date', { ascending: false })
      .limit(7),
    supabase
      .from('learning_resource_events')
      .select('resource_id,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  if (historyResult.error && !isLearningTableMissing(historyResult.error)) {
    console.error('Failed to load learning plan history', { userId, error: historyResult.error })
  }

  if (eventsResult.error && !isLearningTableMissing(eventsResult.error)) {
    console.error('Failed to load learning resource memory', { userId, error: eventsResult.error })
  }

  const recentPlans = historyResult.error
    ? []
    : ((historyResult.data ?? []) as LearningPlanHistoryRow[])
      .map(normalizeHistoryRow)
      .filter((item): item is LearningPlanHistoryItem => Boolean(item))

  const recentOpenedResourceIds = eventsResult.error
    ? []
    : Array.from(new Set(((eventsResult.data ?? []) as LearningResourceEventRow[]).map((event) => event.resource_id)))

  return {
    recentPlans,
    recentOpenedResourceIds,
  }
}

async function updatePreviousPlanOutcome(
  supabase: TypedSupabaseClient,
  userId: string,
  planDate: string,
  currentMetrics: LearningPlanMetrics
) {
  const { data: previous, error } = await supabase
    .from('learning_plan_history')
    .select('id,plan_date,stage,level,resource_ids,outcome_status,created_at,metrics')
    .eq('user_id', userId)
    .lt('plan_date', planDate)
    .order('plan_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (!isLearningTableMissing(error)) {
      console.error('Failed to load previous learning plan outcome', { userId, error })
    }
    return
  }

  const previousRow = previous as LearningPlanHistoryRow | null
  if (!previousRow || previousRow.outcome_status !== 'pending') return

  const { data: events, error: eventsError } = await supabase
    .from('learning_resource_events')
    .select('resource_id,created_at')
    .eq('user_id', userId)
    .gte('created_at', previousRow.created_at)
    .limit(50)

  if (eventsError) {
    if (!isLearningTableMissing(eventsError)) {
      console.error('Failed to load learning resource events for outcome', { userId, eventsError })
    }
    return
  }

  const openedResourceIds = new Set(
    ((events ?? []) as LearningResourceEventRow[]).map((event) => event.resource_id)
  )
  const openedRecommended = previousRow.resource_ids.some((resourceId) => openedResourceIds.has(resourceId))
  const previousMetrics = parseMetrics(previousRow.metrics)
  const improved = hasImproved(previousMetrics, currentMetrics)
  const outcomeStatus: LearningPlanOutcomeStatus = openedRecommended
    ? 'engaged'
    : improved
      ? 'improved'
      : 'stalled'
  const outcomeNotes = [
    openedRecommended ? 'Abriu recurso recomendado' : null,
    improved ? 'Indicadores melhoraram após o plano' : null,
    !openedRecommended && !improved ? 'Sem abertura de recurso ou melhora detectada' : null,
  ].filter((note): note is string => Boolean(note))

  const { error: updateError } = await supabase
    .from('learning_plan_history')
    .update({
      outcome_status: outcomeStatus,
      outcome_notes: outcomeNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', previousRow.id)

  if (updateError && !isLearningTableMissing(updateError)) {
    console.error('Failed to update learning plan outcome', { userId, updateError })
  }
}

export async function recordLearningPlanSnapshot(
  supabase: TypedSupabaseClient,
  userId: string,
  planDate: string,
  plan: LearningProfilePlan,
  input: LearningProfileInput
) {
  const metrics = metricsFromInput(input)
  await updatePreviousPlanOutcome(supabase, userId, planDate, metrics)

  const { error } = await supabase.from('learning_plan_history').upsert(
    {
      user_id: userId,
      plan_date: planDate,
      stage: plan.stage,
      level: plan.level,
      headline: plan.headline,
      primary_action_id: plan.primaryAction.id,
      primary_action_href: plan.primaryAction.href,
      resource_ids: plan.resources.map((resource) => resource.id),
      signals: plan.signals,
      metrics,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,plan_date' }
  )

  if (error && !isLearningTableMissing(error)) {
    console.error('Failed to record learning plan snapshot', { userId, error })
  }
}
