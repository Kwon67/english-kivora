import { describe, expect, it } from 'vitest'
import { getReviewSwipeVisual, resolveReviewSwipeQuality } from './reviewSwipe'

describe('resolveReviewSwipeQuality', () => {
  it('maps left swipes to difícil', () => {
    expect(resolveReviewSwipeQuality(-90)).toBe(0)
  })

  it('maps right swipes to fácil', () => {
    expect(resolveReviewSwipeQuality(90)).toBe(5)
  })

  it('maps centered swipes to bom', () => {
    expect(resolveReviewSwipeQuality(40)).toBe(3)
    expect(resolveReviewSwipeQuality(-40)).toBe(3)
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