import { isLeech } from '@/features/review/lib/leech'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

export const DEFAULT_DAILY_NEW_CARDS_LIMIT = 10
export const DEFAULT_REVIEW_SESSION_CARD_LIMIT = 10

/**
 * Teto de revisões por DIA, distinto do tamanho de uma sessão.
 *
 * Os dois eram a mesma coisa: `sessionCapacity` fazia `sessionLimit - dailyCardsReviewed`, então
 * o limite de 10 — que existe para uma sessão não virar uma maratona — funcionava como orçamento
 * do dia inteiro. Passou de 10 respostas, a tela de revisão ficava vazia até a meia-noite, mesmo
 * com cards vencidos esperando.
 *
 * Pior que o incômodo: num baralho que vence mais de 10 cards por dia, o atraso só podia crescer.
 * Era catraca de mão única, e foi assim que se acumularam 88 vencidos com o mais antigo de 48
 * dias, enquanto a fila reportava "tudo em dia".
 *
 * Agora a sessão continua tendo 10 cards, e terminar uma libera a próxima até este teto diário.
 */
export const DEFAULT_DAILY_REVIEW_LIMIT = 120

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
  learning_step: number | null
  lapses: number | null
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

type ReviewSummaryRow = Pick<ReviewRow, 'card_id' | 'review_date' | 'next_review_date' | 'total_reviews' | 'lapses'>

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
  /** Cards da rotina que o usuário nunca viu. É o combustível de material novo. */
  unseenInRoutine: number
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
  options?: { newCardsLimit?: number; sessionLimit?: number; dailyReviewLimit?: number }
) {
  const newCardsLimit = options?.newCardsLimit ?? DEFAULT_DAILY_NEW_CARDS_LIMIT
  const sessionLimit = Math.min(options?.sessionLimit ?? DEFAULT_REVIEW_SESSION_CARD_LIMIT, DEFAULT_REVIEW_SESSION_CARD_LIMIT)
  const dailyReviewLimit = Math.max(options?.dailyReviewLimit ?? DEFAULT_DAILY_REVIEW_LIMIT, sessionLimit)
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
            .select('id,card_id,pack_id,review_date,next_review_date,interval_days,ease_factor,repetitions,learning_step,lapses,total_reviews,cards(id,created_at,english_phrase,portuguese_translation,pack_id,audio_url),packs(*)')
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
            .select('id,card_id,pack_id,review_date,next_review_date,interval_days,ease_factor,repetitions,learning_step,lapses,total_reviews,cards(id,created_at,english_phrase,portuguese_translation,pack_id,audio_url),packs(*)')
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
  // Sessão e dia são tetos diferentes: a sessão limita uma sentada, o diário limita o total.
  const sessionCapacity = Math.min(sessionLimit, Math.max(dailyReviewLimit - dailyCardsReviewed, 0))
  const availableNewCardsToday = Math.max(newCardsLimit - introducedToday, 0)
  const reviewedCardIds = new Set(reviews.map((row) => row.card_id))
  const newCardsPool = ((eligibleCards || []) as unknown as CardRow[]).filter((card) => !reviewedCardIds.has(card.id))

  // Gate on the timestamp, not the calendar date. `next_review_date` is TIMESTAMPTZ, but this
  // used to compare `getAppDateString(...) <= today`, so anything scheduled later *today* was
  // already "due". That made sub-day learning steps impossible: a card sent back in 1 minute
  // shared today's date and returned instantly, over and over, inside the same session.
  const nowMs = Date.now()
  // Leech fora da fila automática: insistir na mesma forma não está funcionando, e cada volta dele
  // ocupa uma vaga que outro card usaria. Ele NÃO some — segue no baralho e aparece em
  // Dificuldades, onde dá para atacá-lo de outro jeito.
  const dueReviews = reviews.filter(
    (review) => !isLeech(review.lapses) && new Date(review.next_review_date).getTime() <= nowMs
  )
  const sessionDueReviews = dueReviews.slice(0, sessionCapacity)
  const availableNewCardSlots = Math.max(sessionCapacity - sessionDueReviews.length, 0)
  const newCards = newCardsPool.slice(0, Math.min(availableNewCardsToday, availableNewCardSlots))
  // Still calendar-based on purpose: this is a "what lands tomorrow" preview, not a due check.
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
        learning_step: 0,
        lapses: 0,
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
    unseenInRoutine: newCardsPool.length,
    introducedToday,
    newCardsLimit,
    sessionLimit,
    dailyCardsReviewed,
  }
}

export async function getReviewQueueSummaryForUser(
  supabase: SupabaseLike,
  userId: string,
  options?: { newCardsLimit?: number; sessionLimit?: number; dailyReviewLimit?: number }
): Promise<ReviewQueueSummary> {
  const newCardsLimit = options?.newCardsLimit ?? DEFAULT_DAILY_NEW_CARDS_LIMIT
  const sessionLimit = Math.min(options?.sessionLimit ?? DEFAULT_REVIEW_SESSION_CARD_LIMIT, DEFAULT_REVIEW_SESSION_CARD_LIMIT)
  const dailyReviewLimit = Math.max(options?.dailyReviewLimit ?? DEFAULT_DAILY_REVIEW_LIMIT, sessionLimit)
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
  // Sessão e dia são tetos diferentes: a sessão limita uma sentada, o diário limita o total.
  const sessionCapacity = Math.min(sessionLimit, Math.max(dailyReviewLimit - dailyCardsReviewed, 0))
  const availableNewCardsToday = Math.max(newCardsLimit - introducedToday, 0)
  const reviewedCardIds = new Set(reviews.map((row) => row.card_id))
  const newCardsPool = ((eligibleCards || []) as unknown as CardRow[]).filter((card) => !reviewedCardIds.has(card.id))
  // Same timestamp gate as the session query above — the summary must agree with it, otherwise
  // Home advertises cards the review screen will not serve.
  const dueReviews = reviews.filter(
    (review) => !isLeech(review.lapses) && new Date(review.next_review_date).getTime() <= Date.now()
  )
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
    unseenInRoutine: newCardsPool.length,
    introducedToday,
    newCardsLimit,
    sessionLimit,
    dailyCardsReviewed,
  }
}
