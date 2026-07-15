import { describe, expect, it } from 'vitest'
import {
  buildCatQuestion,
  getCatQuestionDirection,
  isCatAnswerCorrect,
  type CatPoolCard,
} from './catPool'

const pool: CatPoolCard[] = [
  {
    id: 'c1',
    packId: 'p1',
    packLevel: 'A2',
    englishPhrase: 'I need some help.',
    portugueseTranslation: 'Eu preciso de ajuda.',
    acceptedTranslations: ['Preciso de ajuda.'],
  },
  {
    id: 'c2',
    packId: 'p1',
    packLevel: 'A2',
    englishPhrase: 'Where is the station?',
    portugueseTranslation: 'Onde fica a estação?',
    acceptedTranslations: [],
  },
  {
    id: 'c3',
    packId: 'p1',
    packLevel: 'A2',
    englishPhrase: 'She works from home.',
    portugueseTranslation: 'Ela trabalha de casa.',
    acceptedTranslations: [],
  },
  {
    id: 'c4',
    packId: 'p1',
    packLevel: 'A2',
    englishPhrase: 'We arrived early.',
    portugueseTranslation: 'Nós chegamos cedo.',
    acceptedTranslations: [],
  },
]

describe('catPool', () => {
  it('alternates in a reverse-language question every third item', () => {
    expect(getCatQuestionDirection(1)).toBe('english-to-portuguese')
    expect(getCatQuestionDirection(3)).toBe('portuguese-to-english')
  })

  it('builds reverse questions from real card phrases', () => {
    const question = buildCatQuestion(pool, 'A2', [], 3)

    expect(question?.direction).toBe('portuguese-to-english')
    expect(question?.options).toHaveLength(4)
    expect(question?.options).toContain(question?.correctOption)
  })

  it('scores both translation directions', () => {
    expect(isCatAnswerCorrect(pool[0], 'Preciso de ajuda.')).toBe(true)
    expect(
      isCatAnswerCorrect(pool[0], 'I need some help.', 'portuguese-to-english')
    ).toBe(true)
  })
})
