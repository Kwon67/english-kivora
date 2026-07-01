export const CAT_LEVELS = ['A1', 'A2', 'B1'] as const
export type CatLevel = (typeof CAT_LEVELS)[number]

export const CAT_MIN_QUESTIONS = 12
export const CAT_MAX_QUESTIONS = 15
export const CAT_CONVERGENCE_STREAK = 3

export const STUDY_EXPERIENCE_OPTIONS = [
  { id: 'less_than_1_year', label: 'Menos de 1 ano' },
  { id: '1_3_years', label: 'Entre 1 e 3 anos' },
  { id: 'more_than_3_years', label: 'Mais de 3 anos' },
] as const

export type StudyExperience = (typeof STUDY_EXPERIENCE_OPTIONS)[number]['id']

export function isStudyExperience(value: string | null | undefined): value is StudyExperience {
  return STUDY_EXPERIENCE_OPTIONS.some((option) => option.id === value)
}

export function isCatLevel(value: string | null | undefined): value is CatLevel {
  return CAT_LEVELS.includes((value || '') as CatLevel)
}

export function catLevelIndex(level: CatLevel): number {
  return CAT_LEVELS.indexOf(level)
}

export function clampCatLevelIndex(index: number): CatLevel {
  const clamped = Math.max(0, Math.min(CAT_LEVELS.length - 1, Math.round(index)))
  return CAT_LEVELS[clamped]
}