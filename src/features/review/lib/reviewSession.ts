import { getReviewQueueForUser } from '@/features/review/lib/reviewQueue'
import { getCardWeakModesByUser } from '@/features/review/lib/cardWeakModes'
import { resolveReviewModesForCard } from '@/features/review/lib/reviewModes'
import type { GameMode } from '@/types/database.types'

type SupabaseLike = Parameters<typeof getReviewQueueForUser>[0]

type CardRow = {
  id: string
  pack_id: string
  english_phrase: string
  portuguese_translation: string
  audio_url?: string | null
  created_at?: string
}

export type ReviewSessionCard = {
  card_id: string
  pack_id: string
  weakModes: GameMode[]
  reviewModes: GameMode[]
  [key: string]: unknown
}

export async function buildReviewSessionPayload(
  supabase: SupabaseLike,
  userId: string
) {
  const queue = await getReviewQueueForUser(supabase, userId)
  const dueCards = (queue.dueCards || []) as unknown as ReviewSessionCard[]
  const cardIds = dueCards
    .map((card) => String(card.card_id || card.id || ''))
    .filter(Boolean)

  const weakModesByCard = await getCardWeakModesByUser(
    supabase as unknown as Parameters<typeof getCardWeakModesByUser>[0],
    userId,
    cardIds
  )

  const enrichedDueCards = dueCards.map((card) => {
    const cardId = String(card.card_id || card.id || '')
    const weakModes = weakModesByCard.get(cardId) ?? []
    return {
      ...card,
      weakModes,
      reviewModes: resolveReviewModesForCard(weakModes),
    }
  })

  const packIds = [...new Set(enrichedDueCards.map((card) => String(card.pack_id)).filter(Boolean))]
  let packCardsByPackId: Record<string, CardRow[]> = {}

  if (packIds.length > 0) {
    const { data: packCards, error } = (await supabase
      .from('cards')
      .select('id,pack_id,english_phrase,portuguese_translation,audio_url,created_at')
      .in('pack_id', packIds)
      .order('created_at', { ascending: true })) as {
      data: CardRow[] | null
      error: { message: string } | null
    }

    if (error) {
      console.error('Failed to load pack cards for review modes', { userId, error })
    } else {
      packCardsByPackId = (packCards || []).reduce<Record<string, CardRow[]>>((acc, card) => {
        if (!acc[card.pack_id]) acc[card.pack_id] = []
        acc[card.pack_id].push(card)
        return acc
      }, {})
    }
  }

  return {
    ...queue,
    dueCards: enrichedDueCards,
    packCardsByPackId,
  }
}