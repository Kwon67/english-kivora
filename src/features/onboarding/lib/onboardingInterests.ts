export const ONBOARDING_DAILY_GOALS = [5, 10, 15] as const
export type OnboardingDailyGoalMinutes = (typeof ONBOARDING_DAILY_GOALS)[number]

export const ONBOARDING_INTEREST_OPTIONS = [
  {
    id: 'travel',
    label: 'Viagem',
    keywords: ['travel', 'viagem', 'airport', 'hotel', 'turismo', 'trip'],
  },
  {
    id: 'work',
    label: 'Trabalho',
    keywords: ['work', 'business', 'trabalho', 'office', 'pec', 'career', 'meeting'],
  },
  {
    id: 'grammar',
    label: 'Gramática',
    keywords: ['grammar', 'gramática', 'verb', 'tense', 'syntax', 'estrutura'],
  },
  {
    id: 'conversation',
    label: 'Conversação',
    keywords: ['conversation', 'speaking', 'dialogue', 'chat', 'fala', 'oral'],
  },
  {
    id: 'exam',
    label: 'Provas',
    keywords: ['exam', 'toefl', 'ielts', 'cert', 'prova', 'test'],
  },
  {
    id: 'culture',
    label: 'Cultura & mídia',
    keywords: ['culture', 'media', 'movie', 'music', 'série', 'filme'],
  },
] as const

export type OnboardingInterestId = (typeof ONBOARDING_INTEREST_OPTIONS)[number]['id']

const VALID_INTEREST_IDS = new Set<string>(ONBOARDING_INTEREST_OPTIONS.map((item) => item.id))

export function isOnboardingInterestId(value: string): value is OnboardingInterestId {
  return VALID_INTEREST_IDS.has(value)
}

export function getOnboardingInterestLabel(id: string): string {
  return ONBOARDING_INTEREST_OPTIONS.find((item) => item.id === id)?.label ?? id
}

export function normalizeOnboardingInterests(values: string[]): OnboardingInterestId[] {
  const unique = new Set<OnboardingInterestId>()
  for (const value of values) {
    if (isOnboardingInterestId(value)) {
      unique.add(value)
    }
  }
  return [...unique]
}

export function getDailyGoalLabel(minutes: OnboardingDailyGoalMinutes): string {
  if (minutes === 5) return 'Leve — 5 min/dia'
  if (minutes === 10) return 'Equilibrado — 10 min/dia'
  return 'Intenso — 15 min/dia'
}