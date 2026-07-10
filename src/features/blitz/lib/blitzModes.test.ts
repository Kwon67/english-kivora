import { describe, expect, it } from 'vitest'
import { BLITZ_GAME_MODES, pickRandomBlitzMode } from './blitzModes'

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
