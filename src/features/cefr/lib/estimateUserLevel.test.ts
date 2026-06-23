import { describe, expect, it } from 'vitest'
import { estimateUserLevel } from '@/features/cefr/lib/estimateUserLevel'

describe('estimateUserLevel', () => {
  it('returns assessing state before minimum interactions', () => {
    const result = estimateUserLevel({ A1: { correct: 5, total: 8 } }, 8)
    expect(result.assessing).toBe(true)
    expect(result.estimatedLevel).toBeNull()
    expect(result.nextLevel).toBe('A1')
  })

  it('detects A1 with enough beginner accuracy', () => {
    const result = estimateUserLevel(
      { A1: { correct: 14, total: 20 } },
      20
    )
    expect(result.estimatedLevel).toBe('A1')
    expect(result.assessing).toBe(false)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('promotes to A2 when A1 prerequisite and A2 mastery are met', () => {
    const result = estimateUserLevel(
      {
        A1: { correct: 18, total: 22 },
        A2: { correct: 16, total: 22 },
      },
      44
    )
    expect(result.estimatedLevel).toBe('A2')
    expect(result.nextLevel).toBe('B1')
  })

  it('does not promote to B2 without sufficient B1 performance', () => {
    const result = estimateUserLevel(
      {
        A1: { correct: 30, total: 35 },
        A2: { correct: 28, total: 35 },
        B1: { correct: 10, total: 20 },
        B2: { correct: 30, total: 45 },
      },
      135
    )
    expect(result.estimatedLevel).not.toBe('B2')
  })

  it('detects B2 when prerequisites and band accuracy are strong', () => {
    const result = estimateUserLevel(
      {
        A1: { correct: 40, total: 45 },
        A2: { correct: 38, total: 45 },
        B1: { correct: 35, total: 45 },
        B2: { correct: 30, total: 42 },
      },
      177
    )
    expect(result.estimatedLevel).toBe('B2')
    expect(result.nextLevel).toBeNull()
  })
})