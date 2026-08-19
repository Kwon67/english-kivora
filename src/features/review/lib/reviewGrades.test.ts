import { describe, expect, it } from 'vitest'
import { calculateNextReview } from '@/features/review/lib/spacedRepetition'
import {
  REVIEW_GRADE,
  formatIntervalEstimate,
  getNextIntervalDays,
  getReviewIntervalEstimate,
  isReviewGrade,
} from '@/features/review/lib/reviewGrades'

const mature = { interval_days: 10, ease_factor: 2.5, repetitions: 5 }

describe('REVIEW_GRADE mapping', () => {
  it('keeps GOOD ease-neutral so honest recall never degrades a card', () => {
    const before = 2.5
    const after = calculateNextReview(REVIEW_GRADE.GOOD, 10, before, 5).easeFactor
    expect(after).toBe(before)
  })

  it('does not let repeated GOOD answers collapse the card towards the ease floor', () => {
    // The old mapping sent q=3 here and drove ease 2.5 -> 1.38 over eight reviews.
    let ease = 2.5
    let interval = 1
    let repetitions = 0

    for (let review = 0; review < 12; review += 1) {
      const next = calculateNextReview(REVIEW_GRADE.GOOD, interval, ease, repetitions)
      ease = next.easeFactor
      interval = next.intervalDays
      repetitions = next.repetitions
    }

    expect(ease).toBe(2.5)
    expect(interval).toBeGreaterThan(100)
  })

  it('makes HARD a pass with a small penalty, not a wipe', () => {
    const next = calculateNextReview(REVIEW_GRADE.HARD, 10, 2.5, 5)
    expect(next.repetitions).toBe(6)
    expect(next.intervalDays).toBeGreaterThan(1)
    expect(next.easeFactor).toBeLessThan(2.5)
    expect(next.easeFactor).toBeGreaterThan(2.3)
  })

  it('rewards EASY with an ease bonus', () => {
    expect(calculateNextReview(REVIEW_GRADE.EASY, 10, 2.5, 5).easeFactor).toBeGreaterThan(2.5)
  })

  it('keeps AGAIN as the only grade that resets the card', () => {
    const next = calculateNextReview(REVIEW_GRADE.AGAIN, 10, 2.5, 5)
    expect(next.repetitions).toBe(0)
    expect(next.intervalDays).toBe(1)

    for (const grade of [REVIEW_GRADE.HARD, REVIEW_GRADE.GOOD, REVIEW_GRADE.EASY]) {
      expect(calculateNextReview(grade, 10, 2.5, 5).repetitions).toBe(6)
    }
  })

  it('orders the grades so a better answer never returns sooner', () => {
    const again = getNextIntervalDays(mature, REVIEW_GRADE.AGAIN)
    const hard = getNextIntervalDays(mature, REVIEW_GRADE.HARD)
    const good = getNextIntervalDays(mature, REVIEW_GRADE.GOOD)
    const easy = getNextIntervalDays(mature, REVIEW_GRADE.EASY)

    expect(again).toBeLessThan(hard)
    expect(hard).toBeLessThanOrEqual(good)
    expect(good).toBeLessThanOrEqual(easy)
  })

  it('recognises exactly the four grades', () => {
    expect([0, 3, 4, 5].every(isReviewGrade)).toBe(true)
    expect([1, 2, 6, -1].some(isReviewGrade)).toBe(false)
  })
})

describe('interval estimates', () => {
  it('matches what the scheduler will actually store', () => {
    for (const grade of Object.values(REVIEW_GRADE)) {
      const promised = getNextIntervalDays(mature, grade)
      const stored = calculateNextReview(grade, 10, 2.5, 5).intervalDays
      expect(promised).toBe(stored)
    }
  })

  it('never promises sub-day returns the scheduler cannot deliver', () => {
    // The old UI showed "1 min" for the failing grade while storing interval_days = 1.
    expect(getReviewIntervalEstimate(mature, REVIEW_GRADE.AGAIN)).toBe('1 dia')
  })

  it('formats plainly', () => {
    expect(formatIntervalEstimate(1)).toBe('1 dia')
    expect(formatIntervalEstimate(25)).toBe('25 dias')
    expect(formatIntervalEstimate(60)).toBe('2 meses')
    expect(formatIntervalEstimate(400)).toBe('1 ano')
  })
})
