import { redirect } from 'next/navigation'
import BlitzLanding from '@/features/blitz/components/BlitzLanding'
import BlitzShell from '@/features/blitz/components/BlitzShell'
import { isBlitzTableReady } from '@/features/blitz/lib/blitzTable'
import { getUserBlitzBest, getWeeklyBlitzLeaderboard } from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BlitzPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const weeklyStart = shiftAppDate(getAppDateString(), -7)
  const windowStartIso = `${weeklyStart}T00:00:00.000Z`

  const [personalBest, leaderboard, scoresReady] = await Promise.all([
    getUserBlitzBest(supabase, user.id),
    getWeeklyBlitzLeaderboard(supabase, windowStartIso, 5),
    isBlitzTableReady(supabase),
  ])

  return (
    <BlitzShell>
      <BlitzLanding
        personalBest={personalBest?.bestScore ?? 0}
        bestCombo={personalBest?.bestCombo ?? 0}
        leaderboard={leaderboard}
        scoresReady={scoresReady}
      />
    </BlitzShell>
  )
}