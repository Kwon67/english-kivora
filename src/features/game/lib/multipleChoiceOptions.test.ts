import { describe, expect, it } from 'vitest'
import { buildMultipleChoiceOptions } from './multipleChoiceOptions'
import type { Card } from '../../../types/database.types'

function makeCard(
  id: string,
  englishPhrase: string,
  portugueseTranslation: string,
  acceptedTranslations: string[] = []
): Card {
  return {
    accepted_translations: acceptedTranslations,
    audio_url: null,
    created_at: '2026-05-15T00:00:00.000Z',
    english_phrase: englishPhrase,
    id,
    pack_id: 'pack-1',
    portuguese_translation: portugueseTranslation,
  }
}

describe('buildMultipleChoiceOptions', () => {
  it('keeps the correct answer and adds plausible hybrid traps', () => {
    const cards = [
      makeCard('1', 'Morning breeze', 'Brisa da manhã'),
      makeCard('2', 'Silent library', 'Biblioteca silenciosa'),
      makeCard('3', 'Open window', 'Janela aberta'),
      makeCard('4', 'Blue notebook', 'Caderno azul'),
    ]

    const options = buildMultipleChoiceOptions(cards[0], cards)

    expect(options).toHaveLength(4)
    expect(new Set(options).size).toBe(4)
    expect(options).toContain('Brisa da manhã')
    expect(options.some((option) => option !== 'Brisa da manhã' && option.includes('da manhã'))).toBe(true)
  })

  it('uses small semantic swaps as traps', () => {
    const cards = [
      makeCard('1', 'I always study', 'Eu sempre estudo'),
      makeCard('2', 'I never study', 'Eu nunca estudo'),
      makeCard('3', 'I study today', 'Eu estudo hoje'),
      makeCard('4', 'We always study', 'Nos sempre estudamos'),
    ]

    const options = buildMultipleChoiceOptions(cards[0], cards)

    expect(options).toContain('Eu sempre estudo')
    expect(options).toContain('Eu nunca estudo')
  })

  it('does not offer accepted translations as wrong choices', () => {
    const cards = [
      makeCard('1', 'I always study', 'Eu sempre estudo', ['Eu nunca estudo']),
      makeCard('2', 'I never study', 'Eu nunca estudo'),
      makeCard('3', 'I study today', 'Eu estudo hoje'),
      makeCard('4', 'We always study', 'Nos sempre estudamos'),
    ]

    const options = buildMultipleChoiceOptions(cards[0], cards)

    expect(options).toContain('Eu sempre estudo')
    expect(options).not.toContain('Eu nunca estudo')
  })
})
