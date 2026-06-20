import { getAppDayStartUtcIso, getAppDateString, shiftAppDate } from '@/lib/timezone'
import { normalizeWeakModes } from '@/features/review/lib/reviewModes'
import type { GameMode } from '@/types/database.types'

type SessionErrorRow = {
  card_id: string | null
  game_sessions: {
    assignments: {
      game_mode: string | null
    } | null
  } | null
}

type SupabaseLike = {
  from: (table: string) => {
    select: (query: string) => {
      eq: (column: string, value: string) => {
        in: (column: string, values: string[]) => {
          gte: (column: string, value: string) => Promise<{
            data: SessionErrorRow[] | null
            error: { message: string } | null
          }>
        }
      }
    }
  }
}

const LOOKBACK_DAYS = 90

export async function getCardWeakModesByUser(
  supabase: SupabaseLike,
  userId: string,
  cardIds: string[]
): Promise<Map<string, GameMode[]>> {
  const weakModesByCard = new Map<string, Set<GameMode>>()
  if (cardIds.length === 0) return new Map()

  const since = shiftAppDate(getAppDateString(), -LOOKBACK_DAYS)
  const { data, error } = await supabase
    .from('session_errors')
    .select('card_id, game_sessions(assignments(game_mode))')
    .eq('user_id', userId)
    .in('card_id', cardIds)
    .gte('created_at', getAppDayStartUtcIso(since))

  if (error) {
    console.error('Failed to load card weak modes for review', { userId, error })
    return new Map()
  }

  for (const row of data || []) {
    if (!row.card_id) continue
    const gameMode = row.game_sessions?.assignments?.game_mode
    if (!gameMode) continue

    const normalized = normalizeWeakModes([gameMode])
    if (normalized.length === 0) continue

    const existing = weakModesByCard.get(row.card_id) ?? new Set<GameMode>()
    for (const mode of normalized) {
      existing.add(mode)
    }
    weakModesByCard.set(row.card_id, existing)
  }

  return new Map(
    [...weakModesByCard.entries()].map(([cardId, modes]) => [cardId, [...modes]])
  )
}