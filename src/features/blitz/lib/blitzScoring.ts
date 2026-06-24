export const BLITZ_LIVES = 3
export const BLITZ_BASE_POINTS = 10
export const BLITZ_SPEED_BONUS = 3
export const BLITZ_SPEED_THRESHOLD_MS = 3000
export const BLITZ_NOTABLE_SCORE = 100

export function getComboMultiplier(combo: number): number {
  if (combo >= 10) return 5
  if (combo >= 5) return 3
  if (combo >= 3) return 2
  return 1
}

export function calculateBlitzPoints(comboAfterCorrect: number, latencyMs: number): number {
  const multiplier = getComboMultiplier(comboAfterCorrect)
  const speedBonus = latencyMs < BLITZ_SPEED_THRESHOLD_MS ? BLITZ_SPEED_BONUS : 0
  return BLITZ_BASE_POINTS * multiplier + speedBonus
}

export function isGameOver(lives: number): boolean {
  return lives <= 0
}

export function getBlitzSessionProgress(
  cardsAnswered: number,
  totalCards: number,
  lives: number
): number {
  if (lives <= 0) return 100

  const livesLost = BLITZ_LIVES - lives
  const segmentSize = 100 / BLITZ_LIVES
  const cardsPerLife = Math.max(4, Math.ceil(Math.max(totalCards, 1) / BLITZ_LIVES))
  const cardsInCurrentSegment = cardsAnswered - livesLost * cardsPerLife
  const segmentProgress = Math.min(1, Math.max(0, cardsInCurrentSegment / cardsPerLife))

  return Math.min(99, Math.round(livesLost * segmentSize + segmentProgress * segmentSize))
}

export function getBlitzSessionPhase(progress: number): 'início' | 'meio' | 'final' | 'fim' {
  if (progress >= 100) return 'fim'
  if (progress >= 67) return 'final'
  if (progress >= 34) return 'meio'
  return 'início'
}