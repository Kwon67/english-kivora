import { describe, it, expect } from 'vitest'
import { saveReviewRecord } from './saveReviewRecord'
type RecordInput = Parameters<typeof saveReviewRecord>[1]
const record: RecordInput = { user_id: 'user', card_id: 'word', pack_id: 'pack', total_reviews: 1, next_review_date: '2026-11-13T12:00:00.000Z' }
function database(initial: RecordInput | null = null) {
  let current = initial
  let fail = false, lose = false
  const db = { from() {
    let op = '', payload: RecordInput, expected: unknown
    const chain = {
      insert(value: RecordInput) { op = 'insert'; payload = value; return chain },
      update(value: RecordInput) { op = 'update'; payload = value; return chain },
      eq(key: string, value: unknown) { if (key === 'total_reviews') expected = value; return chain },
      select() { return chain }, maybeSingle() { return chain },
      then(resolve: (result: unknown) => unknown, reject?: (error: unknown) => unknown) { return Promise.resolve().then(() => {
        if (fail) return { data: null, error: { code: 'network' } }
        if (op === 'insert' && current) return { data: null, error: { code: '23505' } }
        if (op === 'update' && current?.total_reviews !== expected) return { data: null, error: null }
        current = payload
        if (lose) throw new Error('Lost response')
        return { data: { card_id: record.card_id }, error: null }
      }).then(resolve, reject) },
    }; return chain
  } }
  return { db: db as unknown as Parameters<typeof saveReviewRecord>[0], current: () => current, fail: () => { fail = true }, lose: () => { lose = true } }
}
describe('confirmed review writes', () => {
  it('lets only one of two tabs create the initial review', async () => {
    const state = database(); let effects = 0
    const results = await Promise.allSettled([0, 1].map(() => saveReviewRecord(state.db, record, 0).then(() => effects++)))
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1); expect(effects).toBe(1); expect(state.current()?.total_reviews).toBe(1)
  })
  it('compares the stored version atomically for two concurrent updates', async () => {
    const state = database({ ...record, total_reviews: 3 }); let effects = 0
    await Promise.allSettled([0, 1].map(() => saveReviewRecord(state.db, { ...record, total_reviews: 4 }, 3, true).then(() => effects++)))
    expect(effects).toBe(1); expect(state.current()?.total_reviews).toBe(4)
  })
  it('does not repeat the update when its successful response was lost', async () => {
    const state = database({ ...record, total_reviews: 2 }); state.lose()
    await expect(saveReviewRecord(state.db, { ...record, total_reviews: 3 }, 2, true)).rejects.toThrow()
    await expect(saveReviewRecord(state.db, { ...record, total_reviews: 3 }, 2, true)).rejects.toThrow()
    expect(state.current()?.total_reviews).toBe(3)
  })
  it('retains the old state on failure and permits seeded zero-review records', async () => {
    const failure = database(record); failure.fail()
    await expect(saveReviewRecord(failure.db, { ...record, total_reviews: 2 }, 1, true)).rejects.toThrow(); expect(failure.current()?.total_reviews).toBe(1)
    const seeded = database({ ...record, total_reviews: 0 }); await saveReviewRecord(seeded.db, record, 0, true); expect(seeded.current()?.total_reviews).toBe(1)
  })
})
