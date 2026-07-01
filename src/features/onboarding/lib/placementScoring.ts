import {
  getCefrLevelWeight,
  LEARNER_CEFR_LEVELS,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import {
  getPlacementItemById,
  PLACEMENT_ITEMS,
  PLACEMENT_MAX_QUESTIONS,
  type PlacementItem,
} from '@/features/onboarding/lib/placementItems'

export type PlacementAnswerRecord = {
  itemId: string
  level: LearnerCefrLevel
  correct: boolean
}

export type PlacementEstimate = {
  level: LearnerCefrLevel
  confidence: number
}

export type PlacementSessionState = {
  answers: PlacementAnswerRecord[]
  shownItemIds: string[]
  focusLevel: LearnerCefrLevel
  finished: boolean
}

function levelIndex(level: LearnerCefrLevel): number {
  return LEARNER_CEFR_LEVELS.indexOf(level)
}

function shiftLevel(level: LearnerCefrLevel, delta: number): LearnerCefrLevel {
  const index = levelIndex(level)
  const next = Math.max(0, Math.min(LEARNER_CEFR_LEVELS.length - 1, index + delta))
  return LEARNER_CEFR_LEVELS[next]
}

export function createPlacementSession(): PlacementSessionState {
  return {
    answers: [],
    shownItemIds: [],
    focusLevel: 'A2',
    finished: false,
  }
}

function getPlacementPool(dynamicItems: PlacementItem[] = []): PlacementItem[] {
  return [...PLACEMENT_ITEMS, ...dynamicItems]
}

function pickItemForLevel(
  level: LearnerCefrLevel,
  shownItemIds: Set<string>,
  pool: PlacementItem[]
): PlacementItem | null {
  const candidates = pool.filter((item) => item.level === level && !shownItemIds.has(item.id))
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function getNextPlacementItem(
  state: PlacementSessionState,
  options?: { dynamicItems?: PlacementItem[] }
): PlacementItem | null {
  if (state.finished || state.answers.length >= PLACEMENT_MAX_QUESTIONS) {
    return null
  }

  const pool = getPlacementPool(options?.dynamicItems)
  const shown = new Set(state.shownItemIds)
  let targetLevel = state.focusLevel

  for (let attempt = 0; attempt < LEARNER_CEFR_LEVELS.length; attempt += 1) {
    const item = pickItemForLevel(targetLevel, shown, pool)
    if (item) return item

    const fallbackIndex = (levelIndex(targetLevel) + attempt + 1) % LEARNER_CEFR_LEVELS.length
    targetLevel = LEARNER_CEFR_LEVELS[fallbackIndex]
  }

  const remaining = pool.find((item) => !shown.has(item.id))
  return remaining ?? null
}

export function recordPlacementAnswer(
  state: PlacementSessionState,
  itemId: string,
  selectedIndex: number,
  options?: { dynamicItems?: PlacementItem[] }
): PlacementSessionState {
  const item = getPlacementItemById(itemId, options?.dynamicItems)
  if (!item) return state

  const correct = selectedIndex === item.correctIndex
  const answers = [
    ...state.answers,
    { itemId, level: item.level, correct },
  ]

  const focusLevel = correct ? shiftLevel(item.level, 1) : shiftLevel(item.level, -1)
  const finished = answers.length >= PLACEMENT_MAX_QUESTIONS

  return {
    answers,
    shownItemIds: [...state.shownItemIds, itemId],
    focusLevel,
    finished,
  }
}

export function estimatePlacementLevel(answers: PlacementAnswerRecord[]): PlacementEstimate {
  if (answers.length === 0) {
    return { level: 'A2', confidence: 40 }
  }

  const bandStats = new Map<LearnerCefrLevel, { correct: number; total: number }>()
  for (const level of LEARNER_CEFR_LEVELS) {
    bandStats.set(level, { correct: 0, total: 0 })
  }

  for (const answer of answers) {
    const stats = bandStats.get(answer.level)!
    stats.total += 1
    if (answer.correct) stats.correct += 1
  }

  let estimated: LearnerCefrLevel = 'A1'
  for (const level of LEARNER_CEFR_LEVELS) {
    const stats = bandStats.get(level)!
    if (stats.total === 0) continue
    const accuracy = stats.correct / stats.total
    if (accuracy >= 0.5) {
      estimated = level
    }
  }

  const estimatedStats = bandStats.get(estimated)!
  const estimatedAccuracy =
    estimatedStats.total > 0 ? estimatedStats.correct / estimatedStats.total : 0

  const harderLevel = shiftLevel(estimated, 1)
  const harderStats = bandStats.get(harderLevel)!
  if (
    harderStats.total > 0 &&
    harderStats.correct / harderStats.total >= 0.66 &&
    getCefrLevelWeight(harderLevel) > getCefrLevelWeight(estimated)
  ) {
    estimated = harderLevel
  }

  const totalCorrect = answers.filter((answer) => answer.correct).length
  const overallAccuracy = totalCorrect / answers.length
  const volumeFactor = Math.min(1, answers.length / PLACEMENT_MAX_QUESTIONS)
  const confidence = Math.round(
    Math.min(100, Math.max(35, overallAccuracy * 55 + estimatedAccuracy * 25 + volumeFactor * 20))
  )

  return { level: estimated, confidence }
}

export function isPlacementSessionComplete(state: PlacementSessionState): boolean {
  return state.finished || state.answers.length >= PLACEMENT_MAX_QUESTIONS
}