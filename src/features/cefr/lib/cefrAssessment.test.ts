import { describe, expect, it } from 'vitest'
import { getUserCefrProfile } from './cefrAssessment'
import type { SupabaseClient } from '@supabase/supabase-js'

function makeSupabase(row: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

const baseRow = {
  user_id: 'user-1',
  estimated_level: 'A2',
  confidence: 80,
  total_interactions: 60,
  level_scores: { A1: { correct: 20, total: 20 }, A2: { correct: 30, total: 40 } },
  level_source: 'auto' as const,
  assessed_at: new Date().toISOString(),
}

describe('getUserCefrProfile — level-drop notice', () => {
  it('preserves the measured placement after easier consolidation reviews', async () => {
    const profile = await getUserCefrProfile(makeSupabase({
      ...baseRow,
      estimated_level: 'B2',
      confidence: 82,
      total_interactions: 15,
      level_scores: { A1: { correct: 15, total: 15 } },
    }), 'user-1')
    expect(profile).toMatchObject({ level: 'B2', assessing: false, nextLevel: 'C1', confidence: 82 })
  })

  it('retains placement confidence before any game interactions', async () => {
    const profile = await getUserCefrProfile(makeSupabase({
      ...baseRow, estimated_level: 'B1', confidence: 78, total_interactions: 0, level_scores: {},
    }), 'user-1')
    expect(profile).toMatchObject({ level: 'B1', assessing: false, nextLevel: 'B2', confidence: 78 })
  })
  it('flags a recent regression from a higher to a lower level', async () => {
    const row = {
      ...baseRow,
      previous_level: 'B1',
      level_changed_at: new Date().toISOString(),
    }
    const profile = await getUserCefrProfile(makeSupabase(row), 'user-1')

    expect(profile.didLevelDrop).toBe(true)
    expect(profile.previousLevel).toBe('B1')
  })

  it('does not flag when the level went up', async () => {
    const row = {
      ...baseRow,
      previous_level: 'A1',
      level_changed_at: new Date().toISOString(),
    }
    const profile = await getUserCefrProfile(makeSupabase(row), 'user-1')

    expect(profile.didLevelDrop).toBe(false)
  })

  it('does not flag a regression outside the notice window', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const row = {
      ...baseRow,
      previous_level: 'B1',
      level_changed_at: tenDaysAgo,
    }
    const profile = await getUserCefrProfile(makeSupabase(row), 'user-1')

    expect(profile.didLevelDrop).toBe(false)
  })

  it('does not flag when there is no previous level on record', async () => {
    const row = { ...baseRow, previous_level: null, level_changed_at: null }
    const profile = await getUserCefrProfile(makeSupabase(row), 'user-1')

    expect(profile.didLevelDrop).toBe(false)
  })
})
