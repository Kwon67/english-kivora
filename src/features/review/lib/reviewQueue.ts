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

import {
  rankCards,
  type CardReasonTag,
  type CardSignal,
} from '@/features/learning/lib/cardIntelligence'
import { getCefrLevelWeight, normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

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
  quality?: number | null
  first_reviewed_at?: string | null
  cards: Record<string, unknown>
  packs: Record<string, unknown>
}

type CardRow = {
  id: string
  pack_id: string
  created_at: string
  [key: string]: unknown
}

type ReviewSummaryRow = Pick<ReviewRow, 'card_id' | 'review_date' | 'next_review_date' | 'total_reviews' | 'lapses' | 'quality' | 'first_reviewed_at' | 'learning_step' | 'cards'>

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Introduce fewer new items until there is enough history, or when recent recall is struggling. */
function adaptiveNewLimit(reviews: ReviewSummaryRow[], requested?: number): number {
  if (requested !== undefined) return Math.max(0, requested)
  const reviewed = reviews.filter(review => review.total_reviews > 0)
  if (reviewed.length < 10) return 5
  const recent = [...reviewed].filter(review => typeof review.quality === 'number')
    .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime()).slice(0, 20)
  if (recent.length >= 10 && recent.filter(review => (review.quality ?? 0) >= 3).length / recent.length < 0.6) return 5
  return DEFAULT_DAILY_NEW_CARDS_LIMIT
}

function isRepeatedLearningDue(review: ReviewSummaryRow, today: string): boolean {
  return review.learning_step != null && review.total_reviews > 0 && getAppDateString(review.review_date) === today
}

/**
 * Traduz a linha de revisão para o vocabulário do modelo do aluno.
 *
 * Tudo o que o modelo precisa já vinha nesta consulta — facilidade, lapsos, agendamento e o pack
 * com o nível. O que faltava era alguém olhar: a fila ordenava por `next_review_date` e cortava os
 * primeiros, então entre cinquenta cards vencidos entravam os mais antigos, não os que a pessoa
 * está prestes a perder.
 */
function toCardSignal(review: ReviewRow, nowMs: number): CardSignal {
  const packLevel = (review.packs as { level?: string | null } | null)?.level ?? null

  return {
    cardId: review.card_id,
    packId: review.pack_id,
    packLevel,
    isNew: false,
    lapses: Number(review.lapses ?? 0),
    easeFactor: Number(review.ease_factor ?? 2.5),
    repetitions: Number(review.repetitions ?? 0),
    // A fila não carrega os erros de partida; a fragilidade aqui vem de lapso e facilidade, que
    // são o registro do próprio SRS sobre o que falhou.
    recentErrors: 0,
    daysSinceSeen: (nowMs - new Date(review.review_date).getTime()) / MS_PER_DAY,
    daysOverdue: (nowMs - new Date(review.next_review_date).getTime()) / MS_PER_DAY,
  }
}

function toNewCardSignal(card: CardRow, nowMs: number): CardSignal {
  const packLevel = (card.packs as { level?: string | null } | null)?.level ?? null
  void nowMs

  return {
    cardId: card.id,
    packId: card.pack_id,
    packLevel,
    isNew: true,
    lapses: 0,
    easeFactor: 2.5,
    repetitions: 0,
    recentErrors: 0,
    daysSinceSeen: 0,
    daysOverdue: -999,
  }
}

export type ReviewQueueCard = ReviewRow & {
  isNew?: boolean
  cards: Record<string, unknown>
  packs: Record<string, unknown>
  /** Por que ESTA frase entrou na sessão de hoje. Vai para a tela. */
  selectionReason?: string
  selectionTag?: CardReasonTag
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
  const [assigned, owned] = await Promise.all([
    supabase.from('assignments').select('pack_id,status').eq('user_id', userId),
    supabase.from('packs').select('id').eq('owner_id', userId),
  ]) as { data: Record<string, unknown>[] | null; error: { message: string } | null }[]
  if (assigned.error || owned.error) throw new Error(assigned.error?.message || owned.error?.message)
  // Personal vocabulary enters SRS immediately; curriculum still requires completion.
  return [...new Set([
    ...(assigned.data || []).filter(row => row.pack_id && isAssignmentCompleted(String(row.status ?? ''))).map(row => String(row.pack_id)),
    ...(owned.data || []).filter(row => row.id).map(row => String(row.id)),
  ])]
}

export async function getReviewQueueForUser(
  supabase: SupabaseLike,
  userId: string,
  options?: {
    newCardsLimit?: number
    sessionLimit?: number
    dailyReviewLimit?: number
    /** Nível CEFR do aluno: usado para escolher material novo e desempatar vencidos. */
    userLevel?: LearnerCefrLevel | null
  }
) {
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
            .select('id,card_id,pack_id,review_date,next_review_date,interval_days,ease_factor,repetitions,learning_step,lapses,quality,total_reviews,first_reviewed_at,cards(id,created_at,english_phrase,portuguese_translation,pack_id,audio_url),packs(*)')
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
            .select('id,card_id,pack_id,review_date,next_review_date,interval_days,ease_factor,repetitions,learning_step,lapses,quality,total_reviews,first_reviewed_at,cards(id,created_at,english_phrase,portuguese_translation,pack_id,audio_url),packs(*)')
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
  const newCardsLimit = adaptiveNewLimit(reviews, options?.newCardsLimit)
  const introducedToday = reviews.filter(
    (review) => Boolean(review.first_reviewed_at ? getAppDateString(review.first_reviewed_at) === today : review.total_reviews === 1 && getAppDateString(review.review_date) === today)
  ).length
  const dailyCardsReviewed = reviews.filter(
    (review) => review.total_reviews > 0 && getAppDateString(review.review_date) === today
  ).length
  // Sessão e dia são tetos diferentes: a sessão limita uma sentada, o diário limita o total.
  const sessionCapacity = Math.min(sessionLimit, Math.max(dailyReviewLimit - dailyCardsReviewed, 0))
  const availableNewCardsToday = Math.max(newCardsLimit - introducedToday, 0)
  const nowMs = Date.now()
  const reviewedCardIds = new Set(reviews.map((row) => row.card_id))
  // Scheduled rows with no answers are introductions, not previously studied cards.
  const scheduledNew = reviews.filter(row => row.total_reviews === 0 && row.cards && new Date(row.next_review_date).getTime() <= nowMs)
  const newCardsPool = [
    ...scheduledNew.map(row => ({ ...row.cards, id: row.card_id, pack_id: row.pack_id, created_at: String(row.cards.created_at ?? ''), packs: row.packs })),
    ...((eligibleCards || []) as unknown as CardRow[]).filter((card) => !reviewedCardIds.has(card.id)),
  ]

  // Gate on the timestamp, not the calendar date. `next_review_date` is TIMESTAMPTZ, but this
  // used to compare `getAppDateString(...) <= today`, so anything scheduled later *today* was
  // already "due". That made sub-day learning steps impossible: a card sent back in 1 minute
  // shared today's date and returned instantly, over and over, inside the same session.
  // Leech fora da fila automática: insistir na mesma forma não está funcionando, e cada volta dele
  // ocupa uma vaga que outro card usaria. Ele NÃO some — segue no baralho e aparece em
  // Dificuldades, onde dá para atacá-lo de outro jeito.
  const dueReviews = reviews.filter(
    (review) => review.total_reviews > 0 && !isLeech(review.lapses, review.quality) && new Date(review.next_review_date).getTime() <= nowMs
  )
  // A escolha de QUAIS vencidos entram na sessão, quando há mais vencidos que vagas. Antes era
  // `slice` sobre a ordem de agendamento: os mais antigos ganhavam a vaga, mesmo que fossem os
  // fáceis. Agora entra o que está escapando — lapso alto, facilidade baixa, muito atraso — e
  // packs diferentes se intercalam para a sessão não virar um pack só.
  const rankedDue = rankCards(
    dueReviews.map((review) => toCardSignal(review, nowMs)),
    { userLevel: options?.userLevel ?? null, mode: 'review' }
  )
  const reasonByCard = new Map(rankedDue.map((item) => [item.signal.cardId, item]))
  const dueByCard = new Map(dueReviews.map((review) => [review.card_id, review]))
  const orderedDue = rankedDue.map(item => dueByCard.get(item.signal.cardId)).filter((review): review is ReviewRow => Boolean(review))
  const learningDue = orderedDue.filter(review => isRepeatedLearningDue(review, today)).slice(0, sessionLimit)
  const otherDue = orderedDue.filter(review => !isRepeatedLearningDue(review, today))
    .slice(0, Math.min(sessionCapacity, sessionLimit - learningDue.length))
  const sessionDueReviews = [...learningDue, ...otherDue]
  const availableNewCardSlots = Math.min(sessionLimit - sessionDueReviews.length, Math.max(0, sessionCapacity - otherDue.length))
  // Material novo também deixa de ser "os primeiros por data de criação": entra o que melhor
  // encaixa no nível da pessoa, intercalado entre packs.
  const rankedNew = rankCards(
    newCardsPool.map((card) => toNewCardSignal(card, nowMs)),
    { userLevel: options?.userLevel ?? null, mode: 'review' }
  )
  // Before placement or at A1, exhaust easier material first; keep the scored ordering within a band.
  if (!options?.userLevel || options.userLevel === 'A1') rankedNew.sort((a, b) => getCefrLevelWeight(normalizePackLevel(a.signal.packLevel)) - getCefrLevelWeight(normalizePackLevel(b.signal.packLevel)))
  const newByCard = new Map(newCardsPool.map((card) => [card.id, card]))
  const newCards = rankedNew
    .slice(0, Math.min(availableNewCardsToday, availableNewCardSlots))
    .map((item) => newByCard.get(item.signal.cardId))
    .filter((card): card is CardRow => Boolean(card))
  // Still calendar-based on purpose: this is a "what lands tomorrow" preview, not a due check.
  const dueTomorrow = reviews.filter((review) => getAppDateString(review.next_review_date) === tomorrow).length
  const totalReviews = reviews.reduce((sum, review) => sum + (review.total_reviews || 0), 0)
  const totalBacklogDue = dueReviews.length + Math.min(availableNewCardsToday, newCardsPool.length)
  const totalDue = sessionDueReviews.length + newCards.length

  return {
    dueCards: [
      ...sessionDueReviews.map((review) => ({
        ...review,
        selectionReason: reasonByCard.get(review.card_id)?.reason,
        selectionTag: reasonByCard.get(review.card_id)?.reasonTag,
      })),
      ...newCards.map((card) => ({
        ...card,
        card_id: card.id,
        cards: card,
        packs: (card.packs as Record<string, unknown>) || {},
        selectionReason: 'Frase nova, ainda não vista por você',
        selectionTag: 'material-novo' as CardReasonTag,
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
            .select('card_id,pack_id,review_date,next_review_date,total_reviews,lapses,quality,first_reviewed_at,learning_step,cards(id)')
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
            .select('card_id,pack_id,review_date,next_review_date,total_reviews,lapses,quality,first_reviewed_at,learning_step,cards(id)')
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
  const newCardsLimit = adaptiveNewLimit(reviews, options?.newCardsLimit)
  const introducedToday = reviews.filter(
    (review) => Boolean(review.first_reviewed_at ? getAppDateString(review.first_reviewed_at) === today : review.total_reviews === 1 && getAppDateString(review.review_date) === today)
  ).length
  const dailyCardsReviewed = reviews.filter(
    (review) => review.total_reviews > 0 && getAppDateString(review.review_date) === today
  ).length
  // Sessão e dia são tetos diferentes: a sessão limita uma sentada, o diário limita o total.
  const sessionCapacity = Math.min(sessionLimit, Math.max(dailyReviewLimit - dailyCardsReviewed, 0))
  const availableNewCardsToday = Math.max(newCardsLimit - introducedToday, 0)
  const nowMs = Date.now()
  const reviewedCardIds = new Set(reviews.map((row) => row.card_id))
  const scheduledNew = reviews.filter(row => row.total_reviews === 0 && row.cards && new Date(row.next_review_date).getTime() <= nowMs)
  const newCardsPool = [...scheduledNew, ...((eligibleCards || []) as unknown as CardRow[]).filter((card) => !reviewedCardIds.has(card.id))]
  // Same timestamp gate as the session query above — the summary must agree with it, otherwise
  // Home advertises cards the review screen will not serve.
  const dueReviews = reviews.filter(
    (review) => review.total_reviews > 0 && !isLeech(review.lapses, review.quality) && new Date(review.next_review_date).getTime() <= nowMs
  )
  const learningDue = Math.min(dueReviews.filter(review => isRepeatedLearningDue(review, today)).length, sessionLimit)
  const otherDue = Math.min(dueReviews.filter(review => !isRepeatedLearningDue(review, today)).length, sessionCapacity, sessionLimit - learningDue)
  const dueToday = learningDue + otherDue
  const availableNewCardSlots = Math.min(sessionLimit - dueToday, Math.max(0, sessionCapacity - otherDue))
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
