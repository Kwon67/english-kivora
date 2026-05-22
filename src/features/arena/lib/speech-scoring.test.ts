import { describe, expect, it } from 'vitest'
import {
  isSpeechTranscriptReadyForEvaluation,
  normalizeSpeechPhrase,
  scoreSpeechTranscript,
} from './speech-scoring'

describe('scoreSpeechTranscript', () => {
  it('scores an identical phrase as a perfect match', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', 'I would like to improve my English')

    expect(result.score).toBe(100)
    expect(result.accepted).toBe(true)
    expect(result.missingWords).toEqual([])
    expect(result.extraWords).toEqual([])
  })

  it('penalizes a missing word', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', 'I would like improve my English')

    expect(result.score).toBeLessThan(100)
    expect(result.accepted).toBe(false)
    expect(result.missingWords).toEqual(['to'])
    expect(result.extraWords).toEqual([])
  })

  it('penalizes an extra word', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', 'I would really like to improve my English')

    expect(result.score).toBeLessThan(100)
    expect(result.accepted).toBe(false)
    expect(result.missingWords).toEqual([])
    expect(result.extraWords).toEqual(['really'])
  })

  it('ignores punctuation differences', () => {
    const result = scoreSpeechTranscript('I would like to improve my English.', 'I would like to improve my English')

    expect(result.score).toBe(100)
    expect(result.accepted).toBe(true)
  })

  it('ignores case differences', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', 'i WOULD like TO improve MY english')

    expect(result.score).toBe(100)
    expect(result.accepted).toBe(true)
  })

  it('accepts equivalent contractions', () => {
    const result = scoreSpeechTranscript("I'm fine", 'I am fine')

    expect(result.score).toBe(100)
    expect(result.accepted).toBe(true)
    expect(result.alignment.expected).toEqual([
      { word: 'i', isCorrect: true },
      { word: 'am', isCorrect: true },
      { word: 'fine', isCorrect: true },
    ])
  })

  it('expands negative contractions before scoring', () => {
    const result = scoreSpeechTranscript("I can't go", 'I cannot go')

    expect(result.score).toBe(100)
    expect(result.accepted).toBe(true)
  })

  it('rejects a very different transcript', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', 'the weather is cold today')

    expect(result.score).toBeLessThan(100)
    expect(result.accepted).toBe(false)
  })

  it('rejects an empty transcript', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', '')

    expect(result.score).toBe(0)
    expect(result.accepted).toBe(false)
    expect(result.missingWords).toEqual(['i', 'would', 'like', 'to', 'improve', 'my', 'english'])
  })

  it('marks substituted words in the shared alignment', () => {
    const result = scoreSpeechTranscript('I would like tea', 'I would like coffee')

    expect(result.alignment.expected).toEqual([
      { word: 'i', isCorrect: true },
      { word: 'would', isCorrect: true },
      { word: 'like', isCorrect: true },
      { word: 'tea', isCorrect: false },
    ])
    expect(result.alignment.transcript).toEqual([
      { word: 'i', isCorrect: true },
      { word: 'would', isCorrect: true },
      { word: 'like', isCorrect: true },
      { word: 'coffee', isCorrect: false },
    ])
  })
})

describe('normalizeSpeechPhrase', () => {
  it('expands common contractions', () => {
    expect(normalizeSpeechPhrase("I'm sure it'll work.")).toBe('i am sure it will work')
  })
})

describe('isSpeechTranscriptReadyForEvaluation', () => {
  it('does not settle a short partial transcript below the acceptance threshold', () => {
    expect(isSpeechTranscriptReadyForEvaluation(
      'I would like to improve my English',
      'I would like'
    )).toBe(false)
  })

  it('settles a near-complete transcript for feedback without accepting it', () => {
    const result = scoreSpeechTranscript(
      'I would like to improve my English',
      'I would like to improve my'
    )

    expect(result.accepted).toBe(false)
    expect(isSpeechTranscriptReadyForEvaluation(
      'I would like to improve my English',
      'I would like to improve my'
    )).toBe(true)
  })

  it('settles a complete-length wrong transcript so the user gets feedback', () => {
    expect(isSpeechTranscriptReadyForEvaluation(
      'I would like to improve my English',
      'the weather is cold outside right now'
    )).toBe(true)
  })
})
