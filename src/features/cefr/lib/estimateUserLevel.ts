import {
  getNextLearnerLevel,
  LEARNER_CEFR_LEVELS,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'

export type LevelScore = {
  correct: number
  total: number
}

export type LevelScores = Partial<Record<LearnerCefrLevel, LevelScore>>

export type CefrEstimate = {
  estimatedLevel: LearnerCefrLevel | null
  confidence: number
  totalInteractions: number
  assessing: boolean
  nextLevel: LearnerCefrLevel | null
  progressToNext: number | null
}

const MIN_INTERACTIONS_TO_DETECT = 12

const ADVANCE_RULES: Record<
  LearnerCefrLevel,
  { minAttempts: number; minAccuracy: number; prerequisite?: LearnerCefrLevel; prerequisiteAccuracy?: number; prerequisiteAttempts?: number }
> = {
  A1: { minAttempts: 12, minAccuracy: 0.55 },
  A2: { minAttempts: 20, minAccuracy: 0.68, prerequisite: 'A1', prerequisiteAccuracy: 0.62, prerequisiteAttempts: 15 },
  B1: { minAttempts: 30, minAccuracy: 0.66, prerequisite: 'A2', prerequisiteAccuracy: 0.65, prerequisiteAttempts: 25 },
  B2: { minAttempts: 40, minAccuracy: 0.64, prerequisite: 'B1', prerequisiteAccuracy: 0.63, prerequisiteAttempts: 35 },
}

function getAccuracy(score: LevelScore | undefined): number | null {
  if (!score || score.total <= 0) return null
  return score.correct / score.total
}

function hasMastery(level: LearnerCefrLevel, scores: LevelScores): boolean {
  const rule = ADVANCE_RULES[level]
  const bandScore = scores[level]
  const accuracy = getAccuracy(bandScore)

  if (!bandScore || bandScore.total < rule.minAttempts || accuracy === null) {
    return false
  }

  if (accuracy < rule.minAccuracy) {
    return false
  }

  if (rule.prerequisite) {
    const prereqScore = scores[rule.prerequisite]
    const prereqAccuracy = getAccuracy(prereqScore)
    if (
      !prereqScore ||
      prereqScore.total < (rule.prerequisiteAttempts ?? 0) ||
      prereqAccuracy === null ||
      prereqAccuracy < (rule.prerequisiteAccuracy ?? 1)
    ) {
      return false
    }
  }

  return true
}

function computeConfidence(
  estimatedLevel: LearnerCefrLevel | null,
  scores: LevelScores,
  totalInteractions: number
): number {
  if (!estimatedLevel || totalInteractions < MIN_INTERACTIONS_TO_DETECT) return 0

  const bandScore = scores[estimatedLevel]
  const accuracy = getAccuracy(bandScore) ?? 0
  const rule = ADVANCE_RULES[estimatedLevel]
  const attemptRatio = Math.min(1, (bandScore?.total ?? 0) / rule.minAttempts)
  const accuracyRatio = Math.min(1, accuracy / rule.minAccuracy)
  const volumeFactor = Math.min(1, totalInteractions / 80)

  return Math.round(Math.min(100, (attemptRatio * 35 + accuracyRatio * 40 + volumeFactor * 25)))
}

function computeProgressToNext(
  currentLevel: LearnerCefrLevel,
  nextLevel: LearnerCefrLevel,
  scores: LevelScores
): number {
  const rule = ADVANCE_RULES[nextLevel]
  const bandScore = scores[nextLevel]
  const accuracy = getAccuracy(bandScore) ?? 0
  const attemptProgress = Math.min(1, (bandScore?.total ?? 0) / rule.minAttempts)
  const accuracyProgress = Math.min(1, accuracy / rule.minAccuracy)

  let prereqProgress = 1
  if (rule.prerequisite) {
    const prereqScore = scores[rule.prerequisite]
    const prereqAccuracy = getAccuracy(prereqScore) ?? 0
    const attempts = Math.min(1, (prereqScore?.total ?? 0) / (rule.prerequisiteAttempts ?? 1))
    const acc = Math.min(1, prereqAccuracy / (rule.prerequisiteAccuracy ?? 1))
    prereqProgress = (attempts + acc) / 2
  }

  return Math.round(((attemptProgress + accuracyProgress + prereqProgress) / 3) * 100)
}

export function estimateUserLevel(
  scores: LevelScores,
  totalInteractions: number
): CefrEstimate {
  if (totalInteractions < MIN_INTERACTIONS_TO_DETECT) {
    return {
      estimatedLevel: null,
      confidence: Math.round(Math.min(40, (totalInteractions / MIN_INTERACTIONS_TO_DETECT) * 40)),
      totalInteractions,
      assessing: true,
      nextLevel: 'A1',
      progressToNext: Math.round((totalInteractions / MIN_INTERACTIONS_TO_DETECT) * 100),
    }
  }

  let estimatedLevel: LearnerCefrLevel | null = null

  for (let index = LEARNER_CEFR_LEVELS.length - 1; index >= 0; index -= 1) {
    const level = LEARNER_CEFR_LEVELS[index]
    if (hasMastery(level, scores)) {
      estimatedLevel = level
      break
    }
  }

  if (!estimatedLevel) {
    const a1Accuracy = getAccuracy(scores.A1)
    if ((scores.A1?.total ?? 0) >= 8 && (a1Accuracy ?? 0) >= 0.45) {
      estimatedLevel = 'A1'
    }
  }

  const nextLevel = estimatedLevel ? getNextLearnerLevel(estimatedLevel) : 'A1'
  const confidence = computeConfidence(estimatedLevel, scores, totalInteractions)
  const progressToNext =
    estimatedLevel && nextLevel
      ? computeProgressToNext(estimatedLevel, nextLevel, scores)
      : Math.round((totalInteractions / MIN_INTERACTIONS_TO_DETECT) * 100)

  return {
    estimatedLevel,
    confidence,
    totalInteractions,
    assessing: !estimatedLevel,
    nextLevel,
    progressToNext: nextLevel ? progressToNext : null,
  }
}

export function mergeLevelScores(
  current: LevelScores,
  level: LearnerCefrLevel,
  correct: number,
  total: number
): { scores: LevelScores; totalInteractions: number } {
  const existing = current[level] ?? { correct: 0, total: 0 }
  const safeCorrect = Math.max(0, Math.min(total, correct))
  const safeTotal = Math.max(0, total)

  return {
    scores: {
      ...current,
      [level]: {
        correct: existing.correct + safeCorrect,
        total: existing.total + safeTotal,
      },
    },
    totalInteractions: safeTotal,
  }
}