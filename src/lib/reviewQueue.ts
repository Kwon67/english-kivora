import { isAssignmentCompleted } from '@/lib/assignmentStatus'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

export const DEFAULT_DAILY_NEW_CARDS_LIMIT = 10

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

export type ReviewQueueCard = ReviewRow & {
  isNew?: boolean
  cards: Record<string, unknown>
  packs: Record<string, unknown>
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
  options?: { newCardsLimit?: number }
) {
  const newCardsLimit = options?.newCardsLimit ?? DEFAULT_DAILY_NEW_CARDS_LIMIT
  const today = getAppDateString()
  const tomorrow = shiftAppDate(today, 1)

  const eligiblePackIds = await getEligiblePackIdsForUser(supabase, userId)
  if (eligiblePackIds.length === 0) {
    return {
      dueCards: [],
      dueToday: 0,
      dueTomorrow: 0,
      newCards: 0,
      totalDue: 0,
      totalReviews: 0,
      introducedToday: 0,
      newCardsLimit,
    }
  }

  const [{ data: reviewRows, error: reviewError }, { data: eligibleCards, error: cardsError }] = (await Promise.all([
    supabase
      .from('card_reviews')
      .select('*, cards(*), packs(*)')
      .eq('user_id', userId),
    supabase
      .from('cards')
      .select('*, packs(*)')
      .in('pack_id', eligiblePackIds)
      .order('created_at', { ascending: true }),
  ])) as [
    { data: Record<string, unknown>[] | null; error: { message: string } | null },
    { data: Record<string, unknown>[] | null; error: { message: string } | null },
  ]

  if (reviewError) throw new Error(reviewError.message)
  if (cardsError) throw new Error(cardsError.message)

  const reviews = ((reviewRows || []) as unknown as ReviewRow[]).sort(
    (a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime()
  )
  const introducedToday = reviews.filter(
    (review) => review.total_reviews === 1 && getAppDateString(review.review_date) === today
  ).length
  const availableNewCardsToday = Math.max(newCardsLimit - introducedToday, 0)
  const reviewedCardIds = new Set(reviews.map((row) => row.card_id))
  const newCardsPool = ((eligibleCards || []) as unknown as CardRow[]).filter((card) => !reviewedCardIds.has(card.id))
  const newCards = newCardsPool.slice(0, availableNewCardsToday)

  const dueReviews = reviews.filter((review) => getAppDateString(review.next_review_date) <= today)
  const dueTomorrow = reviews.filter((review) => getAppDateString(review.next_review_date) === tomorrow).length
  const totalReviews = reviews.reduce((sum, review) => sum + (review.total_reviews || 0), 0)

  return {
    dueCards: [
      ...dueReviews,
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
    dueToday: dueReviews.length,
    dueTomorrow,
    newCards: newCards.length,
    totalDue: dueReviews.length + newCards.length,
    totalReviews,
    introducedToday,
    newCardsLimit,
  }
}
