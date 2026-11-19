import type { DueCard } from '../components/GuidedReviewClient'

export type PendingReview = { card: DueCard; dueAt: number }
export type ReviewRecovery = { version: 2; at: number; queue: DueCard[]; pending: PendingReview[]; completed: number }
const TTL = 24 * 60 * 60 * 1000

/** Local drafts are hints, never scheduling authority. Submission still checks the server revision. */
export function parseReviewRecovery(raw: string | null, now = Date.now()): ReviewRecovery | null {
  try {
    const value = JSON.parse(raw || 'null') as ReviewRecovery | null
    if (!value || value.version !== 2 || !Number.isFinite(value.at) || value.at > now || now - value.at > TTL) return null
    if (!Number.isInteger(value.completed) || value.completed < 0 || value.completed > 10000) return null
    const validCard = (card: DueCard) => card && typeof card.card_id === 'string' && typeof card.pack_id === 'string' &&
      card.cards?.id === card.card_id && typeof card.cards.english_phrase === 'string' && typeof card.cards.portuguese_translation === 'string' &&
      Number.isFinite(card.total_reviews ?? 0) && Number.isFinite(card.repetitions)
    if (!Array.isArray(value.queue) || !Array.isArray(value.pending) || value.queue.length + value.pending.length > 200) return null
    if (!value.queue.every(validCard) || !value.pending.every(item => item && validCard(item.card) && Number.isFinite(item.dueAt))) return null
    const ids = [...value.queue, ...value.pending.map(item => item.card)].map(card => card.card_id)
    return new Set(ids).size === ids.length ? value : null
  } catch { return null }
}

export function reconcileReviewRecovery(saved: ReviewRecovery, fresh: DueCard[], now = Date.now(), sessionLimit = fresh.length, loaded = true) {
  const byId = new Map(fresh.map(card => [card.card_id, card]))
  // A more recent server revision invalidates the local scheduling hint for that card.
  const resolve = (card: DueCard) => byId.get(card.card_id) ?? card
  const pending: PendingReview[] = []
  // After a lost acknowledgement the card can already be scheduled for another day.
  // An unavailable server queue cannot confirm that, so keep the draft in that case.
  const queue = saved.queue.filter(card => !loaded || byId.has(card.card_id)).map(resolve)
  for (const item of saved.pending) {
    const server = byId.get(item.card.card_id)
    if (server && (server.total_reviews ?? 0) > (item.card.total_reviews ?? 0)) queue.push(server)
    else if (item.dueAt <= now) queue.push(resolve(item.card))
    else pending.push({ ...item, card: resolve(item.card) })
  }
  const recoveredIds = new Set([...queue.map(card => card.card_id), ...pending.map(item => item.card.card_id)])
  for (const card of fresh) {
    if (saved.completed + queue.length + pending.length >= sessionLimit) break
    if (!recoveredIds.has(card.card_id)) {
      queue.push(card)
      recoveredIds.add(card.card_id)
    }
  }
  return { queue, pending, completed: saved.completed }
}

export function guidedStepLabel(label: string, index: number, count: number) {
  return count > 0 ? `${label} · ${Math.min(Math.max(index + 1, 1), count)}/${count}` : label
}
