import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { emptyTodayDraft } from './todayLesson'
import { persistContextAttempt, type ContextAttempt } from './contextPracticePersistence'
const input: ContextAttempt = { attemptId: '11111111-1111-4111-8111-111111111111', level: 'A1', draft: { ...emptyTodayDraft('a1-meeting-01'), choice: 1, response: 'Hi, I am Lee.', revision: 'Hi Maya, I am Lee. Ten is fine. Can I bring a friend?' } }
describe('context practice persistence', () => {
  it('saves only for the authenticated user, without manufacturing a proficiency score', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const db = { from: vi.fn(() => ({ insert })) } as unknown as SupabaseClient
    expect(await persistContextAttempt(db, 'owner', input)).toEqual({ status: 'saved' })
    expect(insert.mock.calls[0][0]).toMatchObject({ user_id: 'owner', lesson_id: input.draft.lessonId })
    expect(insert.mock.calls[0][0]).not.toHaveProperty('score')
  })
  it('does not claim success after a database failure or incomplete input', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '08006' } })
    const db = { from: () => ({ insert }) } as unknown as SupabaseClient
    expect((await persistContextAttempt(db, 'owner', input)).status).toBe('error')
    expect((await persistContextAttempt(db, 'owner', { ...input, draft: { ...input.draft, revision: '' } })).status).toBe('error')
    expect(insert).toHaveBeenCalledTimes(1)
  })
  it('confirms an identical retry but rejects changing a completed attempt', async () => {
    const data = { lesson_id: input.draft.lessonId, level: 'A1', response: input.draft.response, revision: input.draft.revision, comprehension_choice: 1, self_checks: input.draft.checked, first_choice: null, hints_used: false, oral_self_report: false }
    const query = { eq: vi.fn(() => query), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }
    const db = { from: () => ({ insert: async () => ({ error: { code: '23505' } }), select: () => query }) } as unknown as SupabaseClient
    expect((await persistContextAttempt(db, 'owner', input)).status).toBe('saved')
    expect((await persistContextAttempt(db, 'owner', { ...input, draft: { ...input.draft, revision: 'Different version' } })).status).toBe('error')
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner')
  })
})
