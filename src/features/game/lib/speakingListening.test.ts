import { describe, expect, it } from 'vitest'
import {
  evaluateSpeakingAnswer,
  getExpectedWordCount,
  getListeningWordCoverage,
  getPhraseQuickSettleDelayMs,
  getPhraseSettleDelayMs,
  isPerfectSpeakingPhrase,
  shouldAutoFinishListening,
  shouldRestartListeningAfterEnd,
  shouldUseQuickSilenceSettle,
} from './speakingListening'

describe('getPhraseSettleDelayMs', () => {
  it('scales delay with phrase length', () => {
    expect(getPhraseSettleDelayMs('hello')).toBe(940)
    expect(getPhraseSettleDelayMs('i would like a coffee please')).toBe(2140)
  })

  it('caps delay for long phrases', () => {
    expect(
      getPhraseSettleDelayMs(
        'i would like a coffee please today right now because i am very hungry and tired'
      )
    ).toBe(3200)
  })

  it('uses a shorter fast profile for arcade-style modes', () => {
    expect(getPhraseSettleDelayMs('i would like a coffee please', { fast: true })).toBe(1380)
  })
})

describe('getPhraseQuickSettleDelayMs', () => {
  it('waits for a short silence tail once the phrase is nearly complete', () => {
    expect(getPhraseQuickSettleDelayMs('hello')).toBe(615)
    expect(getPhraseQuickSettleDelayMs('i would like a coffee please')).toBe(940)
  })
})

describe('shouldUseQuickSilenceSettle', () => {
  const expected = 'I would like a coffee please'

  it('does not use the quick tail while the phrase is still partial', () => {
    expect(shouldUseQuickSilenceSettle(expected, 'I would like')).toBe(false)
  })

  it('uses the quick tail when coverage is nearly complete', () => {
    expect(shouldUseQuickSilenceSettle(expected, 'I would like a coffee please')).toBe(true)
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
    expect(getListeningWordCoverage(expected, transcript)).toBeGreaterThanOrEqual(0.72)
    expect(shouldAutoFinishListening(expected, transcript)).toBe(true)
  })
})

describe('getExpectedWordCount', () => {
  it('normalizes contractions and punctuation', () => {
    expect(getExpectedWordCount("I'm ready, thanks.")).toBe(4)
  })
})

describe('isPerfectSpeakingPhrase', () => {
  it('treats expanded and contracted forms as equivalent', () => {
    expect(isPerfectSpeakingPhrase("Where's the nearest bus stop", 'Where is the nearest bus stop')).toBe(true)
    expect(isPerfectSpeakingPhrase('Where is the nearest bus stop', "Where's the nearest bus stop")).toBe(true)
  })
})

describe('evaluateSpeakingAnswer', () => {
  const expected = 'I forgot my keys at home again'

  it('accepts a perfect transcript', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: expected,
        transcript: 'i forgot my keys at home again',
      })
    ).toBe(true)
  })

  it('accepts near-perfect transcripts at the practice threshold', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: expected,
        transcript: 'i forgot my keys at home',
      })
    ).toBe(true)
  })

  it('accepts synonymous portuguese translations for the card', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'Hello, how are you?',
        transcript: 'ola como vai voce',
        acceptedTranslations: ['Olá, como você está?'],
      })
    ).toBe(true)
  })
})