import { describe, expect, it } from 'vitest'
import { buildClozeChallenge } from './clozeChallenge'

function reconstruct(result: NonNullable<ReturnType<typeof buildClozeChallenge>>) {
  return result.answers.map((answer, index) => result.segments[index] + answer).join('') + result.segments.at(-1)
}

describe('buildClozeChallenge', () => {
  it('hides a word inside the actual phrase and gives distinct options', () => {
    const sentence = 'I drink coffee every morning.'
    const result = buildClozeChallenge(sentence, ['She reads books at home.', 'We eat dinner together.'])!
    expect(reconstruct(result)).toBe(sentence)
    expect(result.segments[0].trim().length).toBeGreaterThan(0)
    expect(result.segments.at(-1)!.trim().length).toBeGreaterThan(0)
    expect(result.answers).toHaveLength(1)
    expect(new Set(result.options.map(word => word.toLowerCase())).size).toBe(3)
    expect(result.options).toContain(result.answers[0])
    expect(buildClozeChallenge(sentence, ['She reads books at home.', 'We eat dinner together.'])).toEqual(result)
  })
  it('provides vetted alternatives for a short question when no other cards are available', () => {
    const result = buildClozeChallenge('How are you today?', [])!
    expect(result.answers).toEqual(['are'])
    expect(result.options).toEqual(expect.arrayContaining(['am', 'is', 'are']))
  })
  it('does not invent a challenge when there is not enough context', () => {
    expect(buildClozeChallenge('Hello', [])).toBeNull()
    expect(buildClozeChallenge('I like coffee.', [])).toBeNull()
    expect(buildClozeChallenge('It is and are.', [])).toBeNull()
  })
  it('offers two separated gaps without needing another card or manual content', () => {
    const sentence = "I'm really looking forward to seeing you."
    const result = buildClozeChallenge(sentence, [])!
    expect(result.answers).toHaveLength(2)
    expect(result.segments[1]).toMatch(/[A-Za-z]/)
    expect(result.options).toHaveLength(2)
    expect(reconstruct(result)).toBe(sentence)
  })
  it('caps longer sentences at three gaps and keeps punctuation and surrounding words', () => {
    const sentence = 'Every morning, I drink coffee with my sister before we walk together to school.'
    const result = buildClozeChallenge(sentence, ['She reads books at home.', 'We eat dinner together.'])!
    expect(result.answers).toHaveLength(3)
    expect(result.segments).toHaveLength(4)
    expect(result.segments.every(segment => /[A-Za-z]/.test(segment))).toBe(true)
    expect(reconstruct(result)).toBe(sentence)
    expect(new Set(result.options.map(option => option.toLowerCase())).size).toBe(result.options.length)
    for (const answer of result.answers) expect(result.options.filter(option => option === answer)).toHaveLength(1)
    expect(result.options).toHaveLength(5)
  })
  it('keeps contractions and repeated words visible rather than creating ambiguous duplicate tiles', () => {
    const sentence = "We can't drink coffee because coffee keeps us awake at night."
    const result = buildClozeChallenge(sentence, ['People enjoy quiet parks.'])!
    expect(result.answers).not.toContain('coffee')
    expect(result.answers).not.toContain("can't")
    expect(reconstruct(result)).toBe(sentence)
  })
})
