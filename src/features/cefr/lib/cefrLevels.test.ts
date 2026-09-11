import { describe, expect, it } from 'vitest'
import { getNextLearnerLevel, getCefrLevelWeight, isLearnerCefrLevel, normalizePackLevel } from './cefrLevels'

describe('CEFR study bands', () => {
  it('keeps advanced material distinct from B2', () => {
    expect(normalizePackLevel('C1')).toBe('C1')
    expect(normalizePackLevel('C2')).toBe('C2')
    expect(normalizePackLevel('C1 — Avançado')).toBe('C1')
    expect(isLearnerCefrLevel('C2')).toBe(true)
    expect(getCefrLevelWeight('C2')).toBe(6)
  })
  it('supports progression from B2 to C1 to C2', () => {
    expect(getNextLearnerLevel('B2')).toBe('C1')
    expect(getNextLearnerLevel('C1')).toBe('C2')
    expect(getNextLearnerLevel('C2')).toBeNull()
  })
})
