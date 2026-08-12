import { describe, expect, it } from 'vitest'
import { calculateNextReview } from './spacedRepetition'

describe('calculateNextReview — failing quality differentiation', () => {
  it('penalizes a total blackout (quality 0) more than a near-miss (quality 2)', () => {
    const blackout = calculateNextReview(0, 6, 2.5, 2)
    const nearMiss = calculateNextReview(2, 6, 2.5, 2)

    expect(blackout.easeFactor).toBeLessThan(nearMiss.easeFactor)
    expect(blackout.easeFactor).toBeCloseTo(1.7, 2) // 2.5 - 0.8
    expect(nearMiss.easeFactor).toBeCloseTo(2.18, 2) // 2.5 - 0.32
  })

  it('still resets repetitions and interval to 1 on any failing quality', () => {
    const blackout = calculateNextReview(0, 30, 2.5, 4)
    const nearMiss = calculateNextReview(2, 30, 2.5, 4)

    expect(blackout.repetitions).toBe(0)
    expect(blackout.intervalDays).toBe(1)
    expect(nearMiss.repetitions).toBe(0)
    expect(nearMiss.intervalDays).toBe(1)
  })

  it('floors the ease factor at 1.3 even after repeated blackouts', () => {
    const result = calculateNextReview(0, 1, 1.3, 0)
    expect(result.easeFactor).toBe(1.3)
  })

  it('keeps the successful-review formula unchanged', () => {
    const good = calculateNextReview(3, 6, 2.5, 2)
    expect(good.easeFactor).toBeCloseTo(2.36, 2)
    expect(good.repetitions).toBe(3)
    expect(good.intervalDays).toBe(Math.round(6 * 2.5))
  })
})
