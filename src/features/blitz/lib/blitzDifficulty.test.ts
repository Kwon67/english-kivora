import { describe, expect, it } from 'vitest'
import {
  BLITZ_DIFFICULTIES,
  cefrForDifficulty,
  cefrRangeLabel,
  difficultyFromCefr,
  isBlitzDifficulty,
} from '@/features/blitz/lib/blitzDifficulty'

describe('as três opções', () => {
  it('oferece exatamente três, não os quatro níveis CEFR', () => {
    expect(BLITZ_DIFFICULTIES).toHaveLength(3)
    expect(BLITZ_DIFFICULTIES.map((d) => d.label)).toEqual(['Fácil', 'Médio', 'Difícil'])
  })

  it('cobre A1, A2, B1 e B2 sem deixar nível de fora nem repetir', () => {
    const cobertos = BLITZ_DIFFICULTIES.flatMap((d) => [...d.cefr])
    expect([...cobertos].sort()).toEqual(['A1', 'A2', 'B1', 'B2'])
  })

  it('vai do mais fácil para o mais difícil, sem pular', () => {
    const ordem = ['A1', 'A2', 'B1', 'B2']
    const primeiros = BLITZ_DIFFICULTIES.map((d) => ordem.indexOf(d.cefr[0]))
    expect(primeiros).toEqual([...primeiros].sort((a, b) => a - b))
  })
})

describe('links antigos continuam funcionando', () => {
  it('traduz cada nível CEFR para a dificuldade equivalente', () => {
    expect(difficultyFromCefr('A1')).toBe('facil')
    expect(difficultyFromCefr('A2')).toBe('facil')
    expect(difficultyFromCefr('B1')).toBe('medio')
    expect(difficultyFromCefr('B2')).toBe('dificil')
  })

  it('devolve null para o que não é nível', () => {
    expect(difficultyFromCefr('C1')).toBeNull()
    expect(difficultyFromCefr('')).toBeNull()
  })
})

describe('o que fica gravado no pack', () => {
  it('grava um CEFR válido para cada dificuldade', () => {
    expect(cefrForDifficulty('facil')).toBe('A2')
    expect(cefrForDifficulty('medio')).toBe('B1')
    expect(cefrForDifficulty('dificil')).toBe('B2')
  })

  it('o nível gravado pertence à faixa da própria dificuldade', () => {
    for (const d of BLITZ_DIFFICULTIES) {
      expect(d.cefr as readonly string[]).toContain(d.storedCefr)
    }
  })
})

describe('rótulo da faixa', () => {
  it('mostra faixa quando cobre mais de um nível e um só quando é único', () => {
    expect(cefrRangeLabel('facil')).toBe('A1–A2')
    expect(cefrRangeLabel('medio')).toBe('B1')
    expect(cefrRangeLabel('dificil')).toBe('B2')
  })
})

describe('validação', () => {
  it('aceita só os três ids', () => {
    expect(isBlitzDifficulty('facil')).toBe(true)
    expect(isBlitzDifficulty('dificil')).toBe(true)
    expect(isBlitzDifficulty('A1')).toBe(false)
    expect(isBlitzDifficulty(undefined)).toBe(false)
  })
})
