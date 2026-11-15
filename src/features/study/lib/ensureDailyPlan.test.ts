import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureDailyPlan } from './ensureDailyPlan'

const state = vi.hoisted(() => ({ events: [] as string[], planned: false, providerFails: false, inserts: [] as Record<string, unknown>[] }))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('@/features/curriculum/lib/curriculumState', () => ({ getCurriculumState: async () => ({ currentLevel: 'A1' }) }))
vi.mock('@/features/cefr/lib/cefrAssessment', () => ({ getUserCefrProfile: async () => ({ level: 'A1' }) }))
vi.mock('@/features/curriculum/lib/curriculumProgressState', () => ({ loadCurriculumProgressState: async () => ({ completedIds: new Set(), progress: { total: 2, completedPrefix: 0 } }) }))
vi.mock('./studyEvidence', () => ({ loadStudyEvidence: async () => [] }))
vi.mock('@/features/learning/lib/personalLearning', () => ({
  isPersonalLearningEnabled: () => true,
  processPersonalLearningJob: vi.fn(),
  enqueuePersonalLearning: async () => {
    state.events.push('personal');
    if (state.providerFails) throw new Error('Provider unavailable')
    return { status: 'queued' }
  },
}))

function database() {
  return { from(table: string) {
    let columns = '', insertion = false
    const query = {
      select(value: string) { columns = value; return query },
      eq() { return query }, is() { return query }, gte() { return query }, limit() { return query },
      upsert(rows: Record<string, unknown>[]) { state.inserts = rows; state.events.push('core'); insertion = true; return query },
      then(resolve: (value: unknown) => unknown) {
        const data = insertion ? [{ id: 'assignment' }] : table === 'packs' ? [
          { id: 'later', level: 'A1', curriculum_position: 2, cards: [{ id: 'c2' }] },
          { id: 'first', level: 'A1', curriculum_position: 1, cards: [{ id: 'c1' }] },
        ] : columns.startsWith('id,packs!inner') && state.planned ? [{ id: 'existing' }] : []
        return Promise.resolve(resolve({ data, error: null }))
      },
    }
    return query
  } } as unknown as SupabaseClient
}

beforeEach(() => { state.events = []; state.inserts = []; state.planned = false; state.providerFails = false })
describe('curriculum and personalization scheduling', () => {
  it('reserves the first curriculum lesson before personal generation uses daily capacity', async () => {
    const result = await ensureDailyPlan(database(), 'member')
    expect(result.created).toBe(true)
    expect(state.events).toEqual(['core', 'personal'])
    expect(state.inserts).toHaveLength(1)
    expect(state.inserts[0]).toMatchObject({ user_id: 'member', pack_id: 'first', assigned_by: 'auto' })
  })
  it('keeps usable curriculum practice when personalization is unavailable', async () => {
    state.providerFails = true
    const result = await ensureDailyPlan(database(), 'member')
    expect(result.reason).toBe('planned')
    expect(result.activities[0].packId).toBe('first')
  })
  it('does not overwrite or duplicate an existing core assignment', async () => {
    state.planned = true
    const result = await ensureDailyPlan(database(), 'member')
    expect(result.created).toBe(false)
    expect(state.inserts).toEqual([])
    expect(state.events).toEqual(['personal'])
  })
})
