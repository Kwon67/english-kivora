export const CIRCUIT_TRAVELER_SIZE = 14
export const CIRCUIT_HALF = 7
export const MOBILE_RAIL_INSET = 14
export const MOBILE_CIRCUIT_MAX_WIDTH = 639
/** Fallback when navbar origin cannot be measured (approx banner + half nav). */
export const DEFAULT_CIRCUIT_START_Y = 52

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
  /** Document Y where the path begins (navbar band). */
  startY?: number
  /** Document Y where the path bottoms out before looping. */
  endY?: number
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

/**
 * Desktop rail inset mirrors CSS clamp(14px, card-side - 16px, 150px) approximately
 * for measured paths (dynamic mode on all viewports).
 */
export function desktopRailX(containerWidth: number, side: 'left' | 'right'): number {
  const contentPad = 36
  const cardMax = 1152
  const cardSide = Math.max(0, (containerWidth - Math.min(cardMax, containerWidth - contentPad)) / 2)
  const railInset = Math.min(150, Math.max(14, cardSide - 16))
  return side === 'left' ? railInset - CIRCUIT_HALF : containerWidth - railInset - CIRCUIT_HALF
}

function perimeterCorners(rect: RelativeRect, side: 'left' | 'right'): Point[] {
  const h = CIRCUIT_HALF
  const tl = { x: rect.left - h, y: rect.top - h }
  const tr = { x: rect.right - h, y: rect.top - h }
  const br = { x: rect.right - h, y: rect.bottom - h }
  const bl = { x: rect.left - h, y: rect.bottom - h }

  return side === 'left' ? [tl, tr, br, bl] : [tr, br, bl, tl]
}

function isCornerTurn(prev: Point, cur: Point, next: Point): boolean {
  const horizontalIn = Math.abs(cur.x - prev.x) >= Math.abs(cur.y - prev.y)
  const horizontalOut = Math.abs(next.x - cur.x) >= Math.abs(next.y - cur.y)
  return horizontalIn !== horizontalOut
}

export function buildCircuitWaypoints(input: CircuitRouteInput): Point[] {
  const { containerWidth, containerHeight, targets, side } = input
  const startY = Math.max(CIRCUIT_HALF, input.startY ?? CIRCUIT_HALF)
  const endY = Math.max(
    startY + CIRCUIT_TRAVELER_SIZE,
    Math.min(containerHeight - CIRCUIT_HALF, input.endY ?? containerHeight - CIRCUIT_HALF)
  )

  const isMobileWidth = containerWidth <= MOBILE_CIRCUIT_MAX_WIDTH
  const xRail = isMobileWidth ? railX(containerWidth, side) : desktopRailX(containerWidth, side)
  const sorted = [...targets].sort((a, b) => a.rect.top - b.rect.top)

  const points: Point[] = []
  let cursorY = startY

  pushUnique(points, { x: xRail, y: cursorY })

  for (const { rect } of sorted) {
    // Skip targets entirely above the circuit origin (e.g. mis-measured).
    if (rect.bottom < startY) continue

    const entryY = Math.max(cursorY, Math.max(startY, rect.top - CIRCUIT_HALF))
    pushUnique(points, { x: xRail, y: entryY })

    const corners = perimeterCorners(
      {
        ...rect,
        top: Math.max(rect.top, startY),
      },
      side
    )
    const entryCorner = corners[0]
    const exitCorner = side === 'left' ? corners[3] : corners[1]

    pushUnique(points, entryCorner)
    corners.slice(1).forEach((corner) => pushUnique(points, corner))
    pushUnique(points, { x: xRail, y: Math.max(startY, exitCorner.y) })
    cursorY = Math.max(startY, exitCorner.y)
  }

  pushUnique(points, { x: xRail, y: endY })
  pushUnique(points, { x: xRail, y: startY })

  return points
}

export function estimateRouteDuration(waypoints: Point[], pixelsPerSecond = 52): number {
  if (waypoints.length < 2) return 64

  let length = 0
  for (let i = 1; i < waypoints.length; i++) {
    length += distance(waypoints[i - 1], waypoints[i])
  }

  return Math.max(56, Math.min(90, Math.round(length / pixelsPerSecond)))
}

export type KeyframeOptions = {
  /** Extra virtual distance at 90° corners for a subtle dwell. */
  cornerDwellPx?: number
  /** Fade near loop seam for a softer premium feel. */
  softLoopOpacity?: boolean
}

/**
 * Weighted keyframes: corner turns get a micro dwell so motion feels less robotic.
 */
export function waypointsToKeyframes(
  animationName: string,
  waypoints: Point[],
  options: KeyframeOptions = {}
): string {
  if (waypoints.length < 2) return ''

  const cornerDwellPx = options.cornerDwellPx ?? 18
  const softLoopOpacity = options.softLoopOpacity ?? true

  const cumulative: number[] = [0]
  let total = 0

  for (let i = 1; i < waypoints.length; i++) {
    total += distance(waypoints[i - 1], waypoints[i])
    if (
      i < waypoints.length - 1 &&
      isCornerTurn(waypoints[i - 1], waypoints[i], waypoints[i + 1])
    ) {
      total += cornerDwellPx
    }
    cumulative.push(total)
  }

  if (total === 0) return ''

  const frames = waypoints
    .map((point, index) => {
      const percent = (cumulative[index] / total) * 100
      const rounded = Math.round(percent * 1000) / 1000
      const x = Math.round(point.x * 10) / 10
      const y = Math.round(point.y * 10) / 10

      let opacityRule = ''
      if (softLoopOpacity) {
        if (rounded <= 0.01 || rounded >= 99.5) {
          opacityRule = ' opacity: 0.45;'
        } else if (rounded < 2 || rounded > 98) {
          opacityRule = ' opacity: 0.85;'
        } else {
          opacityRule = ' opacity: 1;'
        }
      }

      return `${rounded}% { transform: translate3d(${x}px, ${y}px, 0);${opacityRule} }`
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

/**
 * Stable origin Y relative to the landing root, ignoring sticky/scrolled getBoundingClientRect.
 * Sums offsetHeight of flow siblings above the navbar marker.
 */
export function measureCircuitStartY(landingRoot: HTMLElement): number {
  const nav = landingRoot.querySelector<HTMLElement>('[data-landing-circuit-origin="nav"]')
  if (!nav) return DEFAULT_CIRCUIT_START_Y

  let y = 0
  let prev = nav.previousElementSibling as HTMLElement | null

  while (prev) {
    const isCircuit =
      prev.hasAttribute('data-landing-circuit') ||
      prev.classList.contains('landing-grid-circuit')

    if (!isCircuit) {
      y += prev.offsetHeight
    }
    prev = prev.previousElementSibling as HTMLElement | null
  }

  // Sit slightly into the navbar band (not at the banner line).
  const navInset = Math.min(28, Math.max(10, Math.round(nav.offsetHeight * 0.35)))
  return Math.max(CIRCUIT_HALF, y + navInset)
}
