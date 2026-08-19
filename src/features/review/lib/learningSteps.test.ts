import { describe, expect, it } from 'vitest'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import {
  EASY_INTERVAL_DAYS,
  GRADUATING_INTERVAL_DAYS,
  LEARNING_STEPS_MINUTES,
  RELEARNING_STEPS_MINUTES,
  formatMinutesEstimate,
  scheduleReview,
  type SchedulingState,
} from '@/features/review/lib/learningSteps'

const freshCard: SchedulingState = {
  learningStep: 0,
  intervalDays: 0,
  easeFactor: 2.5,
  repetitions: 0,
  hasGraduated: false,
}

const matureCard: SchedulingState = {
  learningStep: null,
  intervalDays: 20,
  easeFactor: 2.5,
  repetitions: 6,
  hasGraduated: true,
}

describe('learning ladder', () => {
  it('brings a missed card back inside the session, not tomorrow', () => {
    const result = scheduleReview(REVIEW_GRADE.AGAIN, freshCard)
    expect(result.intervalMinutes).toBe(LEARNING_STEPS_MINUTES[0])
    expect(result.intervalMinutes).toBeLessThan(60)
    expect(result.graduated).toBe(false)
  })

  it('walks GOOD up the ladder and graduates off the end', () => {
    const first = scheduleReview(REVIEW_GRADE.GOOD, freshCard)
    expect(first.learningStep).toBe(1)
    expect(first.intervalMinutes).toBe(LEARNING_STEPS_MINUTES[1])
    expect(first.graduated).toBe(false)

    const second = scheduleReview(REVIEW_GRADE.GOOD, { ...freshCard, learningStep: 1 })
    expect(second.graduated).toBe(true)
    expect(second.learningStep).toBeNull()
    expect(second.intervalDays).toBeGreaterThanOrEqual(1)
  })

  it('repeats the current step on HARD instead of advancing', () => {
    const result = scheduleReview(REVIEW_GRADE.HARD, { ...freshCard, learningStep: 1 })
    expect(result.learningStep).toBe(1)
    expect(result.graduated).toBe(false)
  })

  it('lets EASY graduate straight out of the ladder', () => {
    const result = scheduleReview(REVIEW_GRADE.EASY, freshCard)
    expect(result.graduated).toBe(true)
    expect(result.intervalDays).toBeGreaterThanOrEqual(1)
  })

  it('gives ALL FOUR grades distinct, increasing outcomes on a fresh card', () => {
    // The whole point of item 4. Before learning steps every grade returned "1 dia"; before
    // graduating intervals and the HARD rule, AGAIN/HARD and GOOD/EASY still collided.
    const minutes = [
      REVIEW_GRADE.AGAIN,
      REVIEW_GRADE.HARD,
      REVIEW_GRADE.GOOD,
      REVIEW_GRADE.EASY,
    ].map((grade) => scheduleReview(grade, freshCard).intervalMinutes)

    expect(new Set(minutes).size).toBe(4)
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b))
  })

  it('separates HARD from AGAIN on the first step', () => {
    const again = scheduleReview(REVIEW_GRADE.AGAIN, freshCard).intervalMinutes
    const hard = scheduleReview(REVIEW_GRADE.HARD, freshCard).intervalMinutes
    expect(hard).toBeGreaterThan(again)
    // average of the [1, 10] ladder
    expect(hard).toBe(6)
  })

  it('graduates GOOD to a day and EASY to four days', () => {
    const good = scheduleReview(REVIEW_GRADE.GOOD, { ...freshCard, learningStep: 1 })
    expect(good.intervalDays).toBe(GRADUATING_INTERVAL_DAYS)

    const easy = scheduleReview(REVIEW_GRADE.EASY, freshCard)
    expect(easy.intervalDays).toBe(EASY_INTERVAL_DAYS)
    expect(easy.intervalDays).toBeGreaterThan(good.intervalDays)
  })

  it('still carries the SM-2 ease bonus through an EASY graduation', () => {
    expect(scheduleReview(REVIEW_GRADE.EASY, freshCard).easeFactor).toBeGreaterThan(freshCard.easeFactor)
  })
})

describe('lapses on a graduated card', () => {
  it('drops into relearning rather than resetting to a full day', () => {
    const result = scheduleReview(REVIEW_GRADE.AGAIN, matureCard)
    expect(result.learningStep).toBe(0)
    expect(result.intervalMinutes).toBe(RELEARNING_STEPS_MINUTES[0])
    expect(result.graduated).toBe(false)
    expect(result.easeFactor).toBeLessThan(matureCard.easeFactor)
  })

  it('keeps passing grades on the day schedule', () => {
    for (const grade of [REVIEW_GRADE.HARD, REVIEW_GRADE.GOOD, REVIEW_GRADE.EASY]) {
      const result = scheduleReview(grade, matureCard)
      expect(result.graduated).toBe(true)
      expect(result.intervalDays).toBeGreaterThan(1)
    }
  })

  it('never lets a worse grade return later than a better one', () => {
    const [again, hard, good, easy] = [
      REVIEW_GRADE.AGAIN,
      REVIEW_GRADE.HARD,
      REVIEW_GRADE.GOOD,
      REVIEW_GRADE.EASY,
    ].map((grade) => scheduleReview(grade, matureCard).intervalMinutes)

    expect(again).toBeLessThan(hard)
    expect(hard).toBeLessThanOrEqual(good)
    expect(good).toBeLessThanOrEqual(easy)
  })
})

describe('formatMinutesEstimate', () => {
  it('can finally express sub-day returns', () => {
    expect(formatMinutesEstimate(1)).toBe('1 min')
    expect(formatMinutesEstimate(10)).toBe('10 min')
    expect(formatMinutesEstimate(120)).toBe('2 horas')
    expect(formatMinutesEstimate(1440)).toBe('1 dia')
    expect(formatMinutesEstimate(1440 * 25)).toBe('25 dias')
  })
})
