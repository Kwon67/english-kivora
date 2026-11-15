import { describe, expect, it } from 'vitest'
import { curriculumProgress, curriculumStage, stageGuidance, withinCurriculumFrontier } from './curriculumDifficulty'

describe('within-level curriculum progression', () => {
  const packs = Array.from({ length: 12 }, (_, i) => ({ id: String(i), curriculumPosition: i + 1, completed: false }))
  it('starts at the first lessons, independent of identifiers or insertion order', () => {
    expect(withinCurriculumFrontier([...packs].reverse()).map(p => p.curriculumPosition).sort()).toEqual([1, 2, 3])
  })
  it('does not skip a prerequisite because a later lesson was completed', () => {
    const progress = curriculumProgress(packs.map((p, i) => ({ ...p, completed: i !== 2 })))
    expect(progress).toEqual({ completedPrefix: 2, total: 12 })
    expect(curriculumStage(progress)).toBe('foundation')
  })
  it('advances within a level and holds back when recent performance drops', () => {
    expect(curriculumStage({ completedPrefix: 4, total: 12 }, 0.9)).toBe('development')
    expect(curriculumStage({ completedPrefix: 9, total: 12 }, 0.9)).toBe('consolidation')
    expect(curriculumStage({ completedPrefix: 9, total: 12 }, 0.7)).toBe('development')
    expect(curriculumStage({ completedPrefix: 9, total: 12 }, 0.4)).toBe('foundation')
    expect(curriculumStage()).toBe('foundation')
  })
  it.each(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const)('increases scaffolding gradually inside %s', level => {
    const stages = ['foundation', 'development', 'consolidation'] as const
    const limits = stages.map(s => stageGuidance(level, s).maxWords)
    expect(limits[0]).toBeLessThan(limits[1])
    expect(limits[1]).toBeLessThan(limits[2])
    expect(stages.map(s => stageGuidance(level, s).guidance)).toHaveLength(3)
  })
})
