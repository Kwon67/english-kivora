import { describe, expect, it } from 'vitest'
import { releaseScheduledCard } from './releaseScheduledCard'

type Row = { user_id: string; card_id: string; pack_id: string; total_reviews: number; next_review_date: string; quality: number }
const row: Row = { user_id: 'u', card_id: 'c', pack_id: 'p', total_reviews: 4, next_review_date: '2026-01-01T00:00:00Z', quality: 4 }
function store(initial: Row | null) {
  let current = initial
  const db = { from() { return {
    insert(record: Row) { if (current) return Promise.resolve({ error: { code: '23505' } }); current = record; return Promise.resolve({ error: null }) },
    update(patch: Partial<Row>) { let version: number | null = null; const chain = { eq(key: string, value: unknown) { if (key === 'total_reviews') version = Number(value); return chain }, then(resolve: (value: unknown) => unknown) { if (current && current.total_reviews === version) current = { ...current, ...patch }; return Promise.resolve({ error: null }).then(resolve) } }; return chain },
  } } }
  return { db: db as never, read: () => current, advance: () => { if (current) current = { ...current, total_reviews: 5, quality: 5 } } }
}
describe('releaseScheduledCard', () => {
  it('altera somente o vencimento e preserva a nota anterior', async () => {
    const state = store({ ...row })
    await releaseScheduledCard(state.db, { ...row, quality: 0, next_review_date: '2026-02-01T00:00:00Z' }, 4)
    expect(state.read()).toMatchObject({ quality: 4, total_reviews: 4, next_review_date: '2026-02-01T00:00:00Z' })
  })
  it('não sobrescreve uma revisão que avançou simultaneamente', async () => {
    const state = store({ ...row }); state.advance()
    await releaseScheduledCard(state.db, row, 4)
    expect(state.read()).toMatchObject({ quality: 5, total_reviews: 5 })
  })
  it('não substitui uma linha criada por outra operação', async () => {
    const state = store({ ...row })
    await releaseScheduledCard(state.db, { ...row, quality: 0 }, null)
    expect(state.read()?.quality).toBe(4)
  })
})
