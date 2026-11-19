import { describe, expect, it } from 'vitest'
import { guidedStepLabel, parseReviewRecovery, reconcileReviewRecovery, type ReviewRecovery } from './reviewRecovery'
import type { DueCard } from '../components/GuidedReviewClient'
const card = { card_id: 'a', pack_id: 'p', cards: { id: 'a', english_phrase: 'Hello.', portuguese_translation: 'Olá.' }, repetitions: 0, total_reviews: 1 } as DueCard
const saved: ReviewRecovery = { version: 2, at: 100, queue: [], pending: [{ card, dueAt: 300 }], completed: 1 }
describe('review recovery', () => {
  it('restores pending relearning even when the server due queue is empty', () => {
    expect(reconcileReviewRecovery(saved, [], 200)).toEqual({ queue: [], pending: saved.pending, completed: 1 })
    expect(reconcileReviewRecovery(saved, [], 400)).toEqual({ queue: [card], pending: [], completed: 1 })
  })
  it('prefers a newer server revision over local scheduling', () => {
    const newer = { ...card, total_reviews: 2 }
    expect(reconcileReviewRecovery(saved, [newer], 200).queue).toEqual([newer])
    expect(reconcileReviewRecovery(saved, [newer], 200).pending).toEqual([])
  })
  it('rejects malformed, duplicate, expired and future drafts', () => {
    for (const value of [null, {}, { ...saved, at: 999 }, { ...saved, completed: -1 }, { ...saved, queue: [card] }, { ...saved, pending: [{}] }]) {
      expect(parseReviewRecovery(JSON.stringify(value), 200)).toBeNull()
    }
    expect(parseReviewRecovery('{', 200)).toBeNull()
    expect(parseReviewRecovery(JSON.stringify(saved), 86400200)).toBeNull()
    expect(parseReviewRecovery(JSON.stringify(saved), 200)).toEqual(saved)
  })
  it('never shows 1/0 for flashcard-only review', () => {
    expect(guidedStepLabel('Flashcard', 0, 0)).toBe('Flashcard')
    expect(guidedStepLabel('Escuta', 9, 2)).toBe('Escuta · 2/2')
  })
  it('restores a fresh queue after the server saved a grade but its acknowledgement was lost', () => {
    const next = { ...card, card_id: 'b' }
    const old = { ...saved, queue: [card], pending: [], completed: 0 }
    expect(reconcileReviewRecovery(old, [next], 200, 1).queue).toEqual([next])
    expect(reconcileReviewRecovery(old, [], 200, 1, false).queue).toEqual([card])
  })

  it('keeps the remaining budget and never appends a pending or existing card twice', () => {
    const next = { ...card, card_id: 'b' }
    const later = { ...card, card_id: 'c' }
    const recovered = reconcileReviewRecovery(saved, [card, next, later], 200, 3)
    expect(recovered.queue).toEqual([next])
    expect(recovered.pending).toEqual(saved.pending)
  })
})
