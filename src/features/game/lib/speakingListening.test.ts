import { describe, expect, it } from 'vitest'
import {
  getExpectedWordCount,
  getListeningWordCoverage,
  getPhraseSettleDelayMs,
  shouldAutoFinishListening,
  shouldRestartListeningAfterEnd,
} from './speakingListening'

describe('getPhraseSettleDelayMs', () => {
  it('scales delay with phrase length in practice mode', () => {
    expect(getPhraseSettleDelayMs('hello', 'practice')).toBe(1050)
    expect(getPhraseSettleDelayMs('i would like a coffee please', 'practice')).toBe(2800)
  })

  it('caps delay in arena mode', () => {
    expect(getPhraseSettleDelayMs('i would like a coffee please today right now', 'arena')).toBe(2200)
  })
})

describe('shouldAutoFinishListening', () => {
  const expected = 'I would like a coffee please'

  it('does not auto-finish on partial transcript', () => {
    expect(shouldAutoFinishListening(expected, 'I would like')).toBe(false)
    expect(shouldRestartListeningAfterEnd(expected, 'I would like')).toBe(true)
  })

  it('auto-finishes on perfect transcript', () => {
    expect(shouldAutoFinishListening(expected, 'I would like a coffee please')).toBe(true)
    expect(shouldRestartListeningAfterEnd(expected, 'I would like a coffee please')).toBe(false)
  })

  it('auto-finishes when coverage is high enough', () => {
    const transcript = 'I would like a coffee please'
    expect(getListeningWordCoverage(expected, transcript)).toBeGreaterThanOrEqual(0.85)
    expect(shouldAutoFinishListening(expected, transcript)).toBe(true)
  })
})

describe('getExpectedWordCount', () => {
  it('normalizes contractions and punctuation', () => {
    expect(getExpectedWordCount("I'm ready, thanks.")).toBe(4)
  })
})