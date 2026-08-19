import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import { describe, expect, it } from 'vitest'
import { HARD_INTERVAL_MULTIPLIER, EASY_INTERVAL_BONUS, calculateNextReview } from './spacedRepetition'

describe('calculateNextReview — failing quality differentiation', () => {
  it('penalizes a total blackout (quality 0) more than a near-miss (quality 2)', () => {
    const blackout = calculateNextReview(0, 6, 2.5, 2)
    const nearMiss = calculateNextReview(2, 6, 2.5, 2)

    expect(blackout.easeFactor).toBeLessThan(nearMiss.easeFactor)
    expect(blackout.easeFactor).toBeCloseTo(1.7, 2) // 2.5 - 0.8
    expect(nearMiss.easeFactor).toBeCloseTo(2.18, 2) // 2.5 - 0.32
  })

  it('still resets repetitions and interval to 1 on any failing quality', () => {
    const blackout = calculateNextReview(0, 30, 2.5, 4)
    const nearMiss = calculateNextReview(2, 30, 2.5, 4)

    expect(blackout.repetitions).toBe(0)
    expect(blackout.intervalDays).toBe(1)
    expect(nearMiss.repetitions).toBe(0)
    expect(nearMiss.intervalDays).toBe(1)
  })

  it('floors the ease factor at 1.3 even after repeated blackouts', () => {
    const result = calculateNextReview(0, 1, 1.3, 0)
    expect(result.easeFactor).toBe(1.3)
  })

  it('avança o passo normal no BOM, usando o ease', () => {
    const good = calculateNextReview(REVIEW_GRADE.GOOD, 6, 2.5, 2)
    expect(good.easeFactor).toBeCloseTo(2.5, 2)
    expect(good.repetitions).toBe(3)
    expect(good.intervalDays).toBe(Math.round(6 * 2.5))
  })
})

describe('as três notas que passam precisam ser distintas', () => {
  // O bug relatado: num card graduado o intervalo era sempre `intervalo × ease antigo`, então
  // Difícil, Bom e Fácil mostravam o MESMO valor — um card de 24 dias com ease 2,5 exibia
  // "2 meses" nos três botões, e a escolha do usuário não mudava nada no agendamento.
  const INTERVALO = 24
  const EASE = 2.5
  const REPS = 5

  it('não repete o mesmo intervalo em Difícil, Bom e Fácil', () => {
    const dias = [REVIEW_GRADE.HARD, REVIEW_GRADE.GOOD, REVIEW_GRADE.EASY].map(
      (g) => calculateNextReview(g, INTERVALO, EASE, REPS).intervalDays
    )
    expect(new Set(dias).size).toBe(3)
  })

  it('mantém a ordem: Difícil < Bom < Fácil', () => {
    const [dificil, bom, facil] = [REVIEW_GRADE.HARD, REVIEW_GRADE.GOOD, REVIEW_GRADE.EASY].map(
      (g) => calculateNextReview(g, INTERVALO, EASE, REPS).intervalDays
    )
    expect(dificil).toBeLessThan(bom)
    expect(bom).toBeLessThan(facil)
  })

  it('Difícil anda por um fator fixo, não pelo ease', () => {
    const comEaseAlto = calculateNextReview(REVIEW_GRADE.HARD, INTERVALO, 2.8, REPS).intervalDays
    const comEaseBaixo = calculateNextReview(REVIEW_GRADE.HARD, INTERVALO, 1.4, REPS).intervalDays
    expect(comEaseAlto).toBe(comEaseBaixo)
    expect(comEaseAlto).toBe(Math.round(INTERVALO * HARD_INTERVAL_MULTIPLIER))
  })

  it('Fácil aplica o bônus por cima do ease', () => {
    const facil = calculateNextReview(REVIEW_GRADE.EASY, INTERVALO, EASE, REPS).intervalDays
    expect(facil).toBe(Math.round(INTERVALO * EASE * EASY_INTERVAL_BONUS))
  })

  it('nunca encolhe o intervalo de um card graduado, mesmo com o ease no piso', () => {
    const noPiso = calculateNextReview(REVIEW_GRADE.HARD, 100, 1.3, REPS).intervalDays
    expect(noPiso).toBeGreaterThan(100)
  })
})
