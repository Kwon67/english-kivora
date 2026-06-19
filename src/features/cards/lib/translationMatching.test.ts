import { describe, expect, it } from 'vitest'
import {
  areTranslationsEquivalent,
  classifyTranslationAnswer,
  isAcceptedTranslationAnswer,
} from '@/features/cards/lib/translationMatching'

describe('translationMatching', () => {
  const accepted = ['Olá, como você está?']

  it('accepts synonymous greetings with the same meaning', () => {
    expect(areTranslationsEquivalent('Olá, como vai você?', accepted[0])).toBe(true)
    expect(classifyTranslationAnswer('Olá, como vai você?', accepted)).toBe('equivalent')
    expect(isAcceptedTranslationAnswer('Olá, como vai você?', accepted)).toBe(true)
  })

  it('accepts explicit synonyms configured on cards', () => {
    const withSynonyms = ['Olá, como você está?', 'Olá, como vai você?']

    expect(classifyTranslationAnswer('Olá, como vai você?', withSynonyms)).toBe('exact')
  })

  it('rejects unrelated translations', () => {
    expect(isAcceptedTranslationAnswer('Bom dia, tudo certo?', accepted)).toBe(false)
  })
})