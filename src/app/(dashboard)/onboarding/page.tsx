import { redirect } from 'next/navigation'
import OnboardingClient from '@/features/onboarding/components/OnboardingClient'
import { isStudyExperience, type StudyExperience } from '@/features/onboarding/lib/catLevels'
import {
  type OnboardingDailyGoalMinutes,
  type OnboardingInterestId,
  isOnboardingInterestId,
} from '@/features/onboarding/lib/onboardingInterests'
import {
  getOnboardingResumeStep,
  getUserOnboardingStatus,
  shouldRequireOnboarding,
} from '@/features/onboarding/lib/onboardingStatus'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseDailyGoal(value: number | null | undefined): OnboardingDailyGoalMinutes {
  if (value === 5 || value === 10 || value === 15) return value
  return 10
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ row }, { data: profile }] = await Promise.all([
    getUserOnboardingStatus(supabase, user.id),
    supabase
      .from('profiles')
      .select('role,created_at')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (!shouldRequireOnboarding(row, profile)) {
    redirect('/home')
  }

  const initialStep = getOnboardingResumeStep(row)
  const initialInterests = (row?.interests || []).filter(isOnboardingInterestId) as OnboardingInterestId[]
  const initialDailyGoalMinutes = parseDailyGoal(row?.daily_goal_minutes)
  const initialStudyExperience = isStudyExperience(row?.study_experience)
    ? (row.study_experience as StudyExperience)
    : null

  return (
    <OnboardingClient
      initialStep={initialStep}
      initialInterests={initialInterests}
      initialDailyGoalMinutes={initialDailyGoalMinutes}
      initialStudyExperience={initialStudyExperience}
      billingIntent={params.plan === 'pro' ? 'pro' : null}
    />
  )
}
