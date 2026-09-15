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
  it('com deck suficiente, todo distrator é uma frase REAL do deck (português garantido)', () => {
    const cards = [
      makeCard('1', 'Morning breeze', 'Brisa da manhã'),
      makeCard('2', 'Silent library', 'Biblioteca silenciosa'),
      makeCard('3', 'Open window', 'Janela aberta'),
      makeCard('4', 'Blue notebook', 'Caderno azul'),
    ]

    const options = buildMultipleChoiceOptions(cards[0], cards)
    const deckTranslations = new Set(cards.map((card) => card.portuguese_translation))

    expect(options).toHaveLength(4)
    expect(new Set(options).size).toBe(4)
    expect(options).toContain('Brisa da manhã')
    for (const option of options) {
      expect(deckTranslations.has(option)).toBe(true)
    }
  })

  it('nunca gera os traps agramaticais "não → sim" e "eu ↔ você"', () => {
    const cards = [
      makeCard('1', 'I do not know.', 'Eu não sei.'),
      makeCard('2', 'I do not want anything.', 'Eu não quero nada.'),
      makeCard('3', 'She is not here today.', 'Ela não está aqui hoje.'),
      makeCard('4', 'You are not late.', 'Você não está atrasado.'),
    ]

    for (const card of cards) {
      const options = buildMultipleChoiceOptions(card, cards)
      expect(options.some((option) => /\bsim\b/i.test(option))).toBe(false)
      expect(options).not.toContain('Você não sei.')
      expect(options).not.toContain('Você não quero nada.')
      expect(options).not.toContain('Eu não está atrasado.')
    }
  })

  it('mantém a pontuação ao trocar a última palavra', () => {
    const cards = [
      makeCard('1', 'She is not here today.', 'Ela não está aqui hoje.'),
      makeCard('2', 'I do not know.', 'Eu não sei.'),
      makeCard('3', 'You are not late.', 'Você não está atrasado.'),
      makeCard('4', 'I do not want anything.', 'Eu não quero nada.'),
    ]

    const options = buildMultipleChoiceOptions(cards[0], cards)
    expect(options).toContain('Ela não está aqui amanhã.')
  })

  it('só recorre a mutações sintéticas quando o deck não preenche as três opções', () => {
    const cards = [
      makeCard('1', 'Morning breeze', 'Brisa da manhã'),
      makeCard('2', 'Silent library', 'Biblioteca silenciosa'),
    ]

    const options = buildMultipleChoiceOptions(cards[0], cards)

    expect(options).toHaveLength(4)
    expect(new Set(options).size).toBe(4)
    expect(options).toContain('Brisa da manhã')
    expect(options).toContain('Biblioteca silenciosa')
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

  it('returns a stable option order for the same card', () => {
    const cards = [
      makeCard('1', 'My family and I go to the park today', 'Minha família e eu vamos ao parque hoje'),
      makeCard('2', 'My family and you go to the park tomorrow', 'Minha família e você vamos ao parque amanhã.'),
      makeCard('3', 'I study today', 'Eu estudo hoje'),
      makeCard('4', 'We always study', 'Nós sempre estudamos'),
    ]

    const first = buildMultipleChoiceOptions(cards[0], cards)
    const second = buildMultipleChoiceOptions(cards[0], cards)

    expect(second).toEqual(first)
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
