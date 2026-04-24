import type { LeaderboardEntry } from '@/lib/leaderboard'

type WeeklyLeaderboardRow = {
  rank: number | string | null
  user_id: string | null
  username: string | null
  score: number | string | null
  accuracy: number | string | null
  sessions: number | string | null
  best_streak: number | string | null
}

type SupabaseRpcClient = any

function toNumber(value: number | string | null | undefined) {
  return typeof value === 'number' ? value : Number(value ?? 0)
}

export async function getWeeklyLeaderboard(
  supabase: SupabaseRpcClient,
  weeklyStartIso: string,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
    window_start: weeklyStartIso,
  }).limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data || [])
    .filter((row: WeeklyLeaderboardRow): row is WeeklyLeaderboardRow & { user_id: string } => Boolean(row.user_id))
    .map((row: WeeklyLeaderboardRow) => ({
      rank: toNumber(row.rank),
      userId: row.user_id,
      username: row.username || 'Membro',
      score: toNumber(row.score),
      accuracy: toNumber(row.accuracy),
      sessions: toNumber(row.sessions),
      bestStreak: toNumber(row.best_streak),
    }))
}

export async function getUserWeeklyRank(
  supabase: SupabaseRpcClient,
  weeklyStartIso: string,
  userId: string
): Promise<LeaderboardEntry | null> {
  const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
    window_start: weeklyStartIso,
  }).eq('user_id', userId).single()

  if (error || !data) {
    return null
  }

  return {
    rank: toNumber(data.rank),
    userId: data.user_id,
    username: data.username || 'Membro',
    score: toNumber(data.score),
    accuracy: toNumber(data.accuracy),
    sessions: toNumber(data.sessions),
    bestStreak: toNumber(data.best_streak),
  }
}
