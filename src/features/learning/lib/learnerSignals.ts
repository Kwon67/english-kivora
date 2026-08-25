import type { SupabaseClient } from '@supabase/supabase-js'
import type { CardSignal } from '@/features/learning/lib/cardIntelligence'

/**
 * Coleta, do banco, o que o modelo do aluno precisa saber sobre um conjunto de cards.
 *
 * Os sinais já existiam todos — `card_reviews` guarda facilidade e lapsos desde sempre, e
 * `session_errors` registra cada erro por card — mas ninguém os lia na hora de escolher o que
 * mostrar. Blitz e revisão consultam este mesmo lugar, para as duas telas concordarem sobre quem
 * é o aluno.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Janela de erros recentes. Duas semanas: longo o bastante para ter sinal, curto para ser "recente". */
const RECENT_ERROR_WINDOW_DAYS = 14

/** `card_reviews.lapses` existe via migração mas ainda não está no arquivo de tipos gerado. */
type ReviewRow = {
  card_id: string
  ease_factor: number | null
  repetitions: number | null
  lapses?: number | null
  review_date: string | null
  next_review_date: string | null
  total_reviews: number | null
}

export type CardForSignals = {
  id: string
  pack_id: string | null
}

function daysBetween(fromIso: string | null | undefined, now: number): number {
  if (!fromIso) return 0
  const time = new Date(fromIso).getTime()
  if (Number.isNaN(time)) return 0
  return (now - time) / MS_PER_DAY
}

/**
 * Monta um `CardSignal` por card.
 *
 * Card sem linha em `card_reviews` é material novo: `isNew`, sem histórico. Card com linha ganha
 * facilidade, lapsos e as duas distâncias em dias que o modelo usa — desde a última vez visto e
 * em relação ao agendamento.
 */
export async function collectCardSignals(
  supabase: SupabaseClient,
  userId: string,
  cards: CardForSignals[]
): Promise<Map<string, CardSignal>> {
  const signals = new Map<string, CardSignal>()
  if (cards.length === 0) return signals

  const cardIds = cards.map((card) => card.id)
  const packIds = [...new Set(cards.map((card) => card.pack_id).filter(Boolean))] as string[]
  const now = Date.now()
  const desde = new Date(now - RECENT_ERROR_WINDOW_DAYS * MS_PER_DAY).toISOString()

  const [reviewsResult, packsResult, errorsResult] = await Promise.all([
    supabase
      .from('card_reviews')
      .select('card_id,ease_factor,repetitions,lapses,review_date,next_review_date,total_reviews')
      .eq('user_id', userId)
      .in('card_id', cardIds),
    packIds.length > 0
      ? supabase.from('packs').select('id, level').in('id', packIds)
      : Promise.resolve({ data: [] as { id: string; level: string | null }[] }),
    supabase
      .from('session_errors')
      .select('card_id')
      .eq('user_id', userId)
      .in('card_id', cardIds)
      .gte('created_at', desde),
  ])

  const reviewByCard = new Map<string, ReviewRow>()
  for (const row of (reviewsResult.data || []) as unknown as ReviewRow[]) {
    if (row.card_id) reviewByCard.set(row.card_id, row)
  }

  const levelByPack = new Map<string, string | null>()
  for (const pack of (packsResult.data || []) as { id: string; level: string | null }[]) {
    levelByPack.set(pack.id, pack.level)
  }

  const errorsByCard = new Map<string, number>()
  for (const row of (errorsResult.data || []) as { card_id: string | null }[]) {
    if (!row.card_id) continue
    errorsByCard.set(row.card_id, (errorsByCard.get(row.card_id) ?? 0) + 1)
  }

  for (const card of cards) {
    const review = reviewByCard.get(card.id)

    signals.set(card.id, {
      cardId: card.id,
      packId: card.pack_id,
      packLevel: card.pack_id ? levelByPack.get(card.pack_id) ?? null : null,
      isNew: !review,
      lapses: Number(review?.lapses ?? 0),
      easeFactor: Number(review?.ease_factor ?? 2.5),
      repetitions: Number(review?.repetitions ?? 0),
      recentErrors: errorsByCard.get(card.id) ?? 0,
      daysSinceSeen: review ? daysBetween(review.review_date, now) : 0,
      // Sem agendamento não há atraso: material novo entra pelo peso de novidade, não por urgência.
      daysOverdue: review ? daysBetween(review.next_review_date, now) : -999,
    })
  }

  return signals
}
