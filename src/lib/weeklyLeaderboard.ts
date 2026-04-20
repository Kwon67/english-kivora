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

type SupabaseRpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: WeeklyLeaderboardRow[] | null; error: { message: string } | null }>
}

function toNumber(value: number | string | null | undefined) {
  return typeof value === 'number' ? value : Number(value ?? 0)
}

export async function getWeeklyLeaderboard(
  supabase: SupabaseRpcClient,
  weeklyStartIso: string
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
    window_start: weeklyStartIso,
  })

  if (error) {
    throw new Error(error.message)
  }

  return (data || [])
    .filter((row): row is WeeklyLeaderboardRow & { user_id: string } => Boolean(row.user_id))
    .map((row) => ({
      rank: toNumber(row.rank),
      userId: row.user_id,
      username: row.username || 'Membro',
      score: toNumber(row.score),
      accuracy: toNumber(row.accuracy),
      sessions: toNumber(row.sessions),
      bestStreak: toNumber(row.best_streak),
    }))
}
