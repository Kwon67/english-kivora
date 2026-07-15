import { describe, expect, it } from 'vitest'
import {
  ONBOARDING_ROLLOUT_AT,
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
