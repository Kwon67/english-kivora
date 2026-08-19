import { describe, expect, it } from 'vitest'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import {
  scheduleWithFsrs,
  seedFromSm2,
  type FsrsState,
} from '@/features/review/lib/fsrsScheduler'

const NOW = new Date('2026-08-18T12:00:00.000Z')

const newCard: FsrsState = {
  stability: null,
  difficulty: null,
  learningStep: null,
  state: null,
  reps: null,
  lapses: null,
  lastReview: null,
  due: null,
}

const ALL_GRADES = [
  REVIEW_GRADE.AGAIN,
  REVIEW_GRADE.HARD,
  REVIEW_GRADE.GOOD,
  REVIEW_GRADE.EASY,
]

describe('grade mapping', () => {
  it('keeps the four grades distinct and increasing on a new card', () => {
    const minutes = ALL_GRADES.map((g) => scheduleWithFsrs(g, newCard, NOW).intervalMinutes)
    expect(new Set(minutes).size).toBe(4)
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b))
  })

  it('brings a failed card back inside the session', () => {
    expect(scheduleWithFsrs(REVIEW_GRADE.AGAIN, newCard, NOW).intervalMinutes).toBeLessThan(60)
  })

  it('is deterministic — the interval shown is the interval stored', () => {
    // Fuzz is disabled on purpose; with it on, two identical calls disagree and the rating
    // button would promise something the scheduler does not deliver.
    const a = scheduleWithFsrs(REVIEW_GRADE.GOOD, newCard, NOW)
    const b = scheduleWithFsrs(REVIEW_GRADE.GOOD, newCard, NOW)
    expect(a.intervalMinutes).toBe(b.intervalMinutes)
    expect(a.due.toISOString()).toBe(b.due.toISOString())
  })
})

describe('memory model', () => {
  const review: FsrsState = {
    stability: 20,
    difficulty: 5,
    learningStep: null,
    state: 2,
    reps: 6,
    lapses: 0,
    lastReview: '2026-07-29T12:00:00.000Z',
    due: NOW.toISOString(),
  }

  it('grows stability on success and cuts it on a lapse', () => {
    expect(scheduleWithFsrs(REVIEW_GRADE.GOOD, review, NOW).stability).toBeGreaterThan(review.stability!)
    expect(scheduleWithFsrs(REVIEW_GRADE.AGAIN, review, NOW).stability).toBeLessThan(review.stability!)
  })

  it('counts a lapse only when the card is actually failed', () => {
    expect(scheduleWithFsrs(REVIEW_GRADE.AGAIN, review, NOW).lapses).toBe(1)
    for (const grade of [REVIEW_GRADE.HARD, REVIEW_GRADE.GOOD, REVIEW_GRADE.EASY]) {
      expect(scheduleWithFsrs(grade, review, NOW).lapses).toBe(0)
    }
  })

  it('makes a card harder after a failure and easier after an easy answer', () => {
    expect(scheduleWithFsrs(REVIEW_GRADE.AGAIN, review, NOW).difficulty).toBeGreaterThan(review.difficulty!)
    expect(scheduleWithFsrs(REVIEW_GRADE.EASY, review, NOW).difficulty).toBeLessThan(review.difficulty!)
  })

  it('does not degrade a card that is answered correctly, unlike the old SM-2 mapping', () => {
    // The regression that started this whole refactor: repeated "Bom" used to walk ease down to
    // the floor. Under FSRS the same answer must keep pushing the interval out.
    let state = { ...review }
    let clock = NOW
    let previousInterval = 0

    for (let i = 0; i < 6; i += 1) {
      const next = scheduleWithFsrs(REVIEW_GRADE.GOOD, state, clock)
      expect(next.intervalMinutes).toBeGreaterThan(previousInterval)
      previousInterval = next.intervalMinutes

      state = {
        ...state,
        stability: next.stability,
        difficulty: next.difficulty,
        state: next.state,
        learningStep: next.learningStep,
        reps: next.reps,
        lapses: next.lapses,
        lastReview: clock.toISOString(),
        due: next.due.toISOString(),
      }
      // Answer each card when it actually comes due. Holding the clock still would keep
      // elapsed_days at 0, and FSRS grows stability from time survived, not from taps.
      clock = next.due
    }

    expect(state.stability!).toBeGreaterThan(review.stability!)
  })
})

describe('graduation', () => {
  it('graduates a new card instead of looping the learning ladder forever', () => {
    // Regression: toFsrsCard used to spread createEmptyCard, which resets learning_steps to 0.
    // The card sat on step 0 permanently — eight consecutive "Bom" all returned 10 min with the
    // stability frozen at 2.3065. Every new card would have been an infinite 10-minute loop.
    let state = { ...newCard }
    let clock = NOW

    for (let i = 0; i < 4; i += 1) {
      const next = scheduleWithFsrs(REVIEW_GRADE.GOOD, state, clock)
      state = {
        ...state,
        stability: next.stability,
        difficulty: next.difficulty,
        state: next.state,
        learningStep: next.learningStep,
        reps: next.reps,
        lapses: next.lapses,
        lastReview: clock.toISOString(),
        due: next.due.toISOString(),
      }
      clock = next.due
    }

    // 2 = Review. Reaching it is the whole point of a learning ladder.
    expect(state.state).toBe(2)
    expect(scheduleWithFsrs(REVIEW_GRADE.GOOD, state, clock).intervalMinutes).toBeGreaterThan(1440)
  })

  it('advances the step on GOOD rather than resetting it', () => {
    const first = scheduleWithFsrs(REVIEW_GRADE.GOOD, newCard, NOW)
    expect(first.learningStep).toBeGreaterThan(0)
  })
})

describe('seedFromSm2', () => {
  it('carries the existing interval over as stability instead of resetting it', () => {
    expect(seedFromSm2({ interval_days: 30, ease_factor: 2.5 }).stability).toBe(30)
  })

  it('never seeds a zero stability', () => {
    expect(seedFromSm2({ interval_days: 0, ease_factor: 2.5 }).stability).toBeGreaterThan(0)
  })

  it('maps low ease to high difficulty and vice versa', () => {
    const struggled = seedFromSm2({ interval_days: 5, ease_factor: 1.3 })
    const easy = seedFromSm2({ interval_days: 5, ease_factor: 2.7 })
    expect(struggled.difficulty).toBeGreaterThan(easy.difficulty)
    expect(struggled.difficulty).toBeLessThanOrEqual(10)
    expect(easy.difficulty).toBeGreaterThanOrEqual(1)
  })

  it('produces a state FSRS accepts and schedules forward from', () => {
    const seeded = seedFromSm2({ interval_days: 30, ease_factor: 2.5, repetitions: 8 })
    const next = scheduleWithFsrs(REVIEW_GRADE.GOOD, {
      ...newCard,
      stability: seeded.stability,
      difficulty: seeded.difficulty,
      state: 2,
      reps: 8,
      lastReview: '2026-07-19T12:00:00.000Z',
      due: NOW.toISOString(),
    }, NOW)

    expect(next.intervalDays).toBeGreaterThan(1)
    expect(Number.isFinite(next.stability)).toBe(true)
  })
})
