import { describe, expect, it } from 'vitest'
import { NORMAL_REVIEW_MODES, resolveReviewModesForCard } from '@/features/review/lib/reviewModes'

describe('resolveReviewModesForCard', () => {
  it('uses flashcard, speaking and typing when there are no weak modes', () => {
    expect(resolveReviewModesForCard([])).toEqual(NORMAL_REVIEW_MODES)
  })

  it('adds weak modes after flashcard in stable order', () => {
    expect(resolveReviewModesForCard(['speaking'])).toEqual(['flashcard', 'speaking'])
    expect(resolveReviewModesForCard(['listening', 'typing'])).toEqual([
      'flashcard',
      'typing',
      'listening',
    ])
  })

  it('deduplicates weak modes and ignores flashcard duplicates', () => {
    expect(resolveReviewModesForCard(['speaking', 'speaking', 'flashcard'])).toEqual([
      'flashcard',
      'speaking',
    ])
  })

  it('includes every weak playable mode for struggling cards', () => {
    expect(resolveReviewModesForCard(['speaking', 'multiple_choice', 'matching'])).toEqual([
      'flashcard',
      'multiple_choice',
      'matching',
      'speaking',
    ])
  })
})