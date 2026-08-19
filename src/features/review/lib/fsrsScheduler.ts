import {
  Rating,
  State,
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'

/**
 * FSRS scheduling, replacing SM-2.
 *
 * SM-2 (1987) models a card with one number, `ease`, nudged up or down by a fixed step. FSRS
 * models memory with two — stability (how long a memory lasts) and difficulty (how hard this
 * item is for you) — fitted against millions of real reviews. In practice it reaches the same
 * retention with materially fewer reviews, because SM-2 systematically over-reviews easy cards
 * and under-reviews hard ones.
 *
 * NOT WIRED YET: needs the columns from
 * `supabase/migrations/20260818130000_card_reviews_fsrs.sql` to exist first.
 *
 * Fuzz is off. It is a good idea in Anki, where it spreads a huge backlog across days, but it
 * makes the interval shown on a rating button differ from the interval actually stored — and we
 * just spent item 1 making those two agree.
 */

const scheduler = fsrs(generatorParameters({ enable_fuzz: false }))

/** Target probability of recall at review time. FSRS default; raise it to study more, not less. */
export const FSRS_DEFAULT_RETENTION = 0.9

// Typed as Grade, not Rating: Rating also contains Manual, which the scheduler cannot preview.
const GRADE_TO_RATING: Record<number, Grade> = {
  [REVIEW_GRADE.AGAIN]: Rating.Again,
  [REVIEW_GRADE.HARD]: Rating.Hard,
  [REVIEW_GRADE.GOOD]: Rating.Good,
  [REVIEW_GRADE.EASY]: Rating.Easy,
}

export type FsrsState = {
  stability: number | null
  difficulty: number | null
  /**
   * Index into FSRS's own learning/relearning ladder. MUST be persisted and fed back in.
   * `createEmptyCard` resets it to 0, so a card that does not carry it forward repeats step 0
   * forever: answering "Bom" never graduates it, and it returns every 10 minutes for life.
   * Reuses the existing `learning_step` column from the item-4 migration.
   */
  learningStep: number | null
  /** 0 New, 1 Learning, 2 Review, 3 Relearning. */
  state: number | null
  reps: number | null
  lapses: number | null
  lastReview: string | null
  due: string | null
}

export type FsrsResult = {
  stability: number
  difficulty: number
  state: number
  /** Persist this to `learning_step`, or new cards never graduate. */
  learningStep: number
  reps: number
  lapses: number
  due: Date
  intervalMinutes: number
  /** Whole days, kept so existing SM-2 columns and any day-based UI stay meaningful. */
  intervalDays: number
}

/**
 * Legacy SM-2 rows carry interval/ease but no stability/difficulty. Rather than reset every
 * card — which would throw away real review history and flood the queue — seed FSRS from what
 * SM-2 already knew: the current interval is the best available estimate of stability, and ease
 * maps onto difficulty inversely (low ease meant the learner kept struggling).
 *
 * This is an approximation, and FSRS self-corrects within a few reviews. It is still far better
 * than starting everyone from zero.
 */
export function seedFromSm2(sm2: {
  interval_days?: number | null
  ease_factor?: number | null
  repetitions?: number | null
}): { stability: number; difficulty: number } {
  const interval = Math.max(sm2.interval_days ?? 0, 0)
  const ease = sm2.ease_factor ?? 2.5

  // SM-2 ease runs 1.3 (hardest) to ~2.7 (easiest); FSRS difficulty runs 1 (easiest) to 10.
  const easeSpan = Math.min(Math.max(ease, 1.3), 2.7)
  const normalised = (easeSpan - 1.3) / (2.7 - 1.3)
  const difficulty = Math.min(10, Math.max(1, 10 - normalised * 9))

  return {
    stability: Math.max(interval, 0.5),
    difficulty: Number(difficulty.toFixed(2)),
  }
}

function toFsrsCard(state: FsrsState, now: Date): FsrsCard {
  const empty = createEmptyCard(now)
  if (state.stability === null || state.difficulty === null) {
    return { ...empty, learning_steps: state.learningStep ?? 0 }
  }

  return {
    ...empty,
    learning_steps: state.learningStep ?? 0,
    stability: state.stability,
    difficulty: state.difficulty,
    state: (state.state ?? State.Review) as FsrsCard['state'],
    reps: state.reps ?? 0,
    lapses: state.lapses ?? 0,
    due: state.due ? new Date(state.due) : now,
    last_review: state.lastReview ? new Date(state.lastReview) : undefined,
  }
}

/** One answer. `now` is injectable so tests are not clock-dependent. */
export function scheduleWithFsrs(grade: number, state: FsrsState, now: Date = new Date()): FsrsResult {
  const rating = GRADE_TO_RATING[grade] ?? Rating.Good
  const result = scheduler.repeat(toFsrsCard(state, now), now)[rating]
  const card = result.card
  const due = new Date(card.due)
  const intervalMinutes = Math.max(1, Math.round((due.getTime() - now.getTime()) / 60000))

  return {
    stability: Number(card.stability.toFixed(4)),
    difficulty: Number(card.difficulty.toFixed(4)),
    state: card.state,
    learningStep: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    due,
    intervalMinutes,
    intervalDays: Math.max(0, Math.round(intervalMinutes / 1440)),
  }
}

/** Days of memory left before recall probability drops to the target. Powers "what to review". */
export function getRetrievability(state: FsrsState, now: Date = new Date()): number | null {
  if (state.stability === null || state.difficulty === null || !state.lastReview) return null
  return scheduler.get_retrievability(toFsrsCard(state, now), now, false) as number
}
