import { isPlayableAssignmentGameMode, PLAYABLE_GAME_MODES } from '@/features/review/lib/reviewSchedules'
import type { GameMode } from '@/types/database.types'

/** Default review path when the learner is not struggling in any specific mode. */
export const NORMAL_REVIEW_MODES: GameMode[] = ['flashcard', 'speaking', 'typing']

const REVIEW_MODE_ORDER: GameMode[] = PLAYABLE_GAME_MODES

export function normalizeWeakModes(modes: Iterable<string>): GameMode[] {
  const unique = new Set<GameMode>()
  for (const mode of modes) {
    if (!isPlayableAssignmentGameMode(mode) || mode === 'flashcard') continue
    unique.add(mode)
  }
  return REVIEW_MODE_ORDER.filter((mode) => unique.has(mode))
}

/**
 * Picks the review modes for a card.
 * - No weak modes → flashcard + speaking + typing
 * - Has weak modes → flashcard + each mode where the learner recently erred
 */
export function resolveReviewModesForCard(weakModes: Iterable<string>): GameMode[] {
  const normalizedWeak = normalizeWeakModes(weakModes)
  if (normalizedWeak.length === 0) {
    return [...NORMAL_REVIEW_MODES]
  }

  const tailModes = REVIEW_MODE_ORDER.filter(
    (mode) => mode !== 'flashcard' && normalizedWeak.includes(mode)
  )
  return ['flashcard', ...tailModes]
}

export function getReviewModeLabel(mode: GameMode) {
  switch (mode) {
    case 'multiple_choice':
      return 'Múltipla escolha'
    case 'flashcard':
      return 'Flashcard'
    case 'typing':
      return 'Digitação'
    case 'matching':
      return 'Combinação'
    case 'listening':
      return 'Escuta'
    case 'speaking':
      return 'Fala'
    default:
      return mode
  }
}