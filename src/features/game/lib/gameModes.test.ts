import { describe, expect, it } from 'vitest'
import { GAME_MODE_OPTIONS, getGameModeOption, isPlayableGameMode } from '@/features/game/lib/gameModes'

describe('gameModes', () => {
  it('exposes six playable modes', () => {
    expect(GAME_MODE_OPTIONS).toHaveLength(6)
  })

  it('validates playable modes', () => {
    expect(isPlayableGameMode('flashcard')).toBe(true)
    expect(isPlayableGameMode('scheduled_review')).toBe(false)
  })

  it('falls back to the first mode for unknown values', () => {
    expect(getGameModeOption('unknown').id).toBe(GAME_MODE_OPTIONS[0].id)
  })
})