import type { SupabaseClient } from '@supabase/supabase-js'
import { isBlitzTableMissingError } from '@/features/blitz/lib/blitzTable'
import type { Database } from '@/types/database.types'

export type BlitzLeaderboardEntry = {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  score: number
  maxCombo: number
}

type BlitzRunRow = {
  user_id: string
  score: number
  max_combo: number
  profiles: { username: string | null; avatar_url: string | null } | null
}

export async function getWeeklyBlitzLeaderboard(
  supabase: SupabaseClient<Database>,
  windowStartIso: string,
  limit = 5
): Promise<BlitzLeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('blitz_runs')
    .select('user_id, score, max_combo, profiles(username, avatar_url)')
    .gte('created_at', windowStartIso)
    .order('score', { ascending: false })
    .limit(200)

  if (error) {
    if (isBlitzTableMissingError(error)) {
      return []
    }
    throw new Error(error.message)
  }

  const bestByUser = new Map<string, BlitzLeaderboardEntry>()

  for (const row of (data || []) as BlitzRunRow[]) {
    const existing = bestByUser.get(row.user_id)
    if (existing && existing.score >= row.score) continue

    bestByUser.set(row.user_id, {
      rank: 0,
      userId: row.user_id,
      username: row.profiles?.username || 'Membro',
      avatarUrl: row.profiles?.avatar_url ?? null,
      score: row.score,
      maxCombo: row.max_combo,
    })
  }

  return Array.from(bestByUser.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export async function getUserBlitzBest(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ bestScore: number; bestCombo: number } | null> {
  const { data, error } = await supabase
    .from('blitz_runs')
    .select('score, max_combo')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isBlitzTableMissingError(error)) return null
    return null
  }

  if (!data) return null

  return {
    bestScore: data.score,
    bestCombo: data.max_combo,
  }
}