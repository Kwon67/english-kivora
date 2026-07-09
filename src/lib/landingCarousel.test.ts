import { describe, expect, it } from 'vitest'
import { clampLandingSlide, getLandingSlideAfterDrag } from './landingCarousel'

describe('landing testimonial deck', () => {
  it('keeps slide selection inside finite bounds', () => {
    expect(clampLandingSlide(-1, 3)).toBe(0)
    expect(clampLandingSlide(2, 3)).toBe(2)
    expect(clampLandingSlide(4, 3)).toBe(2)
  })

  it('moves using distance in either direction', () => {
    expect(getLandingSlideAfterDrag({ current: 1, count: 3, offsetX: -80, velocityX: 0 })).toBe(2)
    expect(getLandingSlideAfterDrag({ current: 1, count: 3, offsetX: 80, velocityX: 0 })).toBe(0)
  })

  it('moves on a fast flick and snaps back below thresholds', () => {
    expect(getLandingSlideAfterDrag({ current: 1, count: 3, offsetX: -10, velocityX: -520 })).toBe(2)
    expect(getLandingSlideAfterDrag({ current: 1, count: 3, offsetX: 20, velocityX: 120 })).toBe(1)
  })
})
