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

function buildWeeklyBlitzLeaderboard(rows: BlitzRunRow[]): BlitzLeaderboardEntry[] {
  const bestByUser = new Map<string, BlitzLeaderboardEntry>()

  for (const row of rows) {
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
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return right.maxCombo - left.maxCombo
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

async function fetchWeeklyBlitzRunRows(
  supabase: SupabaseClient<Database>,
  windowStartIso: string
): Promise<BlitzRunRow[]> {
  const { data, error } = await supabase
    .from('blitz_runs')
    .select('user_id, score, max_combo, profiles(username, avatar_url)')
    .gte('created_at', windowStartIso)
    .order('score', { ascending: false })
    .limit(500)

  if (error) {
    if (isBlitzTableMissingError(error)) {
      return []
    }
    throw new Error(error.message)
  }

  return (data || []) as BlitzRunRow[]
}

export async function getWeeklyBlitzLeaderboard(
  supabase: SupabaseClient<Database>,
  windowStartIso: string,
  limit = 5
): Promise<BlitzLeaderboardEntry[]> {
  const rows = await fetchWeeklyBlitzRunRows(supabase, windowStartIso)
  return buildWeeklyBlitzLeaderboard(rows).slice(0, limit)
}

export async function getUserWeeklyBlitzRank(
  supabase: SupabaseClient<Database>,
  windowStartIso: string,
  userId: string
): Promise<BlitzLeaderboardEntry | null> {
  const rows = await fetchWeeklyBlitzRunRows(supabase, windowStartIso)
  return buildWeeklyBlitzLeaderboard(rows).find((entry) => entry.userId === userId) ?? null
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