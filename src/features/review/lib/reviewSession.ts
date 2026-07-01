import { getReviewQueueForUser } from '@/features/review/lib/reviewQueue'
import { getCardWeakModesByUser } from '@/features/review/lib/cardWeakModes'
import { resolveReviewModesForCard } from '@/features/review/lib/reviewModes'
import type { GameMode } from '@/types/database.types'

type SupabaseLike = Parameters<typeof getReviewQueueForUser>[0]
type TargetedReviewSupabaseLike = {
  from: (table: string) => {
    select: (query: string) => {
      eq: (column: string, value: string) => {
        in: (column: string, values: string[]) => {
          order: (column: string, options?: { ascending?: boolean }) => unknown
        }
      }
      in: (column: string, values: string[]) => {
        order: (column: string, options?: { ascending?: boolean }) => unknown
      }
    }
  }
}

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

type TargetedReviewCard = ReviewSessionCard & {
  isNew?: boolean
  total_reviews?: number
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
      reviewModes: resolveReviewModesForCard(weakModes, {
        cardId,
        isNew: Boolean(card.isNew),
        repetitions: Number(card.repetitions ?? 0),
        total_reviews: Number(card.total_reviews ?? 0),
      }),
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

export async function buildTargetedReviewSessionPayload(
  supabase: TargetedReviewSupabaseLike,
  userId: string,
  cardIds: string[]
) {
  const uniqueCardIds = [...new Set(cardIds)].filter(Boolean).slice(0, 50)
  if (uniqueCardIds.length === 0) {
    return {
      dueCards: [],
      dueToday: 0,
      dueTomorrow: 0,
      newCards: 0,
      totalDue: 0,
      totalBacklogDue: 0,
      deferredDue: 0,
      totalReviews: 0,
      introducedToday: 0,
      newCardsLimit: 0,
      sessionLimit: 0,
      dailyCardsReviewed: 0,
      packCardsByPackId: {},
    }
  }

  const [{ data: cards, error: cardsError }, { data: reviews, error: reviewsError }] = (await Promise.all([
    supabase
      .from('cards')
      .select('id,created_at,english_phrase,portuguese_translation,pack_id,audio_url,packs(*)')
      .in('id', uniqueCardIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('card_reviews')
      .select('id,card_id,pack_id,review_date,next_review_date,interval_days,ease_factor,repetitions,total_reviews,cards(id,created_at,english_phrase,portuguese_translation,pack_id,audio_url),packs(*)')
      .eq('user_id', userId)
      .in('card_id', uniqueCardIds)
      .order('next_review_date', { ascending: true }),
  ])) as [
    { data: Array<CardRow & { packs?: Record<string, unknown> }> | null; error: { message: string } | null },
    { data: TargetedReviewCard[] | null; error: { message: string } | null },
  ]

  if (cardsError) throw new Error(cardsError.message)
  if (reviewsError) throw new Error(reviewsError.message)

  const cardsById = new Map((cards || []).map((card) => [card.id, card]))
  const reviewsByCardId = new Map((reviews || []).map((review) => [String(review.card_id), review]))
  const orderedCards = uniqueCardIds
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is CardRow & { packs?: Record<string, unknown> } => Boolean(card))

  const dueCards: TargetedReviewCard[] = orderedCards.map((card) => {
    const existingReview = reviewsByCardId.get(card.id)
    if (existingReview) {
      return existingReview
    }

    return {
      id: `blitz-${card.id}`,
      card_id: card.id,
      pack_id: card.pack_id,
      review_date: new Date().toISOString(),
      next_review_date: new Date().toISOString(),
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      total_reviews: 0,
      cards: card,
      packs: card.packs || {},
      isNew: true,
      weakModes: [],
      reviewModes: [],
    } satisfies ReviewSessionCard
  })

  const cardIdsForModes = dueCards.map((card) => String(card.card_id)).filter(Boolean)
  const weakModesByCard = await getCardWeakModesByUser(
    supabase as unknown as Parameters<typeof getCardWeakModesByUser>[0],
    userId,
    cardIdsForModes
  )

  const enrichedDueCards = dueCards.map((card) => {
    const cardId = String(card.card_id || card.id || '')
    const weakModes = weakModesByCard.get(cardId) ?? []
    return {
      ...card,
      weakModes,
      reviewModes: resolveReviewModesForCard(weakModes, {
        cardId,
        isNew: Boolean(card.isNew),
        repetitions: Number(card.repetitions ?? 0),
        total_reviews: Number(card.total_reviews ?? 0),
      }),
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
      console.error('Failed to load pack cards for targeted review modes', { userId, error })
    } else {
      packCardsByPackId = (packCards || []).reduce<Record<string, CardRow[]>>((acc, card) => {
        if (!acc[card.pack_id]) acc[card.pack_id] = []
        acc[card.pack_id].push(card)
        return acc
      }, {})
    }
  }

  return {
    dueCards: enrichedDueCards,
    dueToday: enrichedDueCards.length,
    dueTomorrow: 0,
    newCards: enrichedDueCards.filter((card) => card.isNew).length,
    totalDue: enrichedDueCards.length,
    totalBacklogDue: enrichedDueCards.length,
    deferredDue: 0,
    totalReviews: enrichedDueCards.reduce((sum, card) => sum + Number(card.total_reviews || 0), 0),
    introducedToday: 0,
    newCardsLimit: 0,
    sessionLimit: enrichedDueCards.length,
    dailyCardsReviewed: 0,
    packCardsByPackId,
  }
}
