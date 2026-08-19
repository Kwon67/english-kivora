import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REVIEW_SESSION_CARD_LIMIT,
  getReviewQueueForUser,
  getReviewQueueSummaryForUser,
} from './reviewQueue'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

type TestRow = Record<string, unknown>

function createSupabaseMock(tables: Record<string, TestRow[]>) {
  return {
    from(table: string) {
      const rows = tables[table] || []

      return {
        select: () => ({
          eq: (column: string, value: string) =>
            Promise.resolve({
              data: rows.filter((row) => row[column] === value),
              error: null,
            }),
          in: (column: string, values: string[]) => ({
            order: (orderColumn: string, options?: { ascending?: boolean }) =>
              Promise.resolve({
                data: rows
                  .filter((row) => values.includes(String(row[column])))
                  .sort((a, b) => {
                    const left = String(a[orderColumn] || '')
                    const right = String(b[orderColumn] || '')
                    return options?.ascending === false ? right.localeCompare(left) : left.localeCompare(right)
                  }),
                error: null,
              }),
          }),
        }),
      }
    },
  }
}

function appNoonIso(dateString: string) {
  return `${dateString}T12:00:00-03:00`
}

function makeCard(index: number, overrides: TestRow = {}) {
  return {
    id: `card-${index}`,
    pack_id: 'pack-1',
    created_at: `2026-01-${String((index % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
    english_phrase: `Phrase ${index}`,
    portuguese_translation: `Frase ${index}`,
    audio_url: null,
    packs: { id: 'pack-1', name: 'Pack 1' },
    ...overrides,
  }
}

function makeReview(index: number, overrides: TestRow = {}) {
  const yesterday = shiftAppDate(getAppDateString(), -1)

  return {
    id: `review-${index}`,
    user_id: 'user-1',
    card_id: `card-${index}`,
    pack_id: 'pack-1',
    review_date: appNoonIso(yesterday),
    next_review_date: appNoonIso(yesterday),
    interval_days: 1,
    ease_factor: 2.5,
    repetitions: 2,
    total_reviews: 2,
    cards: makeCard(index),
    packs: { id: 'pack-1', name: 'Pack 1' },
    ...overrides,
  }
}

function makeSupabase(reviews: TestRow[], cards: TestRow[] = []) {
  return createSupabaseMock({
    assignments: [{ user_id: 'user-1', pack_id: 'pack-1', status: 'completed' }],
    card_reviews: reviews,
    cards,
  }) as unknown as Parameters<typeof getReviewQueueForUser>[0]
}

function makeSupabaseWithoutEligiblePacks(reviews: TestRow[]) {
  return createSupabaseMock({
    assignments: [{ user_id: 'user-1', pack_id: 'pack-1', status: 'pending' }],
    card_reviews: reviews,
    cards: [],
  }) as unknown as Parameters<typeof getReviewQueueForUser>[0]
}

describe('review queue limits', () => {
  it('limits the review session to 10 cards when the backlog is larger', async () => {
    const reviews = Array.from({ length: 40 }, (_, index) => makeReview(index))
    const queue = await getReviewQueueForUser(makeSupabase(reviews), 'user-1')

    expect(queue.dueCards).toHaveLength(DEFAULT_REVIEW_SESSION_CARD_LIMIT)
    expect(queue.totalDue).toBe(DEFAULT_REVIEW_SESSION_CARD_LIMIT)
    expect(queue.dueToday).toBe(DEFAULT_REVIEW_SESSION_CARD_LIMIT)
    expect(queue.totalBacklogDue).toBe(40)
    expect(queue.deferredDue).toBe(30)
  })

  it('keeps the session capped at 10 when reviews are overdue by 5 or 10 days', async () => {
    const today = getAppDateString()
    const fiveDaysAgo = shiftAppDate(today, -5)
    const tenDaysAgo = shiftAppDate(today, -10)
    const reviews = [
      ...Array.from({ length: 60 }, (_, index) =>
        makeReview(index, { next_review_date: appNoonIso(fiveDaysAgo) })
      ),
      ...Array.from({ length: 60 }, (_, index) =>
        makeReview(index + 100, { next_review_date: appNoonIso(tenDaysAgo) })
      ),
    ]
    const queue = await getReviewQueueForUser(makeSupabase(reviews), 'user-1')

    expect(queue.dueCards).toHaveLength(10)
    expect(queue.totalDue).toBe(10)
    expect(queue.totalBacklogDue).toBe(120)
    expect(queue.deferredDue).toBe(110)
  })

  it('does not allow callers to raise the session limit above 10', async () => {
    const reviews = Array.from({ length: 80 }, (_, index) => makeReview(index))
    const queue = await getReviewQueueForUser(makeSupabase(reviews), 'user-1', { sessionLimit: 100 })
    const summary = await getReviewQueueSummaryForUser(makeSupabase(reviews), 'user-1', { sessionLimit: 100 })

    expect(queue.sessionLimit).toBe(10)
    expect(queue.dueCards).toHaveLength(10)
    expect(queue.totalDue).toBe(10)
    expect(summary.sessionLimit).toBe(10)
    expect(summary.totalDue).toBe(10)
  })

  it('não deixa o que já foi revisado hoje encolher a próxima sessão', async () => {
    const today = getAppDateString()
    const tomorrow = shiftAppDate(today, 1)
    const reviewedToday = Array.from({ length: 4 }, (_, index) =>
      makeReview(index, {
        review_date: appNoonIso(today),
        next_review_date: appNoonIso(tomorrow),
      })
    )
    const dueReviews = Array.from({ length: 25 }, (_, index) => makeReview(index + 100))
    const queue = await getReviewQueueForUser(makeSupabase([...reviewedToday, ...dueReviews]), 'user-1')
    const summary = await getReviewQueueSummaryForUser(makeSupabase([...reviewedToday, ...dueReviews]), 'user-1')

    // Antes esta conta era `sessionLimit - dailyCardsReviewed`, então 4 respostas já dadas hoje
    // deixavam a sessão seguinte com 6 cards, e 10 respostas zeravam a tela até a meia-noite.
    // Sessão e dia agora são tetos separados: a sessão continua servindo 10.
    expect(queue.dueCards).toHaveLength(10)
    expect(queue.totalDue).toBe(10)
    expect(summary.dailyCardsReviewed).toBe(4)
    expect(summary.totalDue).toBe(10)
    expect(summary.dueToday).toBe(10)
    expect(summary.totalBacklogDue).toBe(25)
    expect(summary.deferredDue).toBe(15)
  })

  it('does not count materialized but unreviewed scheduled cards as reviewed today', async () => {
    const today = getAppDateString()
    const reviews = Array.from({ length: 20 }, (_, index) =>
      makeReview(index, {
        review_date: appNoonIso(today),
        total_reviews: 0,
      })
    )
    const summary = await getReviewQueueSummaryForUser(makeSupabase(reviews), 'user-1')

    expect(summary.dailyCardsReviewed).toBe(0)
    expect(summary.totalDue).toBe(10)
    expect(summary.deferredDue).toBe(10)
  })

  it('fills remaining session slots with new cards without exceeding the cap', async () => {
    const reviews = Array.from({ length: 6 }, (_, index) => makeReview(index))
    const newCards = Array.from({ length: 20 }, (_, index) =>
      makeCard(index + 1000, { id: `new-card-${index}` })
    )
    const queue = await getReviewQueueForUser(makeSupabase(reviews, newCards), 'user-1')

    expect(queue.dueCards).toHaveLength(DEFAULT_REVIEW_SESSION_CARD_LIMIT)
    expect(queue.dueToday).toBe(6)
    expect(queue.newCards).toBe(4)
    expect(queue.totalBacklogDue).toBe(16)
    expect(queue.deferredDue).toBe(6)
  })

  it('still surfaces already-started reviews even when no pack is currently eligible', async () => {
    const reviews = Array.from({ length: 3 }, (_, index) => makeReview(index))
    const queue = await getReviewQueueForUser(makeSupabaseWithoutEligiblePacks(reviews), 'user-1')
    const summary = await getReviewQueueSummaryForUser(makeSupabaseWithoutEligiblePacks(reviews), 'user-1')

    expect(queue.dueCards).toHaveLength(3)
    expect(queue.totalDue).toBe(3)
    expect(queue.newCards).toBe(0)
    expect(summary.totalDue).toBe(3)
    expect(summary.newCards).toBe(0)
  })
})

describe('atraso acumulado não pode travar a fila', () => {
  it('continua servindo cards depois de estourar o antigo teto de 10 no mesmo dia', async () => {
    // O caso real relatado: 11 cards revisados de madrugada e 88 vencidos esperando. Com a conta
    // antiga a capacidade virava max(10 - 11, 0) = 0 e a tela de revisão ficava vazia o dia todo,
    // enquanto o card mais atrasado já tinha 48 dias.
    const today = getAppDateString()
    const tomorrow = shiftAppDate(today, 1)
    const revisadosHoje = Array.from({ length: 11 }, (_, index) =>
      makeReview(index, { review_date: appNoonIso(today), next_review_date: appNoonIso(tomorrow) })
    )
    const vencidos = Array.from({ length: 88 }, (_, index) => makeReview(index + 200))

    const queue = await getReviewQueueForUser(makeSupabase([...revisadosHoje, ...vencidos]), 'user-1')
    const summary = await getReviewQueueSummaryForUser(makeSupabase([...revisadosHoje, ...vencidos]), 'user-1')

    expect(summary.dailyCardsReviewed).toBe(11)
    expect(queue.dueCards.length).toBeGreaterThan(0)
    expect(queue.dueCards).toHaveLength(10)
    expect(summary.totalDue).toBe(10)
  })

  it('serve os cards mais atrasados primeiro, para o atraso realmente drenar', async () => {
    const today = getAppDateString()
    const recentes = Array.from({ length: 20 }, (_, index) =>
      makeReview(index + 300, { next_review_date: appNoonIso(shiftAppDate(today, -2)) })
    )
    const antigos = Array.from({ length: 20 }, (_, index) =>
      makeReview(index + 400, { next_review_date: appNoonIso(shiftAppDate(today, -40)) })
    )
    const queue = await getReviewQueueForUser(makeSupabase([...recentes, ...antigos]), 'user-1')

    // Os 10 servidos têm de sair todos do lote de 40 dias de atraso, senão o mais antigo nunca sai
    // da fila e o atraso envelhece para sempre.
    expect(queue.dueCards).toHaveLength(10)
    expect(queue.dueCards.every((c) => Number(c.id.replace('review-', '')) >= 400)).toBe(true)
  })

  it('ainda respeita um teto diário, para o atraso não virar maratona', async () => {
    const today = getAppDateString()
    const tomorrow = shiftAppDate(today, 1)
    const jaFeitosHoje = Array.from({ length: 118 }, (_, index) =>
      makeReview(index, { review_date: appNoonIso(today), next_review_date: appNoonIso(tomorrow) })
    )
    const vencidos = Array.from({ length: 50 }, (_, index) => makeReview(index + 500))
    const queue = await getReviewQueueForUser(makeSupabase([...jaFeitosHoje, ...vencidos]), 'user-1')

    // 120 - 118 = 2 restantes no dia, mesmo com 50 vencidos e sessão de 10.
    expect(queue.dueCards).toHaveLength(2)
  })
})
