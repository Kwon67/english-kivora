import type { SupabaseClient } from '@supabase/supabase-js'
import { isBlitzTableMissingError } from '@/features/blitz/lib/blitzTable'
import type { Database } from '@/types/database.types'

export type BlitzLeaderboardEntry = {
  rank: number
  userId: string
  username: string
  score: number
  maxCombo: number
}

type BlitzLeaderboardRpcRow = {
  rank: number | string
  user_id: string
  username: string | null
  score: number
  max_combo: number
}

function mapRpcRows(rows: BlitzLeaderboardRpcRow[] | null | undefined): BlitzLeaderboardEntry[] {
  return (rows || []).map((row) => ({
    rank: Number(row.rank) || 0,
    userId: row.user_id,
    username: row.username || 'Membro',
    score: row.score,
    maxCombo: row.max_combo,
  }))
}

/**
 * Weekly Blitz leaderboard via SECURITY DEFINER RPC.
 * Avoids joining profiles under restrictive RLS and avoids scanning all blitz_runs from the client role.
 */
export async function getWeeklyBlitzLeaderboard(
  supabase: SupabaseClient<Database>,
  windowStartIso: string,
  limit = 5
): Promise<BlitzLeaderboardEntry[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200))

  const { data, error } = await supabase.rpc('get_weekly_blitz_leaderboard', {
    p_window_start: windowStartIso,
    p_limit: safeLimit,
  })

  if (error) {
    if (isBlitzTableMissingError(error)) {
      return []
    }
    // Older databases may not have the RPC yet — fail closed for leaderboard display.
    if (/function .*get_weekly_blitz_leaderboard/i.test(error.message) || error.code === 'PGRST202') {
      return []
    }
    throw new Error(error.message)
  }

  return mapRpcRows(data as BlitzLeaderboardRpcRow[] | null)
}

export async function getUserWeeklyBlitzRank(
  supabase: SupabaseClient<Database>,
  windowStartIso: string,
  userId: string
): Promise<BlitzLeaderboardEntry | null> {
  // Pull a wide window so the caller's rank is included when they are outside the top-N display list.
  const rows = await getWeeklyBlitzLeaderboard(supabase, windowStartIso, 200)
  return rows.find((entry) => entry.userId === userId) ?? null
}

export async function getUserBlitzBest(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ bestScore: number; bestCombo: number } | null> {
  const [bestScoreResult, bestComboResult] = await Promise.all([
    supabase
      .from('blitz_runs')
      .select('score')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('blitz_runs')
      .select('max_combo')
      .eq('user_id', userId)
      .order('max_combo', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const errors = [bestScoreResult.error, bestComboResult.error].filter(Boolean)
  if (errors.some((error) => isBlitzTableMissingError(error))) return null
  if (errors.length > 0) return null

  if (!bestScoreResult.data && !bestComboResult.data) return null

  return {
    bestScore: bestScoreResult.data?.score ?? 0,
    bestCombo: bestComboResult.data?.max_combo ?? 0,
  }
}
