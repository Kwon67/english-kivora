import { describe, expect, it } from 'vitest'
import {
  evaluateSpeakingAnswer,
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

describe('evaluateSpeakingAnswer', () => {
  const expected = 'I forgot my keys at home again'

  it('accepts a perfect practice transcript even when local assessment fails', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: expected,
        transcript: 'i forgot my keys at home again',
        variant: 'practice',
        assessment: {
          accepted: false,
          score: 0,
          clarityScore: 0,
          durationScore: 0,
          paceScore: 0,
          rhythmScore: null,
          durationMs: 0,
          voicedDurationMs: 0,
          referenceDurationMs: null,
          reasons: ['A avaliação demorou demais. Tente falar de novo com áudio claro.'],
        },
      })
    ).toBe(true)
  })

  it('accepts near-perfect practice transcripts at the practice threshold', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: expected,
        transcript: 'i forgot my keys at home',
        variant: 'practice',
      })
    ).toBe(true)
  })

  it('keeps arena mode strict when assessment rejects a borderline transcript', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: expected,
        transcript: 'i forgot my keys at home',
        variant: 'arena',
        assessment: {
          accepted: false,
          score: 42,
          clarityScore: 40,
          durationScore: 50,
          paceScore: 55,
          rhythmScore: 30,
          durationMs: 1800,
          voicedDurationMs: 900,
          referenceDurationMs: 1600,
          reasons: ['A voz ficou baixa, cortada ou com pouco sinal claro.'],
        },
      })
    ).toBe(false)
  })
})