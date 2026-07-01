export const REVIEW_SWIPE_MIN_DISTANCE = 28
export const REVIEW_SWIPE_ZONE_THRESHOLD = 70

export type ReviewSwipeQuality = 0 | 3 | 5

export function resolveReviewSwipeQuality(movementX: number): ReviewSwipeQuality | null {
  if (Math.abs(movementX) < REVIEW_SWIPE_MIN_DISTANCE) return null

  if (movementX < -REVIEW_SWIPE_ZONE_THRESHOLD) return 0
  if (movementX > REVIEW_SWIPE_ZONE_THRESHOLD) return 5
  return 3
}

export function getReviewSwipeVisual(offsetX: number): 'easy' | 'good' | 'hard' | 'neutral' {
  if (offsetX > REVIEW_SWIPE_ZONE_THRESHOLD) return 'easy'
  if (offsetX < -REVIEW_SWIPE_ZONE_THRESHOLD) return 'hard'
  if (Math.abs(offsetX) >= REVIEW_SWIPE_MIN_DISTANCE) return 'good'
  return 'neutral'
}