import { describe, expect, it } from 'vitest'
import {
  buildCircuitWaypoints,
  estimateRouteDuration,
  mergeOverlappingTargets,
  railX,
  waypointsToKeyframes,
  type CircuitTarget,
} from './landingCircuitRoutes'

const targets: CircuitTarget[] = [
  { id: 'hero', rect: { left: 16, top: 140, right: 360, bottom: 420 } },
  { id: 'demo', rect: { left: 16, top: 1800, right: 360, bottom: 2200 } },
  { id: 'audience', rect: { left: 16, top: 900, right: 360, bottom: 1400 } },
  { id: 'footer', rect: { left: 0, top: 4800, right: 390, bottom: 5100 } },
]

describe('railX', () => {
  it('keeps the mobile right rail clear of the hamburger zone', () => {
    const width = 390
    const right = railX(width, 'right')
    expect(right).toBeLessThanOrEqual(width - 52)
  })
})

describe('mergeOverlappingTargets', () => {
  it('merges nested/overlapping cards into one shell', () => {
    const nested: CircuitTarget[] = [
      { id: 'outer', rect: { left: 10, top: 100, right: 300, bottom: 500 } },
      { id: 'inner', rect: { left: 40, top: 160, right: 260, bottom: 400 } },
    ]
    const merged = mergeOverlappingTargets(nested)
    expect(merged).toHaveLength(1)
    expect(merged[0].rect.top).toBe(100)
    expect(merged[0].rect.bottom).toBe(500)
  })
})

describe('buildCircuitWaypoints', () => {
  it('starts below the header origin and never goes above it', () => {
    const startY = 120
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'left',
      startY,
      endY: 5112,
    })

    expect(waypoints[0].y).toBe(startY)
    expect(waypoints.every((p) => p.y >= startY - 0.1)).toBe(true)
  })

  it('wraps each main card with a full perimeter (not just a vertical pass)', () => {
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'left',
      startY: 120,
      endY: 5100,
    })

    // Hero outline should include both left and right edges of the card band
    const heroBand = waypoints.filter((p) => p.y >= 120 && p.y <= 450)
    const xs = heroBand.map((p) => p.x)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(100)
  })

  it('builds a closed loop', () => {
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'left',
      startY: 120,
      endY: 5100,
    })

    expect(waypoints.length).toBeGreaterThan(16)
    expect(waypoints[0]).toEqual(waypoints[waypoints.length - 1])
  })
})

describe('waypointsToKeyframes', () => {
  it('keeps tiles fully visible', () => {
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'left',
      startY: 120,
    })
    const css = waypointsToKeyframes('landing-tile-test', waypoints)

    expect(css).toContain('@keyframes landing-tile-test')
    expect(css).toContain('opacity: 1')
    expect(css).not.toContain('opacity: 0')
  })
})

describe('estimateRouteDuration', () => {
  it('stays in a visible motion range', () => {
    const long = [
      { x: 0, y: 0 },
      { x: 0, y: 8000 },
    ]
    const duration = estimateRouteDuration(long, 42)
    expect(duration).toBeGreaterThanOrEqual(55)
    expect(duration).toBeLessThanOrEqual(110)
  })
})
