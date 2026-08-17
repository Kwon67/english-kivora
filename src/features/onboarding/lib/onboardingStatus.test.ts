import { describe, expect, it } from 'vitest'
import {
  ONBOARDING_ROLLOUT_AT,
  isRecentUser,
  shouldRequireOnboarding,
  type UserOnboardingRow,
} from './onboardingStatus'

function row(patch: Partial<UserOnboardingRow> = {}): UserOnboardingRow {
  return {
    user_id: 'user-1',
    onboarding_completed_at: null,
    level_source: null,
    placement_confidence: null,
    daily_goal_minutes: null,
    interests: [],
    starter_pack_id: null,
    study_experience: null,
    ...patch,
  }
}

describe('shouldRequireOnboarding', () => {
  it('does not require the wizard after it was completed', () => {
    expect(
      shouldRequireOnboarding(
        row({ onboarding_completed_at: '2026-07-15T10:00:00.000Z' }),
        { role: 'member', created_at: '2026-07-15T09:00:00.000Z' }
      )
    ).toBe(false)
  })

  it('resumes an explicitly started onboarding', () => {
    expect(
      shouldRequireOnboarding(row({ level_source: 'skipped' }), {
        role: 'member',
        created_at: '2026-06-01T09:00:00.000Z',
      })
    ).toBe(true)
  })

  it('grandfathers administrators without onboarding data', () => {
    expect(
      shouldRequireOnboarding(null, {
        role: 'admin',
        created_at: '2026-07-15T09:00:00.000Z',
      })
    ).toBe(false)
  })

  it('grandfathers members created before the rollout', () => {
    expect(
      shouldRequireOnboarding(null, {
        role: 'member',
        created_at: '2026-06-30T09:00:00.000Z',
      })
    ).toBe(false)
  })

  it('requires first-run setup for new members without onboarding data', () => {
    expect(
      shouldRequireOnboarding(null, {
        role: 'member',
        created_at: ONBOARDING_ROLLOUT_AT,
      })
    ).toBe(true)
  })
})

describe('isRecentUser', () => {
  it('returns true if created less than 24 hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(isRecentUser(twoHoursAgo)).toBe(true)
  })

  it('returns false if created more than 24 hours ago', () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    expect(isRecentUser(twoDaysAgo)).toBe(false)
  })

  it('returns false for null, undefined or invalid dates', () => {
    expect(isRecentUser(null)).toBe(false)
    expect(isRecentUser(undefined)).toBe(false)
    expect(isRecentUser('invalid-date')).toBe(false)
  })
})
