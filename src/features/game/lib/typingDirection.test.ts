import { describe, expect, it } from 'vitest'
import { resolveTypingDirectionForPack } from '@/features/game/lib/typingDirection'

describe('resolveTypingDirectionForPack', () => {
  it('primeiro contato com o pack: compreensão, não produção', () => {
    expect(resolveTypingDirectionForPack({ completedAssignmentsBefore: 0, cardsInSpacedRepetition: 0 })).toBe('en-to-pt')
  })

  it('pack já concluído antes em qualquer modo: produção', () => {
    expect(resolveTypingDirectionForPack({ completedAssignmentsBefore: 1, cardsInSpacedRepetition: 0 })).toBe('pt-to-en')
  })

  it('cards do pack já na repetição espaçada: produção', () => {
    expect(resolveTypingDirectionForPack({ completedAssignmentsBefore: 0, cardsInSpacedRepetition: 3 })).toBe('pt-to-en')
  })
})
