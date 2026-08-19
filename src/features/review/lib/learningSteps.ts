import { calculateNextReview } from '@/features/review/lib/spacedRepetition'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'

/**
 * Sub-day learning steps, the piece SM-2 leaves out and Anki adds.
 *
 * Without them a failed card is scheduled a full day away, so "Errei" and "Bom" can produce the
 * same answer on a fresh card (both 1 day) and the learner never gets the immediate second look
 * that actually fixes a lapse. With them, a miss comes back inside the same session.
 *
 * A card is "in learning" until it clears the last step; only then does it graduate to the
 * day-based SM-2 schedule. A lapse on a graduated card drops it into the shorter relearning
 * ladder rather than resetting it to zero.
 *
 * This only works because the due-card query in reviewQueue gates on a timestamp. It used to
 * compare calendar dates, which made anything scheduled inside today already due — sub-day steps
 * would have made a missed card reappear instantly, over and over, in the same session.
 */

/** Minutes between the first sight of a card and graduation. */
export const LEARNING_STEPS_MINUTES = [1, 10] as const
/** Shorter ladder for a card that was already known and then lapsed. */
export const RELEARNING_STEPS_MINUTES = [10] as const

export const MINUTES_PER_DAY = 1440

/** Days a card waits after clearing the ladder with GOOD. */
export const GRADUATING_INTERVAL_DAYS = 1
/** Days a card waits when EASY graduates it early — the reward for effortless recall. */
export const EASY_INTERVAL_DAYS = 4

export type SchedulingState = {
  /** Index into the active ladder; null once the card has graduated to day intervals. */
  learningStep: number | null
  intervalDays: number
  easeFactor: number
  repetitions: number
  /** True when the card had already graduated before this answer (drives relearning vs learning). */
  hasGraduated: boolean
}

export type SchedulingResult = {
  learningStep: number | null
  intervalMinutes: number
  intervalDays: number
  easeFactor: number
  repetitions: number
  graduated: boolean
}

function ladderFor(state: SchedulingState) {
  return state.hasGraduated ? RELEARNING_STEPS_MINUTES : LEARNING_STEPS_MINUTES
}

/**
 * One answer, resolved against the learning ladder first and SM-2 only after graduation.
 *
 * - AGAIN always returns to the first step of the appropriate ladder.
 * - HARD repeats the current step rather than advancing, so a shaky card gets another look.
 * - GOOD advances one step, graduating off the end of the ladder.
 * - EASY graduates immediately from anywhere in the ladder.
 */
export function scheduleReview(grade: number, state: SchedulingState): SchedulingResult {
  const ladder = ladderFor(state)
  const inLearning = state.learningStep !== null

  if (inLearning) {
    const step = Math.min(Math.max(state.learningStep ?? 0, 0), ladder.length - 1)

    if (grade === REVIEW_GRADE.AGAIN) {
      return inLearningResult(0, ladder, state)
    }

    if (grade === REVIEW_GRADE.HARD) {
      return inLearningResult(step, ladder, state, hardMinutesFor(step, ladder))
    }

    if (grade === REVIEW_GRADE.GOOD && step + 1 < ladder.length) {
      return inLearningResult(step + 1, ladder, state)
    }

    // GOOD off the end of the ladder, or EASY from anywhere: graduate.
    return graduate(grade, state, true)
  }

  if (grade === REVIEW_GRADE.AGAIN) {
    // A lapse drops a graduated card into relearning instead of straight to a day.
    const lapsed = calculateNextReview(grade, state.intervalDays, state.easeFactor, state.repetitions)
    return {
      learningStep: 0,
      intervalMinutes: RELEARNING_STEPS_MINUTES[0],
      intervalDays: 0,
      easeFactor: lapsed.easeFactor,
      repetitions: lapsed.repetitions,
      graduated: false,
    }
  }

  return graduate(grade, state, false)
}

/**
 * HARD repeats the step, but returning at exactly the same delay would make it indistinguishable
 * from AGAIN on the first step. Anki's rule: wait the average of this step and the next one, or
 * half again the step when there is no next. On [1, 10] that turns the first step into ~6 min,
 * so all four grades resolve to different answers on a brand new card.
 */
function hardMinutesFor(step: number, ladder: readonly number[]): number {
  const next = ladder[step + 1]
  return Math.round(next === undefined ? ladder[step] * 1.5 : (ladder[step] + next) / 2)
}

function inLearningResult(
  step: number,
  ladder: readonly number[],
  state: SchedulingState,
  overrideMinutes?: number,
): SchedulingResult {
  return {
    learningStep: step,
    intervalMinutes: overrideMinutes ?? ladder[step],
    intervalDays: 0,
    easeFactor: state.easeFactor,
    repetitions: state.repetitions,
    graduated: false,
  }
}

function graduate(grade: number, state: SchedulingState, fromLadder: boolean): SchedulingResult {
  const next = calculateNextReview(grade, state.intervalDays, state.easeFactor, state.repetitions)

  // Leaving the ladder uses fixed graduating intervals rather than raw SM-2, which returns 1 day
  // for every passing grade on a first review — the reason GOOD and EASY used to look identical.
  // The ease change still comes from SM-2, so an EASY graduation carries its bonus forward.
  const intervalDays = fromLadder
    ? grade === REVIEW_GRADE.EASY
      ? EASY_INTERVAL_DAYS
      : GRADUATING_INTERVAL_DAYS
    : next.intervalDays

  return {
    learningStep: null,
    intervalMinutes: intervalDays * MINUTES_PER_DAY,
    intervalDays,
    easeFactor: next.easeFactor,
    repetitions: next.repetitions,
    graduated: true,
  }
}

/**
 * Builds the scheduling state from a stored row, so the server action and the button labels
 * cannot disagree about which ladder a card is on.
 *
 * `repetitions` is what decides graduation, not `interval_days`. A card that was reset by a
 * failure keeps its old interval on the row but has repetitions 0, and must go back through the
 * ladder — judging by interval alone sent those cards down the graduated path, where SM-2 hands
 * every passing grade the same 1 day and the buttons collapse into each other again.
 *
 * Rows created before the learning_step column exists carry null, so their step is inferred.
 */
export function toSchedulingState(card: {
  interval_days?: number | null
  ease_factor?: number | null
  repetitions?: number | null
  learning_step?: number | null
  isNew?: boolean
}): SchedulingState {
  const repetitions = card.repetitions ?? 0
  const hasGraduated = repetitions > 0
  const storedStep = card.learning_step ?? null

  return {
    learningStep: card.isNew ? 0 : storedStep ?? (hasGraduated ? null : 0),
    intervalDays: card.interval_days ?? 0,
    easeFactor: card.ease_factor ?? 2.5,
    repetitions,
    hasGraduated,
  }
}

/** Label for the rating buttons, now able to express sub-day returns honestly. */
export function formatMinutesEstimate(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`
  if (minutes < MINUTES_PER_DAY) {
    const hours = Math.round(minutes / 60)
    return hours === 1 ? '1 hora' : `${hours} horas`
  }

  const days = Math.round(minutes / MINUTES_PER_DAY)
  if (days === 1) return '1 dia'
  if (days < 30) return `${days} dias`

  const months = Math.round(days / 30)
  if (months < 12) return months === 1 ? '1 mês' : `${months} meses`

  const years = Math.round(days / 365)
  return years <= 1 ? '1 ano' : `${years} anos`
}
