import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

export const DEFAULT_DAILY_NEW_CARDS_LIMIT = 10
export const DEFAULT_REVIEW_SESSION_CARD_LIMIT = 10

type SupabaseLike = {
  from: (table: string) => {
    select: (query: string) => {
      eq: (column: string, value: string) => unknown
      in: (column: string, values: string[]) => {
        order: (column: string, options?: { ascending?: boolean }) => unknown
      }
    }
  }
}

type ReviewRow = {
  id: string
  card_id: string
  pack_id: string
  review_date: string
  next_review_date: string
  interval_days: number
  ease_factor: number
  repetitions: number
  total_reviews: number
  cards: Record<string, unknown>
  packs: Record<string, unknown>
}

type CardRow = {
  id: string
  pack_id: string
  created_at: string
  [key: string]: unknown
}

type ReviewSummaryRow = Pick<ReviewRow, 'card_id' | 'review_date' | 'next_review_date' | 'total_reviews'>

export type ReviewQueueCard = ReviewRow & {
  isNew?: boolean
  cards: Record<string, unknown>
  packs: Record<string, unknown>
}

export type ReviewQueueSummary = {
  dueToday: number
  dueTomorrow: number
  newCards: number
  totalDue: number
  totalBacklogDue: number
  deferredDue: number
  totalReviews: number
  introducedToday: number
  newCardsLimit: number
  sessionLimit: number
  dailyCardsReviewed: number
}

export async function getEligiblePackIdsForUser(supabase: SupabaseLike, userId: string) {
  const { data, error } = (await supabase
    .from('assignments')
    .select('pack_id,status')
    .eq('user_id', userId)) as {
      data: Record<string, unknown>[] | null
      error: { message: string } | null
    }

  if (error) throw new Error(error.message)

  return Array.from(
    new Set(
      (data || [])
        .filter((row: Record<string, unknown>) => Boolean(row.pack_id) && isAssignmentCompleted(String(row.status ?? '')))
        .map((row: Record<string, unknown>) => String(row.pack_id))
    )
  )
}

export async function getReviewQueueForUser(
  supabase: SupabaseLike,
  userId: string,
  options?: { newCardsLimit?: number; sessionLimit?: number }
) {
  const newCardsLimit = options?.newCardsLimit ?? DEFAULT_DAILY_NEW_CARDS_LIMIT
  const sessionLimit = Math.min(options?.sessionLimit ?? DEFAULT_REVIEW_SESSION_CARD_LIMIT, DEFAULT_REVIEW_SESSION_CARD_LIMIT)
  const today = getAppDateString()
  const tomorrow = shiftAppDate(today, 1)

  const eligiblePackIds = await getEligiblePackIdsForUser(supabase, userId)

  // Cards already started (card_reviews) must always be honored, even if the
  // pack that introduced them is no longer "eligible" (unassigned/reset) —
  // otherwise due reviews the user already started silently vanish forever.
  // Only *new* cards require an eligible pack.
  const [{ data: reviewRows, error: reviewError }, { data: eligibleCards, error: cardsError }] =
    eligiblePackIds.length > 0
      ? ((await Promise.all([
          supabase
            .from('card_reviews')
            .select('id,card_id,pack_id,review_date,next_review_date,interval_days,ease_factor,repetitions,total_reviews,cards(id,created_at,english_phrase,portuguese_translation,pack_id,audio_url),packs(*)')
            .eq('user_id', userId),
          supabase
            .from('cards')
            .select('id,created_at,english_phrase,portuguese_translation,pack_id,audio_url,packs(*)')
            .in('pack_id', eligiblePackIds)
            .order('created_at', { ascending: true }),
        ])) as [
          { data: Record<string, unknown>[] | null; error: { message: string } | null },
          { data: Record<string, unknown>[] | null; error: { message: string } | null },
        ])
      : [
          (await supabase
            .from('card_reviews')
            .select('id,card_id,pack_id,review_date,next_review_date,interval_days,ease_factor,repetitions,total_reviews,cards(id,created_at,english_phrase,portuguese_translation,pack_id,audio_url),packs(*)')
            .eq('user_id', userId)) as {
            data: Record<string, unknown>[] | null
            error: { message: string } | null
          },
          { data: [], error: null },
        ]

  if (reviewError) throw new Error(reviewError.message)
  if (cardsError) throw new Error(cardsError.message)

  const reviews = ((reviewRows || []) as unknown as ReviewRow[]).sort(
    (a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime()
  )
  const introducedToday = reviews.filter(
    (review) => review.total_reviews === 1 && getAppDateString(review.review_date) === today
  ).length
  const dailyCardsReviewed = reviews.filter(
    (review) => review.total_reviews > 0 && getAppDateString(review.review_date) === today
  ).length
  const sessionCapacity = Math.max(sessionLimit - dailyCardsReviewed, 0)
  const availableNewCardsToday = Math.max(newCardsLimit - introducedToday, 0)
  const reviewedCardIds = new Set(reviews.map((row) => row.card_id))
  const newCardsPool = ((eligibleCards || []) as unknown as CardRow[]).filter((card) => !reviewedCardIds.has(card.id))

  const dueReviews = reviews.filter((review) => getAppDateString(review.next_review_date) <= today)
  const sessionDueReviews = dueReviews.slice(0, sessionCapacity)
  const availableNewCardSlots = Math.max(sessionCapacity - sessionDueReviews.length, 0)
  const newCards = newCardsPool.slice(0, Math.min(availableNewCardsToday, availableNewCardSlots))
  const dueTomorrow = reviews.filter((review) => getAppDateString(review.next_review_date) === tomorrow).length
  const totalReviews = reviews.reduce((sum, review) => sum + (review.total_reviews || 0), 0)
  const totalBacklogDue = dueReviews.length + Math.min(availableNewCardsToday, newCardsPool.length)
  const totalDue = sessionDueReviews.length + newCards.length

  return {
    dueCards: [
      ...sessionDueReviews,
      ...newCards.map((card) => ({
        ...card,
        card_id: card.id,
        cards: card,
        packs: (card.packs as Record<string, unknown>) || {},
        isNew: true,
        interval_days: 0,
        ease_factor: 2.5,
        repetitions: 0,
        total_reviews: 0,
      })),
    ],
    dueToday: sessionDueReviews.length,
    dueTomorrow,
    newCards: newCards.length,
    totalDue,
    totalBacklogDue,
    deferredDue: Math.max(totalBacklogDue - totalDue, 0),
    totalReviews,
    introducedToday,
    newCardsLimit,
    sessionLimit,
    dailyCardsReviewed,
  }
}

export async function getReviewQueueSummaryForUser(
  supabase: SupabaseLike,
  userId: string,
  options?: { newCardsLimit?: number; sessionLimit?: number }
): Promise<ReviewQueueSummary> {
  const newCardsLimit = options?.newCardsLimit ?? DEFAULT_DAILY_NEW_CARDS_LIMIT
  const sessionLimit = Math.min(options?.sessionLimit ?? DEFAULT_REVIEW_SESSION_CARD_LIMIT, DEFAULT_REVIEW_SESSION_CARD_LIMIT)
  const today = getAppDateString()
  const tomorrow = shiftAppDate(today, 1)

  const eligiblePackIds = await getEligiblePackIdsForUser(supabase, userId)

  // Same reasoning as getReviewQueueForUser: honor already-started reviews
  // regardless of current pack eligibility, only gate *new* cards on it.
  const [{ data: reviewRows, error: reviewError }, { data: eligibleCards, error: cardsError }] =
    eligiblePackIds.length > 0
      ? ((await Promise.all([
          supabase
            .from('card_reviews')
            .select('card_id,review_date,next_review_date,total_reviews')
            .eq('user_id', userId),
          supabase
            .from('cards')
            .select('id,pack_id,created_at')
            .in('pack_id', eligiblePackIds)
            .order('created_at', { ascending: true }),
        ])) as [
          { data: Record<string, unknown>[] | null; error: { message: string } | null },
          { data: Record<string, unknown>[] | null; error: { message: string } | null },
        ])
      : [
          (await supabase
            .from('card_reviews')
            .select('card_id,review_date,next_review_date,total_reviews')
            .eq('user_id', userId)) as {
            data: Record<string, unknown>[] | null
            error: { message: string } | null
          },
          { data: [], error: null },
        ]

  if (reviewError) throw new Error(reviewError.message)
  if (cardsError) throw new Error(cardsError.message)

  const reviews = ((reviewRows || []) as unknown as ReviewSummaryRow[]).sort(
    (a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime()
  )
  const introducedToday = reviews.filter(
    (review) => review.total_reviews === 1 && getAppDateString(review.review_date) === today
  ).length
  const dailyCardsReviewed = reviews.filter(
    (review) => review.total_reviews > 0 && getAppDateString(review.review_date) === today
  ).length
  const sessionCapacity = Math.max(sessionLimit - dailyCardsReviewed, 0)
  const availableNewCardsToday = Math.max(newCardsLimit - introducedToday, 0)
  const reviewedCardIds = new Set(reviews.map((row) => row.card_id))
  const newCardsPool = ((eligibleCards || []) as unknown as CardRow[]).filter((card) => !reviewedCardIds.has(card.id))
  const dueReviews = reviews.filter((review) => getAppDateString(review.next_review_date) <= today)
  const dueToday = Math.min(dueReviews.length, sessionCapacity)
  const availableNewCardSlots = Math.max(sessionCapacity - dueToday, 0)
  const newCards = Math.min(availableNewCardsToday, availableNewCardSlots, newCardsPool.length)
  const dueTomorrow = reviews.filter((review) => getAppDateString(review.next_review_date) === tomorrow).length
  const totalReviews = reviews.reduce((sum, review) => sum + (review.total_reviews || 0), 0)
  const totalBacklogDue = dueReviews.length + Math.min(availableNewCardsToday, newCardsPool.length)
  const totalDue = dueToday + newCards

  return {
    dueToday,
    dueTomorrow,
    newCards,
    totalDue,
    totalBacklogDue,
    deferredDue: Math.max(totalBacklogDue - totalDue, 0),
    totalReviews,
    introducedToday,
    newCardsLimit,
    sessionLimit,
    dailyCardsReviewed,
  }
}
