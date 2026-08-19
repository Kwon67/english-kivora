import { describe, expect, it } from 'vitest'
import {
  isMatureReviewCard,
  pickRotatedPracticeMode,
  resolveReviewModesForCard,
} from '@/features/review/lib/reviewModes'

const baseContext = {
  cardId: 'card-abc',
  isNew: false,
  repetitions: 1,
  total_reviews: 2,
}

describe('isMatureReviewCard', () => {
  it('treats high repetitions as mature', () => {
    expect(isMatureReviewCard({ cardId: 'x', repetitions: 3, total_reviews: 1 })).toBe(true)
  })

  it('treats high total reviews as mature', () => {
    expect(isMatureReviewCard({ cardId: 'x', repetitions: 1, total_reviews: 4 })).toBe(true)
  })
})

describe('pickRotatedPracticeMode', () => {
  it('returns a stable mode for the same card id', () => {
    expect(pickRotatedPracticeMode('stable-id')).toBe(pickRotatedPracticeMode('stable-id'))
  })

  it('alternates between listening and typing across ids', () => {
    const modes = new Set(['card-a', 'card-b', 'card-c', 'card-d'].map(pickRotatedPracticeMode))
    expect(modes.size).toBeGreaterThan(1)
  })
})

describe('resolveReviewModesForCard', () => {
  it('card maduro não fica só no reconhecimento para sempre', () => {
    // A regra antiga devolvia [] em TODA revisão de card maduro: passadas quatro revisões o card
    // nunca mais pedia produção. Num baralho real isso valia para 91% dos cards.
    expect(
      resolveReviewModesForCard([], { cardId: 'mature', repetitions: 4, total_reviews: 2 })
    ).toEqual(['typing'])
  })

  it('cobra produção só na vez certa, não em toda revisão', () => {
    const naVez = resolveReviewModesForCard([], { cardId: 'm', repetitions: 4, total_reviews: 4 })
    const foraDaVez = resolveReviewModesForCard([], { cardId: 'm', repetitions: 4, total_reviews: 5 })
    expect(naVez).toEqual(['typing'])
    expect(foraDaVez).toEqual([])
  })

  it('NUNCA escolhe fala sozinha, nem quando é o modo mais fraco', () => {
    // SpeakingMode só avança depois de `submitted`. Sem reconhecimento de voz o usuário não
    // submete, e o card ficaria sem saída. Só entra se o próprio usuário escolher o modo.
    expect(
      resolveReviewModesForCard(['speaking'], { cardId: 'mature', repetitions: 4, total_reviews: 2 })
    ).toEqual(['typing'])
  })

  it('prefere o modo fraco ao padrão quando ele é seguro', () => {
    expect(
      resolveReviewModesForCard(['multiple_choice'], { cardId: 'mature', repetitions: 4, total_reviews: 2 })
    ).toEqual(['multiple_choice'])
  })

  it('não cobra produção de quem nunca revisou', () => {
    expect(
      resolveReviewModesForCard([], { cardId: 'm', repetitions: 4, total_reviews: 0 })
    ).toEqual([])
  })

  it('returns listening for new cards without weak modes', () => {
    expect(
      resolveReviewModesForCard([], {
        cardId: 'new-card',
        isNew: true,
        repetitions: 0,
        total_reviews: 0,
      })
    ).toEqual(['listening'])
  })

  it('returns a single weak mode without flashcard prefix', () => {
    expect(resolveReviewModesForCard(['speaking'], baseContext)).toEqual(['speaking'])
    expect(resolveReviewModesForCard(['listening', 'typing'], baseContext)).toEqual(['typing'])
  })

  it('deduplicates weak modes and ignores flashcard duplicates', () => {
    expect(resolveReviewModesForCard(['speaking', 'speaking', 'flashcard'], baseContext)).toEqual([
      'speaking',
    ])
  })

  it('returns one rotated mode for learning cards', () => {
    const modes = resolveReviewModesForCard([], baseContext)
    expect(modes).toHaveLength(1)
    expect(['listening', 'typing']).toContain(modes[0])
  })
})