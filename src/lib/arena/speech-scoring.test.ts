import { describe, expect, it } from 'vitest'
import { normalizeSpeechPhrase, scoreSpeechTranscript } from './speech-scoring'

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
    expect(result.missingWords).toEqual(['to'])
    expect(result.extraWords).toEqual([])
  })

  it('penalizes an extra word', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', 'I would really like to improve my English')

    expect(result.score).toBeLessThan(100)
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

  it('rejects a very different transcript', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', 'the weather is cold today')

    expect(result.score).toBeLessThan(85)
    expect(result.accepted).toBe(false)
  })

  it('rejects an empty transcript', () => {
    const result = scoreSpeechTranscript('I would like to improve my English', '')

    expect(result.score).toBe(0)
    expect(result.accepted).toBe(false)
    expect(result.missingWords).toEqual(['i', 'would', 'like', 'to', 'improve', 'my', 'english'])
  })
})

describe('normalizeSpeechPhrase', () => {
  it('expands common contractions', () => {
    expect(normalizeSpeechPhrase("I'm sure it'll work.")).toBe('i am sure it will work')
  })
})
