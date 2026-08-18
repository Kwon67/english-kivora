import { describe, expect, it } from 'vitest'
import {
  BLITZ_GAME_MODES,
  getBlitzModeLabel,
  getBlitzModeShortLabel,
  pickRandomBlitzMode,
} from './blitzModes'

describe('BLITZ_GAME_MODES', () => {
  it('excludes flashcard from arcade modes', () => {
    expect(BLITZ_GAME_MODES).not.toContain('flashcard')
    expect(BLITZ_GAME_MODES).toEqual(['multiple_choice', 'typing', 'matching', 'speaking', 'listening'])
  })
})

describe('pickRandomBlitzMode', () => {
  it('never returns flashcard', () => {
    for (let index = 0; index < 50; index += 1) {
      expect(pickRandomBlitzMode()).not.toBe('flashcard')
    }
  })
})

describe('blitz mode labels', () => {
  it('labels every arcade mode in both lengths', () => {
    for (const mode of BLITZ_GAME_MODES) {
      expect(getBlitzModeLabel(mode)).toBeTruthy()
      expect(getBlitzModeShortLabel(mode)).toBeTruthy()
    }
  })

  it('keeps HUD labels short enough not to truncate on a phone', () => {
    for (const mode of BLITZ_GAME_MODES) {
      expect(getBlitzModeShortLabel(mode).length).toBeLessThanOrEqual(11)
    }
  })

  it('shortens only the label that overflowed', () => {
    expect(getBlitzModeLabel('multiple_choice')).toBe('Múltipla escolha')
    expect(getBlitzModeShortLabel('multiple_choice')).toBe('Escolha')
    expect(getBlitzModeShortLabel('typing')).toBe(getBlitzModeLabel('typing'))
  })
})
