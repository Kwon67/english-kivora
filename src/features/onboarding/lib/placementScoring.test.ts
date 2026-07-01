import { describe, expect, it } from 'vitest'
import { PLACEMENT_ITEMS } from './placementItems'
import {
  createPlacementSession,
  estimatePlacementLevel,
  getNextPlacementItem,
  recordPlacementAnswer,
} from './placementScoring'

describe('placementScoring', () => {
  it('returns an item to start the session', () => {
    const session = createPlacementSession()
    const item = getNextPlacementItem(session)
    expect(item).not.toBeNull()
    expect(item?.level).toBeDefined()
  })

  it('adapts upward after a correct answer', () => {
    const session = createPlacementSession()
    const first = getNextPlacementItem(session)
    expect(first).not.toBeNull()
    if (!first) return

    const nextState = recordPlacementAnswer(session, first.id, first.correctIndex)
    expect(nextState.focusLevel).not.toBe('A1')
    expect(nextState.answers).toHaveLength(1)
  })

  it('estimates higher level when harder bands are answered correctly', () => {
    const estimate = estimatePlacementLevel([
      { itemId: 'a2-past', level: 'A2', correct: true },
      { itemId: 'a2-comparative', level: 'A2', correct: true },
      { itemId: 'b1-present-perfect', level: 'B1', correct: true },
      { itemId: 'b1-conditionals', level: 'B1', correct: true },
      { itemId: 'b2-nuance', level: 'B2', correct: true },
    ])

    expect(estimate.level).toBe('B2')
    expect(estimate.confidence).toBeGreaterThan(50)
  })

  it('defaults to A2 with moderate confidence when no answers are given', () => {
    const estimate = estimatePlacementLevel([])
    expect(estimate.level).toBe('A2')
    expect(estimate.confidence).toBe(40)
  })

  it('records answers for AI-generated dynamic items', () => {
    const session = createPlacementSession()
    const dynamicItem = {
      id: 'ai-test-item',
      level: 'A2' as const,
      prompt: 'She ___ happy yesterday.',
      options: ['is', 'was', 'were', 'be'] as [string, string, string, string],
      correctIndex: 1,
    }

    const nextState = recordPlacementAnswer(session, dynamicItem.id, dynamicItem.correctIndex, {
      dynamicItems: [dynamicItem],
    })

    expect(nextState.answers).toHaveLength(1)
    expect(nextState.answers[0]?.correct).toBe(true)
    expect(nextState.shownItemIds).toContain('ai-test-item')
  })

  it('can pick dynamic items from the pool', () => {
    const dynamicItem = {
      id: 'ai-pool-item',
      level: 'B2' as const,
      prompt: 'They ___ to the park last week.',
      options: ['go', 'went', 'gone', 'going'] as [string, string, string, string],
      correctIndex: 1,
    }

    const session = {
      ...createPlacementSession(),
      focusLevel: 'B2' as const,
      shownItemIds: PLACEMENT_ITEMS.filter((item) => item.level === 'B2').map((item) => item.id),
    }

    const item = getNextPlacementItem(session, { dynamicItems: [dynamicItem] })
    expect(item?.id).toBe('ai-pool-item')
  })
})