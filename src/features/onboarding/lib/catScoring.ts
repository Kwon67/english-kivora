import {
  CAT_CONVERGENCE_STREAK,
  CAT_LEVELS,
  CAT_MAX_QUESTIONS,
  catLevelIndex,
  clampCatLevelIndex,
  type CatLevel,
  type StudyExperience,
} from '@/features/onboarding/lib/catLevels'

export type CatAnswerRecord = {
  cardId: string
  packId: string
  packLevel: CatLevel
  correct: boolean
}

export type CatSessionState = {
  focusLevel: CatLevel
  position: number
  stepSize: number
  answers: CatAnswerRecord[]
  shownCardIds: string[]
  streakPackLevel: CatLevel | null
  streakCount: number
  finished: boolean
  converged: boolean
}

export type CatEstimate = {
  level: CatLevel
  atCeiling: boolean
  displayLabel: string
  confidence: number
}

function initialFocusLevel(studyExperience?: StudyExperience | null): CatLevel {
  if (studyExperience === 'less_than_1_year') return 'A1'
  if (studyExperience === 'more_than_3_years') return 'A2'
  return 'A2'
}

export function createCatSession(studyExperience?: StudyExperience | null): CatSessionState {
  const focusLevel = initialFocusLevel(studyExperience)
  return {
    focusLevel,
    position: catLevelIndex(focusLevel),
    stepSize: 1,
    answers: [],
    shownCardIds: [],
    streakPackLevel: null,
    streakCount: 0,
    finished: false,
    converged: false,
  }
}

function isConsistentStreak(answers: CatAnswerRecord[], packLevel: CatLevel): boolean {
  const streak = answers
    .slice(-CAT_CONVERGENCE_STREAK)
    .filter((answer) => answer.packLevel === packLevel)

  if (streak.length < CAT_CONVERGENCE_STREAK) return false

  const allCorrect = streak.every((answer) => answer.correct)
  const allWrong = streak.every((answer) => !answer.correct)
  return allCorrect || allWrong
}

export function recordCatAnswer(
  state: CatSessionState,
  answer: CatAnswerRecord
): CatSessionState {
  const answers = [...state.answers, answer]
  const shownCardIds = [...state.shownCardIds, answer.cardId]

  const streakPackLevel = answer.packLevel
  const streakCount =
    state.streakPackLevel === answer.packLevel ? state.streakCount + 1 : 1

  const direction = answer.correct ? state.stepSize : -state.stepSize
  const position = Math.max(0, Math.min(CAT_LEVELS.length - 1, state.position + direction))
  const focusLevel = clampCatLevelIndex(position)
  const stepSize = Math.max(0.25, state.stepSize / 2)

  const converged =
    streakCount >= CAT_CONVERGENCE_STREAK &&
    isConsistentStreak(answers, answer.packLevel)

  const reachedMax = answers.length >= CAT_MAX_QUESTIONS
  const finished = converged || reachedMax

  return {
    focusLevel,
    position,
    stepSize,
    answers,
    shownCardIds,
    streakPackLevel,
    streakCount,
    finished,
    converged,
  }
}

export function estimateCatLevel(
  answers: CatAnswerRecord[],
  options?: { abandoned?: boolean }
): CatEstimate {
  if (answers.length === 0) {
    return {
      level: 'A2',
      atCeiling: false,
      displayLabel: 'A2',
      confidence: 30,
    }
  }

  const stats = new Map<CatLevel, { correct: number; total: number }>()
  for (const level of CAT_LEVELS) {
    stats.set(level, { correct: 0, total: 0 })
  }

  for (const answer of answers) {
    const band = stats.get(answer.packLevel)!
    band.total += 1
    if (answer.correct) band.correct += 1
  }

  let level: CatLevel = 'A1'
  for (const band of CAT_LEVELS) {
    const bandStats = stats.get(band)!
    if (bandStats.total === 0) continue
    if (bandStats.correct / bandStats.total >= 0.5) {
      level = band
    }
  }

  const b1Stats = stats.get('B1')!
  const b1Accuracy = b1Stats.total > 0 ? b1Stats.correct / b1Stats.total : 0
  const recentB1 = answers.slice(-CAT_CONVERGENCE_STREAK)
  const recentB1Streak =
    recentB1.length === CAT_CONVERGENCE_STREAK &&
    recentB1.every((answer) => answer.packLevel === 'B1' && answer.correct)

  const atCeiling = level === 'B1' && (b1Accuracy >= 0.67 || recentB1Streak)
  const displayLabel = atCeiling ? 'B1+' : level

  const totalCorrect = answers.filter((answer) => answer.correct).length
  const overallAccuracy = totalCorrect / answers.length
  const levelStats = stats.get(level)!
  const levelAccuracy = levelStats.total > 0 ? levelStats.correct / levelStats.total : 0
  const volumeFactor = Math.min(1, answers.length / CAT_MAX_QUESTIONS)

  let confidence = Math.round(
    Math.min(92, overallAccuracy * 45 + levelAccuracy * 30 + volumeFactor * 25)
  )

  if (options?.abandoned) {
    confidence = Math.max(25, confidence - 15)
  }

  if (atCeiling) {
    confidence = Math.min(confidence, 82)
  }

  return {
    level,
    atCeiling,
    displayLabel,
    confidence,
  }
}

export function isCatSessionComplete(state: CatSessionState): boolean {
  return state.finished || state.answers.length >= CAT_MAX_QUESTIONS
}