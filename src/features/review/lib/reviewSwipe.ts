import { REVIEW_GRADE, type ReviewGrade } from '@/features/review/lib/reviewGrades'

export const REVIEW_SWIPE_MIN_DISTANCE = 28
export const REVIEW_SWIPE_ZONE_THRESHOLD = 70

export type ReviewSwipeQuality = ReviewGrade

/**
 * The gesture stays three-zone — four swipe targets are not distinguishable by thumb — but it
 * now writes the same grades as the buttons. It used to send 0/3/5, where 0 wiped the card and
 * 3 quietly degraded it; a centre swipe is the ordinary "I recalled it" answer, so it maps to
 * GOOD. HARD has no gesture and is reachable from its button.
 */
export function resolveReviewSwipeQuality(movementX: number): ReviewSwipeQuality | null {
  if (Math.abs(movementX) < REVIEW_SWIPE_MIN_DISTANCE) return null

  if (movementX < -REVIEW_SWIPE_ZONE_THRESHOLD) return REVIEW_GRADE.AGAIN
  if (movementX > REVIEW_SWIPE_ZONE_THRESHOLD) return REVIEW_GRADE.EASY
  return REVIEW_GRADE.GOOD
}

export function getReviewSwipeVisual(offsetX: number): 'easy' | 'good' | 'hard' | 'neutral' {
  if (offsetX > REVIEW_SWIPE_ZONE_THRESHOLD) return 'easy'
  if (offsetX < -REVIEW_SWIPE_ZONE_THRESHOLD) return 'hard'
  if (Math.abs(offsetX) >= REVIEW_SWIPE_MIN_DISTANCE) return 'good'
  return 'neutral'
}
