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

describe('review queue limits', () => {
  it('limits the review session to 30 cards when the backlog is larger', async () => {
    const reviews = Array.from({ length: 40 }, (_, index) => makeReview(index))
    const queue = await getReviewQueueForUser(makeSupabase(reviews), 'user-1')

    expect(queue.dueCards).toHaveLength(DEFAULT_REVIEW_SESSION_CARD_LIMIT)
    expect(queue.totalDue).toBe(DEFAULT_REVIEW_SESSION_CARD_LIMIT)
    expect(queue.dueToday).toBe(DEFAULT_REVIEW_SESSION_CARD_LIMIT)
    expect(queue.totalBacklogDue).toBe(40)
    expect(queue.deferredDue).toBe(10)
  })

  it('keeps the session capped at 30 when reviews are overdue by 5 or 10 days', async () => {
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

    expect(queue.dueCards).toHaveLength(30)
    expect(queue.totalDue).toBe(30)
    expect(queue.totalBacklogDue).toBe(120)
    expect(queue.deferredDue).toBe(90)
  })

  it('does not allow callers to raise the session limit above 30', async () => {
    const reviews = Array.from({ length: 80 }, (_, index) => makeReview(index))
    const queue = await getReviewQueueForUser(makeSupabase(reviews), 'user-1', { sessionLimit: 100 })

    expect(queue.sessionLimit).toBe(30)
    expect(queue.dueCards).toHaveLength(30)
    expect(queue.totalDue).toBe(30)
  })

  it('uses the remaining daily capacity after cards were already reviewed today', async () => {
    const today = getAppDateString()
    const tomorrow = shiftAppDate(today, 1)
    const reviewedToday = Array.from({ length: 12 }, (_, index) =>
      makeReview(index, {
        review_date: appNoonIso(today),
        next_review_date: appNoonIso(tomorrow),
      })
    )
    const dueReviews = Array.from({ length: 25 }, (_, index) => makeReview(index + 100))
    const summary = await getReviewQueueSummaryForUser(makeSupabase([...reviewedToday, ...dueReviews]), 'user-1')

    expect(summary.dailyCardsReviewed).toBe(12)
    expect(summary.totalDue).toBe(18)
    expect(summary.dueToday).toBe(18)
    expect(summary.totalBacklogDue).toBe(25)
    expect(summary.deferredDue).toBe(7)
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
    expect(summary.totalDue).toBe(20)
    expect(summary.deferredDue).toBe(0)
  })

  it('fills remaining session slots with new cards without exceeding the cap', async () => {
    const reviews = Array.from({ length: 25 }, (_, index) => makeReview(index))
    const newCards = Array.from({ length: 20 }, (_, index) =>
      makeCard(index + 1000, { id: `new-card-${index}` })
    )
    const queue = await getReviewQueueForUser(makeSupabase(reviews, newCards), 'user-1')

    expect(queue.dueCards).toHaveLength(DEFAULT_REVIEW_SESSION_CARD_LIMIT)
    expect(queue.dueToday).toBe(25)
    expect(queue.newCards).toBe(5)
    expect(queue.totalBacklogDue).toBe(35)
    expect(queue.deferredDue).toBe(5)
  })
})
