import { describe, expect, it } from 'vitest'
import {
  createCatSession,
  estimateCatLevel,
  recordCatAnswer,
} from '@/features/onboarding/lib/catScoring'

describe('catScoring', () => {
  it('starts at A2 by default', () => {
    const session = createCatSession()
    expect(session.focusLevel).toBe('A2')
  })

  it('starts at A1 when study experience is under one year', () => {
    const session = createCatSession('less_than_1_year')
    expect(session.focusLevel).toBe('A1')
  })

  it('moves focus up after a correct answer', () => {
    const session = createCatSession()
    const next = recordCatAnswer(session, {
      cardId: 'c1',
      packId: 'p1',
      packLevel: 'A2',
      correct: true,
    })

    expect(next.focusLevel).not.toBe('A1')
    expect(next.answers).toHaveLength(1)
  })

  it('never estimates above B1 and reports B1+ at ceiling', () => {
    const estimate = estimateCatLevel([
      { cardId: '1', packId: 'p', packLevel: 'B1', correct: true },
      { cardId: '2', packId: 'p', packLevel: 'B1', correct: true },
      { cardId: '3', packId: 'p', packLevel: 'B1', correct: true },
      { cardId: '4', packId: 'p', packLevel: 'B1', correct: true },
    ])

    expect(estimate.level).toBe('B1')
    expect(estimate.atCeiling).toBe(true)
    expect(estimate.displayLabel).toBe('B1+')
    expect(estimate.confidence).toBeLessThanOrEqual(82)
  })

  it('returns partial estimate when abandoned', () => {
    const estimate = estimateCatLevel(
      [{ cardId: '1', packId: 'p', packLevel: 'A2', correct: true }],
      { abandoned: true }
    )

    expect(estimate.level).toBe('A2')
    expect(estimate.confidence).toBeGreaterThanOrEqual(25)
  })
})