import { describe, expect, it } from 'vitest'
import {
  isMatureReviewCard,
  pickRotatedPracticeMode,
  resolveReviewModesForCard,
} from '@/features/review/lib/reviewModes'

const baseContext = {
  cardId: 'card-abc',
  isNew: false,
  repetitions: 1,
  total_reviews: 2,
}

describe('isMatureReviewCard', () => {
  it('treats high repetitions as mature', () => {
    expect(isMatureReviewCard({ cardId: 'x', repetitions: 3, total_reviews: 1 })).toBe(true)
  })

  it('treats high total reviews as mature', () => {
    expect(isMatureReviewCard({ cardId: 'x', repetitions: 1, total_reviews: 4 })).toBe(true)
  })
})

describe('pickRotatedPracticeMode', () => {
  it('returns a stable mode for the same card id', () => {
    expect(pickRotatedPracticeMode('stable-id')).toBe(pickRotatedPracticeMode('stable-id'))
  })

  it('alternates between listening and typing across ids', () => {
    const modes = new Set(['card-a', 'card-b', 'card-c', 'card-d'].map(pickRotatedPracticeMode))
    expect(modes.size).toBeGreaterThan(1)
  })
})

describe('resolveReviewModesForCard', () => {
  it('returns no practice for mature cards', () => {
    expect(
      resolveReviewModesForCard(['speaking'], {
        cardId: 'mature',
        repetitions: 4,
        total_reviews: 2,
      })
    ).toEqual([])
  })

  it('returns listening for new cards without weak modes', () => {
    expect(
      resolveReviewModesForCard([], {
        cardId: 'new-card',
        isNew: true,
        repetitions: 0,
        total_reviews: 0,
      })
    ).toEqual(['listening'])
  })

  it('returns a single weak mode without flashcard prefix', () => {
    expect(resolveReviewModesForCard(['speaking'], baseContext)).toEqual(['speaking'])
    expect(resolveReviewModesForCard(['listening', 'typing'], baseContext)).toEqual(['typing'])
  })

  it('deduplicates weak modes and ignores flashcard duplicates', () => {
    expect(resolveReviewModesForCard(['speaking', 'speaking', 'flashcard'], baseContext)).toEqual([
      'speaking',
    ])
  })

  it('returns one rotated mode for learning cards', () => {
    const modes = resolveReviewModesForCard([], baseContext)
    expect(modes).toHaveLength(1)
    expect(['listening', 'typing']).toContain(modes[0])
  })
})