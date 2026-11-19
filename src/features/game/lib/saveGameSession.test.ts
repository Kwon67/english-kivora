import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { saveGameSessionRecord } from './saveGameSession'
const input = { id: 'stable', user_id: 'owner', assignment_id: 'lesson', correct_answers: 3, wrong_answers: 1, max_streak: 2 }
describe('game result idempotency', () => {
  it('confirms a matching saved result without reinserting or replaying evidence', async () => {
    const query = { eq: vi.fn(() => query), maybeSingle: async () => ({ data: input, error: null }) }
    const db = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ error: { code: '23505' } }) }) }), select: () => query }) } as unknown as SupabaseClient
    expect(await saveGameSessionRecord(db, input)).toEqual({ id: 'stable', existing: true })
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner')
    await expect(saveGameSessionRecord(db, { ...input, correct_answers: 4 })).rejects.toThrow('confirmar')
  })
  it('never treats a network failure as confirmed', async () => {
    const db = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ error: { code: '08006' } }) }) }) }) } as unknown as SupabaseClient
    await expect(saveGameSessionRecord(db, input)).rejects.toThrow('confirmar')
  })
})
