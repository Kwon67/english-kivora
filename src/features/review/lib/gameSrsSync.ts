import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import { scheduleReview, toSchedulingState } from '@/features/review/lib/learningSteps'
import { isLeech, nextLapseCount } from '@/features/review/lib/leech'

/**
 * Como uma partida (plano do dia, Blitz) conversa com a repetição espaçada.
 *
 * Antes havia DOIS agendadores no app. `/review` usava a escada de aprendizado (`scheduleReview`:
 * passos de minutos, lapso guarda metade do intervalo, `lapses` conta para o leech). Os jogos
 * usavam `calculateNextReview(1, …)` cru — SM-2 de 2018: repetições zeradas, intervalo de 1 dia,
 * `learning_step` intocado, `lapses` nunca incrementado. Um card de 60 dias errado no Blitz
 * voltava à estaca zero, exatamente o comportamento que a escada existia para corrigir; e como
 * `lapses` não subia, o leech era cego a erros de jogo. Pior: card já vencido errado no jogo NÃO
 * era punido ("se está agendado para hoje, deixa o SRS cuidar").
 *
 * E o acerto em jogo nunca tocava o SRS. Dez partidas limpas não moviam um intervalo sequer.
 *
 * Agora há um agendador só. Regras:
 * - ERRO → `AGAIN` pela escada, em qualquer estado do card. Sem linha ainda, o card nasce na
 *   escada de card novo (1 min), como se tivesse sido apresentado e errado na revisão.
 * - ACERTO → `GOOD` pela escada, mas SÓ em card que já tem linha e está VENCIDO. Acertar cedo
 *   demais não adianta o relógio (é a mesma regra da fila de revisão), e card sem linha continua
 *   sendo apresentado pela revisão — o jogo não vira porta de entrada de material novo, senão o
 *   limite diário de cards novos deixa de valer.
 * - Card errado E acertado na mesma partida (a rodada de erros): vale o erro.
 * - Leech não recebe crédito automático; ele só volta quando revisado de propósito.
 */

export type ExistingReviewRow = {
  card_id: string
  pack_id: string
  interval_days: number | null
  ease_factor: number | null
  repetitions: number | null
  total_reviews: number | null
  learning_step: number | null
  lapses: number | null
  next_review_date: string
}

export type CardReviewUpsert = {
  user_id: string
  card_id: string
  pack_id: string
  review_date: string
  next_review_date: string
  interval_days: number
  ease_factor: number
  repetitions: number
  learning_step: number | null
  lapses: number
  quality: number
  total_reviews: number
}

export type GameSrsPlanInput = {
  userId: string
  now: Date
  /** `card_id -> pack_id` de todo card citado, já confirmado no banco. */
  packIdByCardId: Map<string, string>
  existingByCardId: Map<string, ExistingReviewRow>
  missedCardIds: Iterable<string>
  correctCardIds?: Iterable<string>
}

function buildUpsert(
  input: GameSrsPlanInput,
  cardId: string,
  grade: number,
  existing: ExistingReviewRow | undefined
): CardReviewUpsert | null {
  const packId = input.packIdByCardId.get(cardId)
  if (!packId) return null

  const scheduled = scheduleReview(
    grade,
    toSchedulingState({
      interval_days: existing?.interval_days ?? 0,
      ease_factor: existing?.ease_factor ?? 2.5,
      repetitions: existing?.repetitions ?? 0,
      learning_step: existing?.learning_step ?? null,
      isNew: !existing,
    })
  )

  const wasGraduated = (existing?.repetitions ?? 0) > 0
  const lapses = nextLapseCount(grade, existing?.lapses ?? 0, wasGraduated)
  const nextReviewDate = new Date(input.now.getTime() + scheduled.intervalMinutes * 60 * 1000)

  return {
    user_id: input.userId,
    card_id: cardId,
    pack_id: packId,
    review_date: input.now.toISOString(),
    next_review_date: nextReviewDate.toISOString(),
    interval_days: scheduled.intervalDays,
    ease_factor: scheduled.easeFactor,
    repetitions: scheduled.repetitions,
    learning_step: scheduled.learningStep,
    lapses,
    quality: grade,
    total_reviews: (existing?.total_reviews ?? 0) + 1,
  }
}

/** Puro: decide o que gravar. A camada de banco só carrega o estado e despacha o upsert. */
export function planGameSrsWrites(input: GameSrsPlanInput): CardReviewUpsert[] {
  const missed = new Set(input.missedCardIds)
  const writes: CardReviewUpsert[] = []

  for (const cardId of missed) {
    const write = buildUpsert(input, cardId, REVIEW_GRADE.AGAIN, input.existingByCardId.get(cardId))
    if (write) writes.push(write)
  }

  const nowMs = input.now.getTime()
  for (const cardId of new Set(input.correctCardIds ?? [])) {
    if (missed.has(cardId)) continue
    const existing = input.existingByCardId.get(cardId)
    if (!existing) continue
    if (isLeech(existing.lapses)) continue
    if (new Date(existing.next_review_date).getTime() > nowMs) continue

    const write = buildUpsert(input, cardId, REVIEW_GRADE.GOOD, existing)
    if (write) writes.push(write)
  }

  return writes
}

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      in: (column: string, values: string[]) => PromiseLike<{ data: unknown; error: unknown }> & {
        eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>
      }
    }
    upsert: (
      rows: CardReviewUpsert[],
      options: { onConflict: string }
    ) => PromiseLike<{ error: { message: string } | null }>
  }
}

/**
 * Carrega cards e histórico, planeja e grava. Falha em silêncio LOGADO: a partida já foi salva
 * quando isto roda, e um erro aqui não pode desfazer o resultado que a pessoa viu.
 */
export async function syncGameAnswersToSrs(
  supabase: SupabaseLike,
  input: {
    userId: string
    missedCardIds: string[]
    correctCardIds?: string[]
    /** Quando informado, ignora cards de outros packs (a partida é de um pack só). */
    packId?: string
    now?: Date
  }
): Promise<{ written: number }> {
  const cardIds = [...new Set([...input.missedCardIds, ...(input.correctCardIds ?? [])])]
  if (cardIds.length === 0) return { written: 0 }

  const cardsQuery = supabase.from('cards').select('id,pack_id').in('id', cardIds)
  const { data: cardRows, error: cardsError } = await (input.packId
    ? cardsQuery.eq('pack_id', input.packId)
    : cardsQuery)
  if (cardsError || !Array.isArray(cardRows)) {
    console.error('SRS: não foi possível confirmar os cards da partida', cardsError)
    return { written: 0 }
  }

  const packIdByCardId = new Map<string, string>()
  for (const row of cardRows as Array<{ id: string; pack_id: string }>) {
    packIdByCardId.set(row.id, row.pack_id)
  }
  if (packIdByCardId.size === 0) return { written: 0 }

  const { data: reviewRows, error: reviewsError } = await supabase
    .from('card_reviews')
    .select('card_id,pack_id,interval_days,ease_factor,repetitions,total_reviews,learning_step,lapses,next_review_date')
    .in('card_id', [...packIdByCardId.keys()])
    .eq('user_id', input.userId)
  if (reviewsError) {
    console.error('SRS: não foi possível carregar o histórico da partida', reviewsError)
    return { written: 0 }
  }

  const existingByCardId = new Map<string, ExistingReviewRow>()
  for (const row of (reviewRows as ExistingReviewRow[] | null) ?? []) {
    existingByCardId.set(row.card_id, row)
  }

  const writes = planGameSrsWrites({
    userId: input.userId,
    now: input.now ?? new Date(),
    packIdByCardId,
    existingByCardId,
    missedCardIds: input.missedCardIds,
    correctCardIds: input.correctCardIds,
  })
  if (writes.length === 0) return { written: 0 }

  const { error } = await supabase.from('card_reviews').upsert(writes, { onConflict: 'user_id,card_id' })
  if (error) {
    console.error('SRS: falha ao gravar respostas da partida', error)
    return { written: 0 }
  }

  return { written: writes.length }
}
