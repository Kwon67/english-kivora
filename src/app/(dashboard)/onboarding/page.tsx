import { redirect } from 'next/navigation'
import OnboardingClient from '@/features/onboarding/components/OnboardingClient'
import {
  type OnboardingDailyGoalMinutes,
  type OnboardingInterestId,
  isOnboardingInterestId,
} from '@/features/onboarding/lib/onboardingInterests'
import {
  getOnboardingResumeStep,
  getUserOnboardingStatus,
  isOnboardingComplete,
} from '@/features/onboarding/lib/onboardingStatus'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseDailyGoal(value: number | null | undefined): OnboardingDailyGoalMinutes {
  if (value === 5 || value === 10 || value === 15) return value
  return 10
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const completed = await isOnboardingComplete(supabase, user.id)
  if (completed) {
    redirect('/home')
  }

  const { row } = await getUserOnboardingStatus(supabase, user.id)
  const initialStep = getOnboardingResumeStep(row)
  const initialInterests = (row?.interests || []).filter(isOnboardingInterestId) as OnboardingInterestId[]
  const initialDailyGoalMinutes = parseDailyGoal(row?.daily_goal_minutes)

  return (
    <OnboardingClient
      initialStep={initialStep}
      initialInterests={initialInterests}
      initialDailyGoalMinutes={initialDailyGoalMinutes}
    />
  )
}