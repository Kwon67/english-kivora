import {
  getNextLearnerLevel,
  getCefrLevelWeight,
  LEARNER_CEFR_LEVELS,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'

export type PracticeSkill = 'retrieval' | 'listening' | 'speaking' | 'writing'
export type PracticeScore = { correct: number; total: number }
export type LevelScore = PracticeScore & {
  cards?: string[]
  packs?: string[]
  days?: string[]
  skills?: Partial<Record<PracticeSkill, PracticeScore>>
  /** Retry protection. Evidence describes practice, never a certified CEFR assessment. */
  evidenceIds?: string[]
}
export type LevelScores = Partial<Record<LearnerCefrLevel, LevelScore>> & {
  placement?: { level: LearnerCefrLevel; confidence: number }
}
export type CefrEstimate = {
  estimatedLevel: LearnerCefrLevel | null
  confidence: number
  totalInteractions: number
  assessing: boolean
  nextLevel: LearnerCefrLevel | null
  progressToNext: number | null
}
export type PracticeEvidence = {
  cardId?: string
  cardIds?: string[]
  packId?: string
  gameMode?: string
  evidenceId?: string
  date?: string
}

type AdvanceRule = {
  minAttempts: number
  minAccuracy: number
  cards: number
  packs: number
  days: number
  skillAttempts: number
  writing: boolean
}
const MIN_INTERACTIONS_TO_DETECT = 12
const ADVANCE_RULES: Record<LearnerCefrLevel, AdvanceRule> = {
  A1: { minAttempts: 12, minAccuracy: 0.55, cards: 8, packs: 1, days: 2, skillAttempts: 3, writing: false },
  A2: { minAttempts: 30, minAccuracy: 0.7, cards: 16, packs: 2, days: 3, skillAttempts: 5, writing: false },
  B1: { minAttempts: 50, minAccuracy: 0.72, cards: 24, packs: 3, days: 5, skillAttempts: 8, writing: true },
  B2: { minAttempts: 80, minAccuracy: 0.75, cards: 32, packs: 4, days: 7, skillAttempts: 12, writing: true },
  C1: { minAttempts: 120, minAccuracy: 0.8, cards: 40, packs: 5, days: 10, skillAttempts: 18, writing: true },
  C2: { minAttempts: 180, minAccuracy: 0.85, cards: 50, packs: 6, days: 14, skillAttempts: 25, writing: true },
}

function count(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}
function accuracy(score: PracticeScore | undefined): number {
  return score && count(score.total) > 0 ? Math.min(1, count(score.correct) / count(score.total)) : 0
}
function ratio(value: number, target: number): number {
  return Math.min(1, value / target)
}
function skillForMode(mode: string | undefined): PracticeSkill | null {
  if (mode === 'listening') return 'listening'
  if (mode === 'speaking') return 'speaking'
  if (mode === 'typing' || mode === 'sentence_build') return 'writing'
  if (mode === 'multiple_choice' || mode === 'matching' || mode === 'reading') return 'retrieval'
  // A revealed flashcard or a self-reported SRS grade is not independently scored recall.
  return null
}

/** Weakest prerequisite controls readiness: repeatedly seeing one sentence cannot unlock a band. */
export function getLevelPracticeReadiness(level: LearnerCefrLevel, scores: LevelScores): number {
  const score = scores[level]
  const rule = ADVANCE_RULES[level]
  if (!score) return 0
  const skills: PracticeSkill[] = ['retrieval', 'listening', 'speaking', ...(rule.writing ? ['writing' as const] : [])]
  const parts = [
    ratio(count(score.total), rule.minAttempts),
    ratio(accuracy(score), rule.minAccuracy),
    ratio(new Set(score.cards ?? []).size, rule.cards),
    ratio(new Set(score.packs ?? []).size, rule.packs),
    ratio(new Set(score.days ?? []).size, rule.days),
    ...skills.flatMap((skill) => [
      ratio(count(score.skills?.[skill]?.total), rule.skillAttempts),
      ratio(accuracy(score.skills?.[skill]), rule.minAccuracy),
    ]),
  ]
  return Math.round(Math.min(...parts) * 100)
}

function hasMastery(level: LearnerCefrLevel, scores: LevelScores): boolean {
  return getLevelPracticeReadiness(level, scores) === 100
}

export function estimateUserLevel(
  scores: LevelScores,
  totalInteractions: number,
  baseline?: { level: LearnerCefrLevel; confidence: number }
): CefrEstimate {
  const total = count(totalInteractions)
  const placement = baseline && (!scores.placement || getCefrLevelWeight(baseline.level) > getCefrLevelWeight(scores.placement.level))
    ? baseline : scores.placement ?? baseline
  let estimatedLevel = placement?.level ?? null

  // Evidence unlocks a study recommendation one band at a time. It does not assert fluency.
  for (const level of LEARNER_CEFR_LEVELS) {
    if (estimatedLevel && getCefrLevelWeight(level) <= getCefrLevelWeight(estimatedLevel)) continue
    if (!hasMastery(level, scores)) break
    estimatedLevel = level
  }

  // Historical aggregate data can establish the conservative entry band only.
  if (!estimatedLevel && total >= MIN_INTERACTIONS_TO_DETECT && count(scores.A1?.total) >= 8 && accuracy(scores.A1) >= 0.45) {
    estimatedLevel = 'A1'
  }

  const nextLevel = estimatedLevel ? getNextLearnerLevel(estimatedLevel) : 'A1'
  const readiness = estimatedLevel ? getLevelPracticeReadiness(estimatedLevel, scores) : 0
  const nextReadiness = nextLevel ? getLevelPracticeReadiness(nextLevel, scores) : 0
  const placementConfidence = placement && placement.level === estimatedLevel ? count(placement.confidence) : 0
  const confidence = estimatedLevel ? Math.min(95, Math.max(placementConfidence, readiness, 30)) : Math.round(ratio(total, MIN_INTERACTIONS_TO_DETECT) * 40)

  return {
    estimatedLevel,
    confidence,
    totalInteractions: total,
    assessing: !estimatedLevel,
    nextLevel,
    // Readiness on the CURRENT band opens a small next-band challenge before there is next-band
    // evidence. Requiring that evidence before unlocking its content caused a progression deadlock.
    progressToNext: nextLevel
      ? estimatedLevel ? Math.round(readiness * 0.7 + nextReadiness * 0.3) : Math.round(ratio(total, MIN_INTERACTIONS_TO_DETECT) * 100)
      : null,
  }
}

export function mergeLevelScores(
  current: LevelScores,
  level: LearnerCefrLevel,
  correct: number,
  total: number,
  evidence?: PracticeEvidence
): { scores: LevelScores; totalInteractions: number } {
  const existing = current[level] ?? { correct: 0, total: 0 }
  const evidenceId = evidence?.evidenceId
  if (evidenceId && existing.evidenceIds?.includes(evidenceId)) return { scores: current, totalInteractions: 0 }
  const safeTotal = Math.min(500, count(total))
  const safeCorrect = Math.min(safeTotal, count(correct))
  const unique = (previous: string[] | undefined, incoming: string[], max: number) =>
    [...new Set([...(previous ?? []), ...incoming.filter(Boolean)])].slice(-max)
  const skill = skillForMode(evidence?.gameMode)
  const skills = { ...existing.skills }
  if (skill) {
    const previous = skills[skill] ?? { correct: 0, total: 0 }
    skills[skill] = { correct: count(previous.correct) + safeCorrect, total: count(previous.total) + safeTotal }
  }
  const cards = evidence?.cardIds ?? (evidence?.cardId ? [evidence.cardId] : [])
  return {
    scores: {
      ...current,
      [level]: {
        ...existing,
        correct: count(existing.correct) + safeCorrect,
        total: count(existing.total) + safeTotal,
        // Only scored exercises establish breadth; SRS still contributes retention statistics.
        cards: unique(existing.cards, skill ? cards.slice(0, safeTotal) : [], 500),
        packs: unique(existing.packs, skill && evidence?.packId ? [evidence.packId] : [], 100),
        days: unique(existing.days, skill ? [evidence?.date ?? new Date().toISOString().slice(0, 10)] : [], 90),
        skills,
        evidenceIds: unique(existing.evidenceIds, evidenceId ? [evidenceId] : [], 1000),
      },
    },
    totalInteractions: safeTotal,
  }
}
