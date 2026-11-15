import { describe, it, expect } from 'vitest'
import { persistQuickWord } from './quickWordService'
import { QuickWordSchema } from './quickWord'
import { wordId } from './wordId'
type Row = Record<string, unknown>
function database() {
  const rows: Record<string, Row[]> = { packs: [], cards: [], assignments: [] }
  const failures: Record<string, number> = {}
  const db = { from(table: string) {
    let operation = 'select', value: Row = {}, single = false
    const filters: [string, unknown][] = []
    const chain = {
      select() { return chain }, eq(key: string, val: unknown) { filters.push([key, val]); return chain }, limit() { return chain }, maybeSingle() { single = true; return chain },
      insert(input: Row) { operation = 'insert'; value = input; return chain },
      then(resolve: (result: unknown) => unknown) {
        return Promise.resolve().then(() => {
          const failure = `${table}:${operation}`
          if (failures[failure]) { failures[failure]--; return { data: null, error: { code: 'network' } } }
          if (operation === 'insert') {
            if (rows[table].some(row => row.id === value.id)) return { data: null, error: { code: '23505' } }
            rows[table].push(value); return { data: null, error: null }
          }
          const found = rows[table].filter(row => filters.every(([key, val]) => row[key] === val))
          return { data: single ? found[0] || null : found, error: null }
        }).then(resolve)
      },
    }; return chain
  } }
  return { rows, failures, db: db as unknown as Parameters<typeof persistQuickWord>[0] }
}
const input = { cardId: '11111111-1111-4111-8111-111111111111', packId: '22222222-2222-4222-8222-222222222222', createCollection: true, en: 'take a break', pt: 'fazer uma pausa' }
describe('quick word persistence', () => {
  it('saves without requesting audio and includes the collection in the routine', async () => {
    const state = database(); expect((await persistQuickWord(state.db, 'owner', input)).success).toBe(true)
    expect(state.rows.cards).toHaveLength(1); expect(state.rows.cards[0].audio_url).toBeUndefined(); expect(state.rows.assignments).toHaveLength(1)
  })
  it('retries a lost response without duplicating a word or assignment', async () => {
    const state = database(); await persistQuickWord(state.db, 'owner', input); await persistQuickWord(state.db, 'owner', input)
    expect(state.rows.cards).toHaveLength(1); expect(state.rows.assignments).toHaveLength(1)
  })
  it('handles concurrent requests with the same stable keys', async () => {
    const state = database(); const results = await Promise.all([persistQuickWord(state.db, 'owner', input), persistQuickWord(state.db, 'owner', input)])
    expect(results.every(result => result.success)).toBe(true); expect(state.rows.packs).toHaveLength(1); expect(state.rows.cards).toHaveLength(1); expect(state.rows.assignments).toHaveLength(1)
  })
  it('concurrent different words create only one assignment', async () => {
    const state = database(); await Promise.all([persistQuickWord(state.db, 'owner', input), persistQuickWord(state.db, 'owner', { ...input, cardId: wordId(), en: 'hello' })])
    expect(state.rows.cards).toHaveLength(2); expect(state.rows.assignments).toHaveLength(1)
  })
  it('recovers a partial save without inserting the card twice', async () => {
    const state = database(); state.failures['assignments:insert'] = 1
    expect((await persistQuickWord(state.db, 'owner', input)).success).toBe(false)
    expect(state.rows.cards).toHaveLength(1)
    expect((await persistQuickWord(state.db, 'owner', input)).success).toBe(true)
    expect(state.rows.cards).toHaveLength(1); expect(state.rows.assignments).toHaveLength(1)
  })
  it('refuses another owner and a public collection before writing', async () => {
    for (const row of [{ owner_id: 'someone', is_public: false }, { owner_id: 'owner', is_public: true }]) {
      const state = database(); state.rows.packs.push({ id: input.packId, ...row })
      const result = await persistQuickWord(state.db, 'owner', input)
      expect(result.success).toBe(false); expect(state.rows.cards).toHaveLength(0)
    }
  })
  it('retains the original card when a key is reused with different content', async () => {
    const state = database(); await persistQuickWord(state.db, 'owner', input)
    expect((await persistQuickWord(state.db, 'owner', { ...input, en: 'changed' })).success).toBe(false)
    expect(state.rows.cards[0].english_phrase).toBe(input.en)
  })
  it('does not accept whitespace-only words and makes valid UUIDs without randomUUID', () => {
    expect(QuickWordSchema.safeParse({ ...input, en: ' ' }).success).toBe(false)
    expect(QuickWordSchema.safeParse({ ...input, cardId: wordId() }).success).toBe(true)
  })
})
