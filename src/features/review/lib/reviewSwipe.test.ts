import { describe, expect, it } from 'vitest'
import { REVIEW_GRADE } from './reviewGrades'
import { getReviewSwipeVisual, resolveReviewSwipeQuality } from './reviewSwipe'

describe('resolveReviewSwipeQuality', () => {
  it('maps left swipes to errei', () => {
    expect(resolveReviewSwipeQuality(-90)).toBe(REVIEW_GRADE.AGAIN)
  })

  it('maps right swipes to fácil', () => {
    expect(resolveReviewSwipeQuality(90)).toBe(REVIEW_GRADE.EASY)
  })

  it('maps centered swipes to bom, the ease-neutral grade', () => {
    expect(resolveReviewSwipeQuality(40)).toBe(REVIEW_GRADE.GOOD)
    expect(resolveReviewSwipeQuality(-40)).toBe(REVIEW_GRADE.GOOD)
  })

  it('never writes a grade the buttons cannot also produce', () => {
    const grades = [90, 40, -40, -90].map(resolveReviewSwipeQuality)
    expect(grades.every((grade) => Object.values(REVIEW_GRADE).includes(grade!))).toBe(true)
  })

  it('ignores short movements', () => {
    expect(resolveReviewSwipeQuality(12)).toBeNull()
    expect(resolveReviewSwipeQuality(-18)).toBeNull()
  })
})

describe('getReviewSwipeVisual', () => {
  it('reflects swipe zones for feedback', () => {
    expect(getReviewSwipeVisual(-80)).toBe('hard')
    expect(getReviewSwipeVisual(80)).toBe('easy')
    expect(getReviewSwipeVisual(40)).toBe('good')
    expect(getReviewSwipeVisual(-40)).toBe('good')
    expect(getReviewSwipeVisual(4)).toBe('neutral')
  })
})