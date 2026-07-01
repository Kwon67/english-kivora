import { isPlayableAssignmentGameMode, PLAYABLE_GAME_MODES } from '@/features/review/lib/reviewSchedules'
import type { GameMode } from '@/types/database.types'

/** @deprecated Use resolveReviewModesForCard with context instead. */
export const NORMAL_REVIEW_MODES: GameMode[] = ['listening']

export const NEW_CARD_MODE: GameMode = 'listening'
export const DEFAULT_ROTATION_MODES: GameMode[] = ['listening', 'typing']
export const MATURE_REPETITIONS_THRESHOLD = 3
export const MATURE_TOTAL_REVIEWS_THRESHOLD = 4

const REVIEW_MODE_ORDER: GameMode[] = PLAYABLE_GAME_MODES

export type ReviewCardContext = {
  cardId: string
  isNew?: boolean
  repetitions?: number
  total_reviews?: number
}

export function normalizeWeakModes(modes: Iterable<string>): GameMode[] {
  const unique = new Set<GameMode>()
  for (const mode of modes) {
    if (!isPlayableAssignmentGameMode(mode) || mode === 'flashcard') continue
    unique.add(mode)
  }
  return REVIEW_MODE_ORDER.filter((mode) => unique.has(mode))
}

export function isMatureReviewCard(context: ReviewCardContext): boolean {
  const repetitions = context.repetitions ?? 0
  const totalReviews = context.total_reviews ?? 0
  return repetitions >= MATURE_REPETITIONS_THRESHOLD || totalReviews >= MATURE_TOTAL_REVIEWS_THRESHOLD
}

export function pickRotatedPracticeMode(cardId: string): GameMode {
  if (DEFAULT_ROTATION_MODES.length === 0) return NEW_CARD_MODE
  let hash = 0
  for (let i = 0; i < cardId.length; i += 1) {
    hash = (hash * 31 + cardId.charCodeAt(i)) >>> 0
  }
  return DEFAULT_ROTATION_MODES[hash % DEFAULT_ROTATION_MODES.length] ?? NEW_CARD_MODE
}

/**
 * Picks at most one practice mode before retention rating.
 * - Mature cards → none (rate only)
 * - Weak mode history → single weakest playable mode
 * - New cards → listening
 * - Learning → one rotated mode (listening / typing)
 */
export function resolveReviewModesForCard(
  weakModes: Iterable<string>,
  context: ReviewCardContext
): GameMode[] {
  if (isMatureReviewCard(context)) {
    return []
  }

  const normalizedWeak = normalizeWeakModes(weakModes)
  if (normalizedWeak.length > 0) {
    return [normalizedWeak[0]]
  }

  if (context.isNew) {
    return [NEW_CARD_MODE]
  }

  return [pickRotatedPracticeMode(context.cardId)]
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