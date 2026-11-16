import { describe, expect, it } from 'vitest'
import type { CardSignal } from '@/features/learning/lib/cardIntelligence'
import { LEARNER_CEFR_LEVELS } from '@/features/cefr/lib/cefrLevels'
import { stageGuidance } from '@/features/curriculum/lib/curriculumDifficulty'
import { buildBalancedBlitzDeck, isSuitableNewBlitzPhrase } from './blitzDeck'
import { isBlitzPriorityMiss } from './blitzReviewPriority'
import { getBlitzStudyRecommendation } from './blitzRecommendation'
import type { BlitzMiss } from './blitzMisses'

function signal(id: string, changes: Partial<CardSignal> = {}): CardSignal {
  return {
    cardId: id, packId: 'a1', packLevel: 'A1', isNew: false, lapses: 0,
    easeFactor: 2.5, repetitions: 2, recentErrors: 0, daysSinceSeen: 2, daysOverdue: 0,
    ...changes,
  }
}

describe('baralho adaptativo do Blitz', () => {
  it('aquece com frases familiares, adia erros recentes e intercala até uma novidade a cada quatro quando há material', () => {
    const known = Array.from({ length: 9 }, (_, index) => ({ id: `known-${index}`, english_phrase: `I take bus ${index}.` }))
    const cards = [
      { id: 'recent', english_phrase: 'Hello.' },
      { id: 'new-long', english_phrase: "I'm the king of the world!" },
      { id: 'new-short', english_phrase: 'I am your father.' },
      ...known,
    ]
    const signals = new Map(cards.map(card => [
      card.id, signal(card.id, card.id.startsWith('new-') ? { isNew: true } : card.id === 'recent' ? { lastGrade: 0, daysSinceSeen: 0 } : {}),
    ]))
    const deck = buildBalancedBlitzDeck(cards, signals, 'A1', 12)
    expect(deck.cards.slice(0, 4).map(card => card.id)).toEqual(known.slice(0, 4).map(card => card.id))
    expect(deck.cards[4].id).toBe('new-short')
    expect(deck.cards[8].id).toBe('new-long')
    expect(deck.cards.at(-1)?.id).toBe('recent')
    expect(deck.newCardIds).toEqual(['new-short', 'new-long'])
  })

  it('começa pelo conteúdo novo mais curto quando não há histórico e rejeita material acima do nível', () => {
    const cards = [
      { id: 'long', english_phrase: 'We have been waiting here since before the buses stopped running.' },
      { id: 'hard', english_phrase: 'She left.' },
      { id: 'new-a', english_phrase: "I'm the king of the world!" },
      { id: 'new-b', english_phrase: 'I am your father.' },
      { id: 'duplicate', english_phrase: 'I am your father.' },
      { id: 'unfamiliar', english_phrase: 'I see the bus.' },
    ]
    const signals = new Map(cards.map(card => [card.id, signal(card.id, { isNew: true, packLevel: card.id === 'hard' ? 'B2' : 'A1' })]))
    expect(buildBalancedBlitzDeck(cards, signals, 'A1', 40)).toEqual({
      cards: [cards[3], cards[2]], newCardIds: ['new-b', 'new-a'],
    })
  })

  it('prioriza to be no aquecimento e só introduz falas curadas quando disponíveis no nível', () => {
    const cards = [
      { id: 'regular', english_phrase: 'I eat at noon.' },
      { id: 'verb', english_phrase: 'We are ready for class.' },
      { id: 'simple-new', english_phrase: 'I see the bus.' },
      { id: 'dialogue', english_phrase: 'I am your father.' },
      { id: 'over-level', english_phrase: 'You had me at hello.' },
    ]
    const signals = new Map([
      ['regular', signal('regular', { packName: 'Verbos do dia a dia' })],
      ['verb', signal('verb', { packName: 'O verbo to be' })],
      ['simple-new', signal('simple-new', { isNew: true })],
      ['dialogue', signal('dialogue', { isNew: true })],
      ['over-level', signal('over-level', { isNew: true, packLevel: 'B1' })],
    ])
    const deck = buildBalancedBlitzDeck(cards, signals, 'A1', 20)
    expect(deck.cards.map(card => card.id)).toEqual(['verb', 'regular', 'dialogue'])
    expect(deck.newCardIds).toEqual(['dialogue'])
  })

  it('evita estruturas avançadas mesmo em frases curtas sem histórico em A1/A2', () => {
    expect(isSuitableNewBlitzPhrase('I have already seen it.', 'A1')).toBe(false)
    expect(isSuitableNewBlitzPhrase('I would have called.', 'A2')).toBe(false)
    expect(isSuitableNewBlitzPhrase('I would like some water.', 'A1')).toBe(true)
  })

  it.each(LEARNER_CEFR_LEVELS)('aplica a referência curricular de tamanho para frases novas em %s', level => {
    const max = stageGuidance(level, 'development').maxWords
    expect(isSuitableNewBlitzPhrase(Array(max).fill('word').join(' '), level)).toBe(true)
    expect(isSuitableNewBlitzPhrase(Array(max + 1).fill('word').join(' '), level)).toBe(false)
  })
})

describe('revisão automática seletiva', () => {
  it.each([
    ['I cannot drive.', 'I can drive.', true],
    ['I cannot drive.', "I can't drive.", false],
    ['I need fifteen tickets.', 'I need fifty tickets.', true],
    ['Take the train.', 'Take the bus.', true],
    ['Put the book on the shelf.', 'I want some tea.', true],
    ['I need a ticket.', 'I need a tikcet.', false],
    ['Where is the station?', 'Where is station', false],
    ['I am at home.', 'I am ay home.', false],
    ['I can go.', '!!!', false],
    ['I do not know.', "I don't know!", false],
  ])('classifica %s / %s como %s', (expected, answer, priority) => {
    for (const mode of ['typing', 'listening'] as const) {
      expect(isBlitzPriorityMiss(expected, { cardId: 'test', mode, answer })).toBe(priority)
    }
  })
  it('não penaliza automaticamente uma possível paráfrase na escrita', () => {
    expect(isBlitzPriorityMiss('I need to buy a ticket.', {
      cardId: 'a', mode: 'typing', answer: 'I need to purchase a ticket.',
    })).toBe(false)
  })
})

describe('recomendação do resultado', () => {
  const miss: BlitzMiss = { id: '1', cardId: 'a', englishPhrase: '', portugueseHint: '', mode: 'typing' }

  it('considera os tipos de dificuldade depois de dois erros', () => {
    expect(getBlitzStudyRecommendation([miss])).toBeNull()
    expect(getBlitzStudyRecommendation([miss, { ...miss, id: '2' }])?.href).toBe('/review?mode=guided')
    expect(getBlitzStudyRecommendation([miss, { ...miss, mode: 'listening' }])?.href).toBe('/review')
    expect(getBlitzStudyRecommendation([{ ...miss, wasNew: true }, { ...miss, wasNew: true }])?.href).toBe('/courses#trilha')
  })
})
