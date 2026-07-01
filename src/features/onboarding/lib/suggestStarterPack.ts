import {
  getCefrLevelWeight,
  normalizePackLevel,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import {
  ONBOARDING_INTEREST_OPTIONS,
  type OnboardingInterestId,
} from '@/features/onboarding/lib/onboardingInterests'

export type StarterPackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  category: string | null
  cover_url: string | null
}

export type RankedStarterPack = StarterPackRow & {
  score: number
  matchReason: string
}

function levelMatchScore(packLevel: LearnerCefrLevel, targetLevel: LearnerCefrLevel): number {
  const packWeight = getCefrLevelWeight(packLevel)
  const targetWeight = getCefrLevelWeight(targetLevel)
  const distance = Math.abs(packWeight - targetWeight)

  if (distance === 0) return 12
  if (distance === 1) return 7
  if (distance === 2) return 3
  return 0
}

function interestMatchScore(
  pack: StarterPackRow,
  interests: OnboardingInterestId[]
): { score: number; reason: string | null } {
  const haystack = [pack.name, pack.description, pack.category]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  let score = 0
  let topReason: string | null = null

  for (const interestId of interests) {
    const option = ONBOARDING_INTEREST_OPTIONS.find((item) => item.id === interestId)
    if (!option) continue

    const matched = option.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
    if (!matched) continue

    score += 8
    if (!topReason) {
      topReason = option.label
    }
  }

  return { score, reason: topReason }
}

export function rankStarterPacks(
  packs: StarterPackRow[],
  input: {
    level: LearnerCefrLevel
    interests: OnboardingInterestId[]
  }
): RankedStarterPack[] {
  const ranked = packs.map((pack) => {
    const packLevel = normalizePackLevel(pack.level)
    const levelScore = levelMatchScore(packLevel, input.level)
    const interestResult = interestMatchScore(pack, input.interests)
    const descriptionBonus = pack.description?.trim() ? 1 : 0

    const score = levelScore + interestResult.score + descriptionBonus
    const matchReason =
      interestResult.reason != null
        ? `Combina com ${interestResult.reason}`
        : levelScore >= 12
          ? `No seu nível ${input.level}`
          : 'Boa porta de entrada'

    return {
      ...pack,
      score,
      matchReason,
    }
  })

  ranked.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score
    return left.name.localeCompare(right.name, 'pt-BR')
  })

  return ranked
}

export function pickStarterPack(
  packs: StarterPackRow[],
  input: {
    level: LearnerCefrLevel
    interests: OnboardingInterestId[]
  }
): RankedStarterPack | null {
  const ranked = rankStarterPacks(packs, input)
  return ranked[0] ?? null
}