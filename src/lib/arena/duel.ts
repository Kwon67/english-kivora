export type ArenaEvent = {
  timeMs: number
  correct: boolean
}

export function countArenaEvents(events: unknown) {
  return Array.isArray(events) ? events.length : 0
}

export function countCorrectArenaEvents(events: unknown) {
  if (!Array.isArray(events)) return 0

  return events.filter((event) => (
    event &&
    typeof event === 'object' &&
    'correct' in event &&
    event.correct === true
  )).length
}

export function inferArenaProgress({
  explicitProgress,
  events,
  score,
}: {
  explicitProgress?: number | null
  events: unknown
  score: number
}) {
  if (typeof explicitProgress === 'number') return explicitProgress

  return Math.max(score, countCorrectArenaEvents(events))
}

export function resolveArenaWinner({
  player1Id,
  player2Id,
  player1Score,
  player2Score,
  player1Progress,
  player2Progress,
  player1Wrong,
  player2Wrong,
}: {
  player1Id: string | null
  player2Id: string | null
  player1Score: number
  player2Score: number
  player1Progress: number
  player2Progress: number
  player1Wrong: number
  player2Wrong: number
}) {
  if (player1Score !== player2Score) {
    return player1Score > player2Score ? player1Id : player2Id
  }

  if (player1Progress !== player2Progress) {
    return player1Progress > player2Progress ? player1Id : player2Id
  }

  if (player1Wrong !== player2Wrong) {
    return player1Wrong < player2Wrong ? player1Id : player2Id
  }

  return null
}
