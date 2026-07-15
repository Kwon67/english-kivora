import type { SupabaseClient } from '@supabase/supabase-js'

export type OnboardingLevelSource = 'manual' | 'placement' | 'skipped'

export type UserOnboardingRow = {
  user_id: string
  onboarding_completed_at: string | null
  level_source: OnboardingLevelSource | null
  placement_confidence: number | null
  daily_goal_minutes: number | null
  interests: string[]
  starter_pack_id: string | null
  study_experience: string | null
}

export type OnboardingProfile = {
  role: string | null
  created_at: string | null
}

/** Accounts created before the onboarding rollout must keep their existing journey. */
export const ONBOARDING_ROLLOUT_AT = '2026-07-01T12:00:00.000Z'

export function shouldRequireOnboarding(
  row: UserOnboardingRow | null,
  profile: OnboardingProfile | null
): boolean {
  if (row?.onboarding_completed_at) return false
  if (row) return true

  // Admins and legacy members predate the wizard. Missing rollout data must
  // never lock them out of the product or force them through first-run setup.
  if (profile?.role === 'admin') return false

  const createdAt = profile?.created_at ? Date.parse(profile.created_at) : Number.NaN
  const rolloutAt = Date.parse(ONBOARDING_ROLLOUT_AT)
  if (Number.isFinite(createdAt) && createdAt < rolloutAt) return false

  return true
}

function isOnboardingTableMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  return error.code === '42P01' || /user_onboarding/i.test(error.message || '')
}

export async function getUserOnboardingStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{ completed: boolean; row: UserOnboardingRow | null }> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select(
      'user_id,onboarding_completed_at,level_source,placement_confidence,daily_goal_minutes,interests,starter_pack_id,study_experience'
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isOnboardingTableMissing(error)) {
      return { completed: false, row: null }
    }
    console.error('Failed to load onboarding status', { userId, error })
    return { completed: false, row: null }
  }

  if (!data) {
    return { completed: false, row: null }
  }

  return {
    completed: Boolean(data.onboarding_completed_at),
    row: data as UserOnboardingRow,
  }
}

export async function isOnboardingComplete(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { completed } = await getUserOnboardingStatus(supabase, userId)
  return completed
}

export type OnboardingWizardStep =
  | 'welcome'
  | 'method'
  | 'placement-test'
  | 'goals'
  | 'starter-pack'

export function getOnboardingResumeStep(row: UserOnboardingRow | null): OnboardingWizardStep {
  if (!row?.level_source) return 'welcome'
  if (!row.daily_goal_minutes) return 'goals'
  if (!row.onboarding_completed_at) return 'starter-pack'
  return 'welcome'
}
