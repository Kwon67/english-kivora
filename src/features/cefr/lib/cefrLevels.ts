export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CefrLevel = (typeof CEFR_LEVELS)[number]

/** Levels surfaced to learners in the adaptive engine (product scope). */
export const LEARNER_CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const
export type LearnerCefrLevel = (typeof LEARNER_CEFR_LEVELS)[number]

export const CEFR_LEVEL_LABELS: Record<CefrLevel, string> = {
  A1: 'Iniciante',
  A2: 'Básico',
  B1: 'Intermediário',
  B2: 'Intermediário superior',
  C1: 'Avançado',
  C2: 'Proficiente',
}

const LEGACY_PACK_LEVEL_MAP: Record<string, LearnerCefrLevel> = {
  beginner: 'A1',
  easy: 'A2',
  elementary: 'A2',
  intermediate: 'B1',
  medium: 'B1',
  advanced: 'B2',
  hard: 'B2',
}

export function isLearnerCefrLevel(value: string | null | undefined): value is LearnerCefrLevel {
  return LEARNER_CEFR_LEVELS.includes((value || '') as LearnerCefrLevel)
}

export function isCefrLevel(value: string | null | undefined): value is CefrLevel {
  return CEFR_LEVELS.includes((value || '') as CefrLevel)
}

/**
 * Normalizes pack.level from DB (legacy or CEFR) into a learner band.
 * Unknown/null content defaults to A2 (general audience packs).
 */
export function normalizePackLevel(level: string | null | undefined): LearnerCefrLevel {
  if (!level) return 'A2'

  const trimmed = level.trim()
  const upper = trimmed.toUpperCase()

  for (const band of LEARNER_CEFR_LEVELS) {
    if (upper === band || upper.includes(band)) return band
  }

  if (upper === 'C1' || upper === 'C2') return 'B2'

  const legacy = LEGACY_PACK_LEVEL_MAP[trimmed.toLowerCase()]
  if (legacy) return legacy

  return 'A2'
}

export function getCefrLevelLabel(level: LearnerCefrLevel | null | undefined): string {
  if (!level) return 'Em avaliação'
  return CEFR_LEVEL_LABELS[level]
}

export function getCefrLevelWeight(level: LearnerCefrLevel): number {
  return LEARNER_CEFR_LEVELS.indexOf(level) + 1
}

export function getNextLearnerLevel(level: LearnerCefrLevel | null): LearnerCefrLevel | null {
  if (!level) return 'A1'
  const index = LEARNER_CEFR_LEVELS.indexOf(level)
  if (index < 0 || index >= LEARNER_CEFR_LEVELS.length - 1) return null
  return LEARNER_CEFR_LEVELS[index + 1]
}
