export const CIRCUIT_TRAVELER_SIZE = 14
export const CIRCUIT_HALF = 7
export const MOBILE_RAIL_INSET = 14
export const MOBILE_CIRCUIT_MAX_WIDTH = 639

export type CircuitTargetId = 'hero' | 'demo' | 'footer'

export type Point = { x: number; y: number }

export type RelativeRect = {
  left: number
  top: number
  right: number
  bottom: number
}

export type CircuitTarget = {
  id: CircuitTargetId
  rect: RelativeRect
}

export type CircuitRouteInput = {
  containerWidth: number
  containerHeight: number
  targets: CircuitTarget[]
  side: 'left' | 'right'
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function pushUnique(points: Point[], point: Point) {
  const last = points[points.length - 1]
  if (!last || last.x !== point.x || last.y !== point.y) {
    points.push(point)
  }
}

function railX(containerWidth: number, side: 'left' | 'right'): number {
  return side === 'left'
    ? MOBILE_RAIL_INSET - CIRCUIT_HALF
    : containerWidth - MOBILE_RAIL_INSET * 2 - CIRCUIT_HALF
}

function perimeterCorners(rect: RelativeRect, side: 'left' | 'right'): Point[] {
  const h = CIRCUIT_HALF
  const tl = { x: rect.left - h, y: rect.top - h }
  const tr = { x: rect.right - h, y: rect.top - h }
  const br = { x: rect.right - h, y: rect.bottom - h }
  const bl = { x: rect.left - h, y: rect.bottom - h }

  return side === 'left' ? [tl, tr, br, bl] : [tr, br, bl, tl]
}

export function buildCircuitWaypoints(input: CircuitRouteInput): Point[] {
  const { containerWidth, containerHeight, targets, side } = input
  const xRail = railX(containerWidth, side)
  const sorted = [...targets].sort((a, b) => a.rect.top - b.rect.top)

  const points: Point[] = []
  let cursorY = CIRCUIT_HALF

  pushUnique(points, { x: xRail, y: cursorY })

  for (const { rect } of sorted) {
    const entryY = Math.max(cursorY, rect.top - CIRCUIT_HALF)
    pushUnique(points, { x: xRail, y: entryY })

    const corners = perimeterCorners(rect, side)
    const entryCorner = corners[0]
    const exitCorner = side === 'left' ? corners[3] : corners[1]

    pushUnique(points, entryCorner)
    corners.slice(1).forEach((corner) => pushUnique(points, corner))
    pushUnique(points, { x: xRail, y: exitCorner.y })
    cursorY = exitCorner.y
  }

  pushUnique(points, { x: xRail, y: containerHeight - CIRCUIT_HALF })
  pushUnique(points, { x: xRail, y: CIRCUIT_HALF })

  return points
}

export function estimateRouteDuration(waypoints: Point[], pixelsPerSecond = 42): number {
  if (waypoints.length < 2) return 80

  let length = 0
  for (let i = 1; i < waypoints.length; i++) {
    length += distance(waypoints[i - 1], waypoints[i])
  }

  return Math.max(72, Math.round(length / pixelsPerSecond))
}

export function waypointsToKeyframes(animationName: string, waypoints: Point[]): string {
  if (waypoints.length < 2) return ''

  const cumulative: number[] = [0]
  let total = 0

  for (let i = 1; i < waypoints.length; i++) {
    total += distance(waypoints[i - 1], waypoints[i])
    cumulative.push(total)
  }

  if (total === 0) return ''

  const frames = waypoints
    .map((point, index) => {
      const percent = (cumulative[index] / total) * 100
      const rounded = Math.round(percent * 1000) / 1000
      return `${rounded}% { transform: translate3d(${Math.round(point.x * 10) / 10}px, ${Math.round(point.y * 10) / 10}px, 0); }`
    })
    .join('\n  ')

  return `@keyframes ${animationName} {\n  ${frames}\n}`
}

export function rectRelativeToContainer(elementRect: DOMRect, containerRect: DOMRect): RelativeRect {
  return {
    left: elementRect.left - containerRect.left,
    top: elementRect.top - containerRect.top,
    right: elementRect.right - containerRect.left,
    bottom: elementRect.bottom - containerRect.top,
  }
}