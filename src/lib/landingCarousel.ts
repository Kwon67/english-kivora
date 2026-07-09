export function clampLandingSlide(index: number, count: number): number {
  if (count <= 0) return 0
  return Math.max(0, Math.min(count - 1, index))
}

export function getLandingSlideAfterDrag({
  current,
  count,
  offsetX,
  velocityX,
  distanceThreshold = 70,
  velocityThreshold = 500,
}: {
  current: number
  count: number
  offsetX: number
  velocityX: number
  distanceThreshold?: number
  velocityThreshold?: number
}): number {
  if (offsetX <= -distanceThreshold || velocityX <= -velocityThreshold) {
    return clampLandingSlide(current + 1, count)
  }

  if (offsetX >= distanceThreshold || velocityX >= velocityThreshold) {
    return clampLandingSlide(current - 1, count)
  }

  return clampLandingSlide(current, count)
}
