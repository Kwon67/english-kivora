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