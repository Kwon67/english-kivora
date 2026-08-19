import { describe, expect, it } from 'vitest'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import {
  LEECH_LAPSES_THRESHOLD,
  isLeech,
  lapsesUntilLeech,
  nextLapseCount,
} from '@/features/review/lib/leech'

describe('contagem de lapsos', () => {
  it('conta quando um card JÁ graduado é esquecido', () => {
    expect(nextLapseCount(REVIEW_GRADE.AGAIN, 3, true)).toBe(4)
  })

  it('não conta erro de card que ainda está aprendendo', () => {
    // Errar enquanto aprende é o esperado — é para isso que existe a escada.
    expect(nextLapseCount(REVIEW_GRADE.AGAIN, 3, false)).toBe(3)
  })

  it('nota que passa não mexe no contador', () => {
    for (const g of [REVIEW_GRADE.HARD, REVIEW_GRADE.GOOD, REVIEW_GRADE.EASY]) {
      expect(nextLapseCount(g, 5, true)).toBe(5)
    }
  })

  it('nunca devolve número negativo', () => {
    expect(nextLapseCount(REVIEW_GRADE.GOOD, -3, true)).toBe(0)
  })
})

describe('condição de leech', () => {
  it('só a partir do limite', () => {
    expect(isLeech(LEECH_LAPSES_THRESHOLD - 1)).toBe(false)
    expect(isLeech(LEECH_LAPSES_THRESHOLD)).toBe(true)
  })

  it('trata ausência como zero', () => {
    expect(isLeech(null)).toBe(false)
    expect(isLeech(undefined)).toBe(false)
  })

  it('diz quantos lapsos faltam, para avisar antes de sumir', () => {
    expect(lapsesUntilLeech(LEECH_LAPSES_THRESHOLD - 2)).toBe(2)
    expect(lapsesUntilLeech(LEECH_LAPSES_THRESHOLD + 5)).toBe(0)
  })
})
