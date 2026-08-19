import { calculateNextReview } from '@/features/review/lib/spacedRepetition'

/**
 * The four SM-2 grades the learner can give, mapped the way SM-2 actually defines them.
 *
 * The previous UI sent Difícil→0, Bom→3, Fácil→5, which broke the algorithm in two ways:
 *
 * - SM-2's neutral grade is 4, not 3. At q=3 the ease change is −0.14, so "Bom" — the answer
 *   a learner gives whenever they simply recalled the card — pushed every card downwards on
 *   every single review. Eight consecutive "Bom" took a card from ease 2.5 to 1.38, essentially
 *   the 1.3 floor, collapsing its intervals and growing the daily queue without bound.
 * - q=0 means "complete blackout" and wipes the card: repetitions reset to 0, interval to 1 day,
 *   ease −0.8. A learner reading "Difícil" means "I got it, with effort", not "I have never
 *   seen this". Two taps put the card at the floor permanently.
 *
 * There was also no failing grade at all, so a card the learner had completely forgotten still
 * advanced. AGAIN restores that. The mapping now matches Anki's Again / Hard / Good / Easy.
 */
export const REVIEW_GRADE = {
  /** Forgot it. Resets repetitions and returns the card immediately. */
  AGAIN: 0,
  /** Recalled with effort. Passes, with a small ease penalty (−0.14). */
  HARD: 3,
  /** Recalled. Ease-neutral (0) — this is the expected default answer. */
  GOOD: 4,
  /** Effortless. Ease bonus (+0.1). */
  EASY: 5,
} as const

export type ReviewGrade = (typeof REVIEW_GRADE)[keyof typeof REVIEW_GRADE]

export function isReviewGrade(value: number): value is ReviewGrade {
  return Object.values(REVIEW_GRADE).includes(value as ReviewGrade)
}

/** Days until the card returns for a given grade, from the scheduler itself. */
export function getNextIntervalDays(
  card: { interval_days?: number | null; ease_factor?: number | null; repetitions?: number | null },
  grade: number,
): number {
  return calculateNextReview(
    grade,
    Math.max(0, card.interval_days ?? 0),
    card.ease_factor ?? 2.5,
    card.repetitions ?? 0,
  ).intervalDays
}

/**
 * Human label for that interval.
 *
 * This must be derived from `calculateNextReview`, never recomputed. The old UI reimplemented
 * the maths and disagreed with what it then stored: it promised "1 min" for Difícil while
 * writing `interval_days = 1` (the card came back the next day), and promised
 * `interval × ease × 1.5` for Fácil while the scheduler used `interval × ease` — showing 38 days
 * where the card was really scheduled for 25.
 */
export function formatIntervalEstimate(days: number): string {
  if (days <= 0) return 'hoje'
  if (days === 1) return '1 dia'
  if (days < 30) return `${days} dias`

  const months = Math.round(days / 30)
  if (months < 12) return months === 1 ? '1 mês' : `${months} meses`

  const years = Math.round(days / 365)
  return years <= 1 ? '1 ano' : `${years} anos`
}

export function getReviewIntervalEstimate(
  card: { interval_days?: number | null; ease_factor?: number | null; repetitions?: number | null },
  grade: number,
): string {
  return formatIntervalEstimate(getNextIntervalDays(card, grade))
}
