import { describe, expect, it } from 'vitest'
import {
  countCorrectArenaEvents,
  inferArenaProgress,
  resolveArenaWinner,
} from './duel'

describe('arena duel result rules', () => {
  it('resolves winner by score first', () => {
    expect(resolveArenaWinner({
      player1Id: 'p1',
      player2Id: 'p2',
      player1Score: 7,
      player2Score: 5,
      player1Progress: 5,
      player2Progress: 10,
      player1Wrong: 4,
      player2Wrong: 1,
    })).toBe('p1')
  })

  it('uses progress as the first tie breaker', () => {
    expect(resolveArenaWinner({
      player1Id: 'p1',
      player2Id: 'p2',
      player1Score: 5,
      player2Score: 5,
      player1Progress: 4,
      player2Progress: 6,
      player1Wrong: 1,
      player2Wrong: 3,
    })).toBe('p2')
  })

  it('uses fewer wrong answers as the second tie breaker', () => {
    expect(resolveArenaWinner({
      player1Id: 'p1',
      player2Id: 'p2',
      player1Score: 5,
      player2Score: 5,
      player1Progress: 5,
      player2Progress: 5,
      player1Wrong: 2,
      player2Wrong: 1,
    })).toBe('p2')
  })

  it('returns draw when score, progress and wrong answers match', () => {
    expect(resolveArenaWinner({
      player1Id: 'p1',
      player2Id: 'p2',
      player1Score: 5,
      player2Score: 5,
      player1Progress: 5,
      player2Progress: 5,
      player1Wrong: 2,
      player2Wrong: 2,
    })).toBeNull()
  })

  it('does not count wrong events as progress', () => {
    const events = [
      { timeMs: 100, correct: true },
      { timeMs: 200, correct: false },
      { timeMs: 300, correct: true },
    ]

    expect(countCorrectArenaEvents(events)).toBe(2)
    expect(inferArenaProgress({ events, score: 1 })).toBe(2)
  })

  it('trusts explicit progress over event count', () => {
    const events = [
      { timeMs: 100, correct: true },
      { timeMs: 200, correct: true },
      { timeMs: 300, correct: true },
    ]

    expect(inferArenaProgress({ explicitProgress: 1, events, score: 3 })).toBe(1)
  })
})
