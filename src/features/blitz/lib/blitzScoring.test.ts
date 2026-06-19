import { describe, expect, it } from 'vitest'
import {
  BLITZ_SPEED_BONUS,
  BLITZ_SPEED_THRESHOLD_MS,
  calculateBlitzPoints,
  getComboMultiplier,
  isGameOver,
} from './blitzScoring'

describe('getComboMultiplier', () => {
  it('returns tiered multipliers based on combo', () => {
    expect(getComboMultiplier(1)).toBe(1)
    expect(getComboMultiplier(3)).toBe(2)
    expect(getComboMultiplier(5)).toBe(3)
    expect(getComboMultiplier(10)).toBe(5)
  })
})

describe('calculateBlitzPoints', () => {
  it('applies combo multiplier and speed bonus', () => {
    expect(calculateBlitzPoints(1, BLITZ_SPEED_THRESHOLD_MS)).toBe(100)
    expect(calculateBlitzPoints(3, BLITZ_SPEED_THRESHOLD_MS - 1)).toBe(200 + BLITZ_SPEED_BONUS)
    expect(calculateBlitzPoints(10, 5000)).toBe(500)
  })
})

describe('isGameOver', () => {
  it('ends when lives reach zero', () => {
    expect(isGameOver(1)).toBe(false)
    expect(isGameOver(0)).toBe(true)
  })
})