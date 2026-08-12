import { createAdminClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

export async function updateStreak(userId: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')
  }

  const today = getAppDateString()
  const yesterday = shiftAppDate(today, -1)

  const { data: existing, error: fetchError } = await supabase
    .from('user_streaks')
    .select('current_streak,longest_streak,last_activity_date,streak_frozen_until')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (existing?.last_activity_date === today) {
    return
  }

  const previousCurrent = existing?.current_streak ?? 0
  const previousLongest = existing?.longest_streak ?? 0

  const wasYesterday = existing?.last_activity_date === yesterday
  const freezeActive = !!existing?.streak_frozen_until && existing.streak_frozen_until >= yesterday
  const continuesViaFreeze = !wasYesterday && freezeActive

  const nextCurrent = wasYesterday || continuesViaFreeze ? previousCurrent + 1 : 1
  const nextLongest = Math.max(previousLongest, nextCurrent)

  const currentlyBanked = !!existing?.streak_frozen_until && existing.streak_frozen_until >= today
  const earnsNewFreeze = nextCurrent > 0 && nextCurrent % 7 === 0 && !currentlyBanked && !continuesViaFreeze

  const nextFrozenUntil = continuesViaFreeze
    ? null
    : earnsNewFreeze
      ? shiftAppDate(today, 2)
      : existing?.streak_frozen_until ?? null

  const { error } = await supabase
    .from('user_streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: nextCurrent,
        longest_streak: nextLongest,
        last_activity_date: today,
        streak_frozen_until: nextFrozenUntil,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    throw new Error(error.message)
  }
}
