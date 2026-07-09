import { describe, expect, it } from 'vitest'
import {
  buildCircuitWaypoints,
  estimateRouteDuration,
  waypointsToKeyframes,
  type CircuitTarget,
} from './landingCircuitRoutes'

const targets: CircuitTarget[] = [
  { id: 'hero', rect: { left: 16, top: 120, right: 360, bottom: 420 } },
  { id: 'demo', rect: { left: 16, top: 1800, right: 360, bottom: 2200 } },
  { id: 'footer', rect: { left: 0, top: 4800, right: 390, bottom: 5100 } },
]

describe('buildCircuitWaypoints', () => {
  it('starts at the navbar origin instead of the page top', () => {
    const startY = 64
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'left',
      startY,
      endY: 5112,
    })

    expect(waypoints[0].y).toBe(startY)
    expect(waypoints[0].y).toBeGreaterThan(20)
    expect(waypoints.every((p) => p.y >= startY - 0.1)).toBe(true)
  })

  it('traces each card perimeter on the left rail', () => {
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'left',
      startY: 7,
    })

    expect(waypoints.length).toBeGreaterThan(12)
    expect(waypoints[0].x).toBe(7)

    const heroTopLeft = waypoints.find((p) => p.x === 9 && p.y === 113)
    const heroTopRight = waypoints.find((p) => p.x === 353 && p.y === 113)
    const heroBottomLeft = waypoints.find((p) => p.x === 9 && p.y === 413)

    expect(heroTopLeft).toBeDefined()
    expect(heroTopRight).toBeDefined()
    expect(heroBottomLeft).toBeDefined()
  })

  it('returns to the rail after each card on the right side', () => {
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'right',
      startY: 48,
    })

    const railX = 390 - 28 - 7
    const railPoints = waypoints.filter((p) => p.x === railX)
    expect(railPoints.length).toBeGreaterThan(4)
    expect(waypoints[0].y).toBe(48)
  })

  it('loops back to startY at the end of the route', () => {
    const startY = 72
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'left',
      startY,
      endY: 5100,
    })

    expect(waypoints[waypoints.length - 1].y).toBe(startY)
  })
})

describe('waypointsToKeyframes', () => {
  it('generates a closed animation with proportional stops and opacity soft-loop', () => {
    const waypoints = buildCircuitWaypoints({
      containerWidth: 390,
      containerHeight: 5200,
      targets,
      side: 'left',
      startY: 56,
    })
    const css = waypointsToKeyframes('landing-circuit-test', waypoints)

    expect(css).toContain('@keyframes landing-circuit-test')
    expect(css).toContain('0% { transform:')
    expect(css).toContain('100% { transform:')
    expect(css).toContain('opacity:')
  })
})

describe('estimateRouteDuration', () => {
  it('scales duration with path length', () => {
    const short = [{ x: 0, y: 0 }, { x: 0, y: 100 }]
    const long = [{ x: 0, y: 0 }, { x: 0, y: 5000 }]

    expect(estimateRouteDuration(long)).toBeGreaterThan(estimateRouteDuration(short))
  })
})
