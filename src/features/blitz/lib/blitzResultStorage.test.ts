import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { clearBlitzResultSnapshot, loadBlitzResultSnapshot, saveBlitzResultSnapshot } from './blitzResultStorage'
import type { BlitzResultSnapshot } from './blitzResultStorage'

const result: BlitzResultSnapshot = {
  score: 10, maxCombo: 2, cardsAnswered: 3, savedBest: 10, personalBest: 10,
  isNewRecord: true, misses: [], runRewards: null,
}
const entries = new Map<string, string>()

beforeEach(() => {
  entries.clear()
  vi.stubGlobal('window', {})
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  })
})
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

it('isolates results on a shared tab and restores each learner after signing back in', () => {
  saveBlitzResultSnapshot('alice', result)
  expect(loadBlitzResultSnapshot('bob')).toBeNull()
  saveBlitzResultSnapshot('bob', { ...result, score: 30 })
  clearBlitzResultSnapshot('bob')
  expect(loadBlitzResultSnapshot('bob')).toBeNull()
  expect(loadBlitzResultSnapshot('alice')).toMatchObject(result)
})

it('discards unowned legacy results and expires only the old result for this learner', () => {
  vi.useFakeTimers()
  entries.set('kivora-blitz-result', JSON.stringify({ ...result, savedAt: new Date().toISOString() }))
  expect(loadBlitzResultSnapshot('alice')).toBeNull()
  expect(entries.has('kivora-blitz-result')).toBe(false)
  saveBlitzResultSnapshot('alice', result)
  vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1)
  saveBlitzResultSnapshot('bob', result)
  expect(loadBlitzResultSnapshot('alice')).toBeNull()
  expect(loadBlitzResultSnapshot('bob')).toMatchObject(result)
})
