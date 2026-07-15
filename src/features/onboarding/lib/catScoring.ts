import {
  CAT_CONVERGENCE_STREAK,
  CAT_LEVELS,
  CAT_MAX_QUESTIONS,
  CAT_MIN_QUESTIONS,
  catLevelIndex,
  clampCatLevelIndex,
  type CatLevel,
  type StudyExperience,
} from '@/features/onboarding/lib/catLevels'
import type { CatQuestionDirection } from '@/features/onboarding/lib/catPool'

export type CatAnswerRecord = {
  cardId: string
  packId: string
  packLevel: CatLevel
  correct: boolean
  direction?: CatQuestionDirection
  responseTimeMs?: number
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
    answers.length >= CAT_MIN_QUESTIONS &&
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
    const minimumEvidence = options?.abandoned || band === 'A1' ? 1 : 2
    if (
      bandStats.total >= minimumEvidence &&
      bandStats.correct / bandStats.total >= 0.6
    ) {
      level = band
    }
  }

  const b2Stats = stats.get('B2')!
  const b2Accuracy = b2Stats.total > 0 ? b2Stats.correct / b2Stats.total : 0
  const recentB2 = answers.slice(-CAT_CONVERGENCE_STREAK)
  const recentB2Streak =
    recentB2.length === CAT_CONVERGENCE_STREAK &&
    recentB2.every((answer) => answer.packLevel === 'B2' && answer.correct)

  const atCeiling = level === 'B2' && (b2Accuracy >= 0.67 || recentB2Streak)
  const displayLabel = atCeiling ? 'B2+' : level

  const volumeFactor = Math.min(1, answers.length / CAT_MAX_QUESTIONS)
  const testedBands = [...stats.values()].filter((band) => band.total > 0)
  const coverageFactor = testedBands.length / CAT_LEVELS.length
  const directionFactor = Math.min(
    1,
    new Set(
      answers.map((answer) => answer.direction ?? 'english-to-portuguese')
    ).size / 2
  )
  const consistencyFactor =
    testedBands.reduce((total, band) => {
      const accuracy = band.correct / band.total
      return total + Math.abs(accuracy - 0.5) * 2
    }, 0) / testedBands.length

  let confidence = Math.round(
    Math.min(
      94,
      30 + volumeFactor * 35 + coverageFactor * 10 + directionFactor * 10 + consistencyFactor * 15
    )
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
