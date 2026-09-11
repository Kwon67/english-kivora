import { describe, expect, it } from 'vitest'
import { estimateUserLevel, getLevelPracticeReadiness, mergeLevelScores, type LevelScore, type LevelScores } from './estimateUserLevel'
import { getLevelGate } from '@/features/learning/lib/levelGate'

function variedPractice(): LevelScore {
  return {
    correct: 190, total: 200,
    cards: Array.from({ length: 60 }, (_, i) => `card-${i}`),
    packs: Array.from({ length: 8 }, (_, i) => `pack-${i}`),
    days: Array.from({ length: 20 }, (_, i) => `2026-08-${String(i + 1).padStart(2, '0')}`),
    skills: {
      retrieval: { correct: 48, total: 50 },
      listening: { correct: 48, total: 50 },
      speaking: { correct: 48, total: 50 },
      writing: { correct: 48, total: 50 },
    },
  }
}

describe('study level estimation', () => {
  it('keeps a new learner in assessment until there is enough entry evidence', () => {
    expect(estimateUserLevel({ A1: { correct: 5, total: 8 } }, 8)).toMatchObject({
      assessing: true, estimatedLevel: null, nextLevel: 'A1',
    })
  })

  it('uses historical aggregate beginner accuracy only for the conservative A1 entry band', () => {
    const estimate = estimateUserLevel({ A1: { correct: 14, total: 20 }, A2: { correct: 2000, total: 2000 } }, 2020)
    expect(estimate.estimatedLevel).toBe('A1')
  })

  it('does not equate repeatedly recalled cards with advancement', () => {
    const onePhrase = { ...variedPractice(), cards: ['memorized-phrase'] }
    const result = estimateUserLevel({ A1: variedPractice(), A2: onePhrase }, 400)
    expect(result.estimatedLevel).toBe('A1')
  })

  it('requires listening and speaking evidence, even with perfect text exercises', () => {
    const textOnly = { ...variedPractice(), skills: { retrieval: { correct: 200, total: 200 } } }
    expect(estimateUserLevel({ A1: variedPractice(), A2: textOnly }, 400).estimatedLevel).toBe('A1')
  })

  it('requires practice spread across days and contexts', () => {
    expect(estimateUserLevel({ A1: variedPractice(), A2: { ...variedPractice(), days: ['2026-09-10'] } }, 400).estimatedLevel).toBe('A1')
    expect(estimateUserLevel({ A1: variedPractice(), A2: { ...variedPractice(), packs: ['one-pack'] } }, 400).estimatedLevel).toBe('A1')
  })

  it('opens a next-band challenge from current-band mastery without circular prerequisites', () => {
    const estimate = estimateUserLevel({ A1: variedPractice() }, 200)
    expect(estimate).toMatchObject({ estimatedLevel: 'A1', nextLevel: 'A2', progressToNext: 70 })
    expect(getLevelGate({ ...estimate, level: estimate.estimatedLevel }).stretch).toBe('A2')
  })

  it('promotes to A2 only after varied scored practice', () => {
    expect(estimateUserLevel({ A1: variedPractice(), A2: variedPractice() }, 400)).toMatchObject({
      estimatedLevel: 'A2', nextLevel: 'B1',
    })
  })

  it('supports C1 and C2 independently, with writing and preceding bands', () => {
    const scores: LevelScores = { A1: variedPractice(), A2: variedPractice(), B1: variedPractice(), B2: variedPractice(), C1: variedPractice() }
    expect(estimateUserLevel(scores, 1000)).toMatchObject({ estimatedLevel: 'C1', nextLevel: 'C2' })
    scores.C2 = variedPractice()
    expect(estimateUserLevel(scores, 1200)).toMatchObject({ estimatedLevel: 'C2', nextLevel: null, progressToNext: null })
    scores.C2.skills!.writing = { correct: 10, total: 50 }
    expect(estimateUserLevel(scores, 1200).estimatedLevel).toBe('C1')
  })

  it('retains placement when the learner consolidates easier material', () => {
    const result = estimateUserLevel({ placement: { level: 'B2', confidence: 82 }, A1: variedPractice() }, 200)
    expect(result).toMatchObject({ estimatedLevel: 'B2', assessing: false, confidence: 82, nextLevel: 'C1' })
  })

  it('does not undo an earned study level when old evidence leaves the bounded history', () => {
    const result = estimateUserLevel({ placement: { level: 'B2', confidence: 82 } }, 1200, { level: 'C1', confidence: 95 })
    expect(result.estimatedLevel).toBe('C1')
  })
})

describe('practice evidence', () => {
  it('deduplicates retried submissions and tracks only distinct cards and contexts', () => {
    const evidence = { cardIds: ['one', 'one', 'two'], packId: 'pack', gameMode: 'listening', evidenceId: 'session-1', date: '2026-09-10' }
    const first = mergeLevelScores({}, 'A1', 2, 3, evidence)
    const retry = mergeLevelScores(first.scores, 'A1', 2, 3, evidence)
    expect(first.scores.A1).toMatchObject({ cards: ['one', 'two'], packs: ['pack'], days: ['2026-09-10'], skills: { listening: { correct: 2, total: 3 } } })
    expect(retry.totalInteractions).toBe(0)
    expect(retry.scores.A1?.total).toBe(3)
  })

  it('does not turn self-reported SRS grades into measured language skills', () => {
    const result = mergeLevelScores({}, 'A1', 1, 1, { cardId: 'card', packId: 'pack', gameMode: 'review' })
    expect(result.scores.A1?.cards).toEqual([])
    expect(result.scores.A1?.skills).toEqual({})
    expect(getLevelPracticeReadiness('A1', result.scores)).toBe(0)
  })

  it('bounds malformed counts and does not poison future estimates with NaN', () => {
    const result = mergeLevelScores({}, 'A1', Number.POSITIVE_INFINITY, Number.NaN)
    expect(result.totalInteractions).toBe(0)
    expect(result.scores.A1?.total).toBe(0)
    expect(result.scores.A1?.correct).toBe(0)
  })
})
