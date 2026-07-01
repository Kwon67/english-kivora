import { describe, expect, it } from 'vitest'
import {
  BLITZ_SPEED_BONUS,
  BLITZ_SPEED_THRESHOLD_MS,
  calculateBlitzPoints,
  getBlitzSessionPhase,
  getBlitzSessionProgress,
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
    expect(calculateBlitzPoints(1, BLITZ_SPEED_THRESHOLD_MS)).toBe(10)
    expect(calculateBlitzPoints(3, BLITZ_SPEED_THRESHOLD_MS - 1)).toBe(20 + BLITZ_SPEED_BONUS)
    expect(calculateBlitzPoints(10, 5000)).toBe(50)
  })
})

describe('isGameOver', () => {
  it('ends when lives reach zero', () => {
    expect(isGameOver(1)).toBe(false)
    expect(isGameOver(0)).toBe(true)
  })
})

describe('getBlitzSessionProgress', () => {
  it('starts at zero with full lives', () => {
    expect(getBlitzSessionProgress(0, 30, 3)).toBe(0)
  })

  it('advances within the current life segment', () => {
    expect(getBlitzSessionProgress(5, 30, 3)).toBe(17)
    expect(getBlitzSessionProgress(11, 30, 3)).toBe(37)
  })

  it('jumps to the next segment when a life is lost', () => {
    expect(getBlitzSessionProgress(10, 30, 2)).toBe(33)
    expect(getBlitzSessionProgress(20, 30, 1)).toBe(67)
  })

  it('never drops below the current life floor after losing a life', () => {
    expect(getBlitzSessionProgress(3, 30, 2)).toBe(33)
  })

  it('reaches one hundred when the run ends', () => {
    expect(getBlitzSessionProgress(25, 30, 0)).toBe(100)
  })
})

describe('getBlitzSessionPhase', () => {
  it('maps progress bands to session phases', () => {
    expect(getBlitzSessionPhase(0)).toBe('início')
    expect(getBlitzSessionPhase(50)).toBe('meio')
    expect(getBlitzSessionPhase(80)).toBe('final')
    expect(getBlitzSessionPhase(100)).toBe('fim')
  })
})