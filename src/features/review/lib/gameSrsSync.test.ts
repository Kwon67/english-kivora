import { describe, expect, it } from 'vitest'
import { planGameSrsWrites, type ExistingReviewRow } from '@/features/review/lib/gameSrsSync'
import { LEECH_LAPSES_THRESHOLD } from '@/features/review/lib/leech'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'

const NOW = new Date('2026-09-14T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

function row(overrides: Partial<ExistingReviewRow> & { card_id: string }): ExistingReviewRow {
  return {
    pack_id: 'pack-1',
    interval_days: 0,
    ease_factor: 2.5,
    repetitions: 0,
    total_reviews: 0,
    learning_step: null,
    lapses: 0,
    next_review_date: NOW.toISOString(),
    ...overrides,
  }
}

function plan(input: {
  existing?: ExistingReviewRow[]
  missed?: string[]
  correct?: string[]
  known?: string[]
}) {
  const cardIds = [...new Set([...(input.missed ?? []), ...(input.correct ?? []), ...(input.known ?? [])])]
  return planGameSrsWrites({
    userId: 'user-1',
    now: NOW,
    packIdByCardId: new Map(cardIds.map((id) => [id, 'pack-1'])),
    existingByCardId: new Map((input.existing ?? []).map((item) => [item.card_id, item])),
    missedCardIds: input.missed ?? [],
    correctCardIds: input.correct,
  })
}

describe('planGameSrsWrites', () => {
  it('erro num card maduro passa pela escada: guarda metade do intervalo, mantém as repetições, conta lapso', () => {
    const mature = row({
      card_id: 'c1',
      interval_days: 60,
      repetitions: 6,
      lapses: 2,
      next_review_date: new Date(NOW.getTime() + 30 * DAY_MS).toISOString(),
    })

    const [write] = plan({ existing: [mature], missed: ['c1'] })

    expect(write.quality).toBe(REVIEW_GRADE.AGAIN)
    // O caminho antigo (SM-2 cru) devolvia interval 1, repetitions 0, lapses intocado.
    expect(write.interval_days).toBe(30)
    expect(write.repetitions).toBe(6)
    expect(write.lapses).toBe(3)
    expect(write.learning_step).toBe(0)
    // Volta em minutos (reaprendizagem), não em um dia.
    expect(new Date(write.next_review_date).getTime() - NOW.getTime()).toBe(10 * 60 * 1000)
    expect(write.total_reviews).toBe(1)
  })

  it('card vencido errado no jogo É punido — antes era pulado por "já está agendado para hoje"', () => {
    const due = row({
      card_id: 'c1',
      interval_days: 10,
      repetitions: 3,
      next_review_date: new Date(NOW.getTime() - 2 * DAY_MS).toISOString(),
    })

    const writes = plan({ existing: [due], missed: ['c1'] })

    expect(writes).toHaveLength(1)
    expect(writes[0].lapses).toBe(1)
    expect(writes[0].interval_days).toBe(5)
  })

  it('erro em card sem histórico cria a linha na escada de card novo (1 min)', () => {
    const [write] = plan({ missed: ['c9'] })

    expect(write.learning_step).toBe(0)
    expect(write.interval_days).toBe(0)
    expect(write.repetitions).toBe(0)
    expect(write.lapses).toBe(0)
    expect(new Date(write.next_review_date).getTime() - NOW.getTime()).toBe(60 * 1000)
  })

  it('acerto em card VENCIDO conta como Bom e adianta o intervalo', () => {
    const due = row({
      card_id: 'c1',
      interval_days: 10,
      repetitions: 3,
      total_reviews: 4,
      next_review_date: new Date(NOW.getTime() - DAY_MS).toISOString(),
    })

    const [write] = plan({ existing: [due], correct: ['c1'] })

    expect(write.quality).toBe(REVIEW_GRADE.GOOD)
    expect(write.interval_days).toBeGreaterThan(10)
    expect(write.repetitions).toBe(4)
    expect(write.lapses).toBe(0)
    expect(write.total_reviews).toBe(5)
  })

  it('acerto em card que NÃO venceu não adianta o relógio', () => {
    const early = row({
      card_id: 'c1',
      interval_days: 10,
      repetitions: 3,
      next_review_date: new Date(NOW.getTime() + 5 * DAY_MS).toISOString(),
    })

    expect(plan({ existing: [early], correct: ['c1'] })).toHaveLength(0)
  })

  it('acerto em card sem histórico não cria linha — material novo continua entrando pela revisão', () => {
    expect(plan({ correct: ['c9'] })).toHaveLength(0)
  })

  it('leech não recebe crédito automático', () => {
    const leech = row({
      card_id: 'c1',
      interval_days: 1,
      repetitions: 2,
      lapses: LEECH_LAPSES_THRESHOLD,
      next_review_date: new Date(NOW.getTime() - DAY_MS).toISOString(),
    })

    expect(plan({ existing: [leech], correct: ['c1'] })).toHaveLength(0)
  })

  it('errado e depois acertado na mesma partida: vale o erro, uma gravação só', () => {
    const due = row({ card_id: 'c1', interval_days: 10, repetitions: 3 })

    const writes = plan({ existing: [due], missed: ['c1'], correct: ['c1'] })

    expect(writes).toHaveLength(1)
    expect(writes[0].quality).toBe(REVIEW_GRADE.AGAIN)
  })

  it('ignora cards que não pertencem ao pack confirmado', () => {
    const writes = planGameSrsWrites({
      userId: 'user-1',
      now: NOW,
      packIdByCardId: new Map([['c1', 'pack-1']]),
      existingByCardId: new Map(),
      missedCardIds: ['c1', 'intruso'],
    })

    expect(writes.map((write) => write.card_id)).toEqual(['c1'])
  })
})
