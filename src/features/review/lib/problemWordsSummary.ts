import type { createClient } from '@/lib/supabase/server'
import { getAppDayStartUtcIso, getAppDateString, shiftAppDate } from '@/lib/timezone'

type SessionWithErrors = {
  session_errors: Array<{ card_id: string | null }> | null
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function getProblemWordsCount(supabase: SupabaseServerClient, userId: string) {
  const since = shiftAppDate(getAppDateString(), -30)
  const { data } = await supabase
    .from('game_sessions')
    .select('session_errors(card_id)')
    .eq('user_id', userId)
    .gte('completed_at', getAppDayStartUtcIso(since))
    .limit(40)

  const cardIds = new Set<string>()
  for (const session of data || []) {
    for (const error of session.session_errors || []) {
      if (error.card_id) cardIds.add(error.card_id)
    }
  }

  return cardIds.size
}