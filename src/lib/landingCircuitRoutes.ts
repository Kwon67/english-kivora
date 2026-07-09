export const CIRCUIT_TRAVELER_SIZE = 14
export const CIRCUIT_HALF = 7
export const MOBILE_RAIL_INSET = 16
export const MOBILE_CIRCUIT_MAX_WIDTH = 639
/** Fallback when header cannot be measured. */
export const DEFAULT_CIRCUIT_START_Y = 100
/** Keep clear of the mobile hamburger cluster. */
export const MOBILE_SAFE_RIGHT_INSET = 52

export type Point = { x: number; y: number }

export type RelativeRect = {
  left: number
  top: number
  right: number
  bottom: number
}

export type CircuitTarget = {
  id: string
  rect: RelativeRect
}

export type CircuitRouteInput = {
  containerWidth: number
  containerHeight: number
  targets: CircuitTarget[]
  side: 'left' | 'right'
  /** Document Y where the path begins — below the full header. */
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function railX(containerWidth: number, side: 'left' | 'right'): number {
  const isMobile = containerWidth <= MOBILE_CIRCUIT_MAX_WIDTH

  if (isMobile) {
    if (side === 'left') {
      return MOBILE_RAIL_INSET - CIRCUIT_HALF
    }
    return containerWidth - MOBILE_SAFE_RIGHT_INSET - CIRCUIT_HALF
  }

  const contentPad = 36
  const cardMax = 1152
  const cardSide = Math.max(0, (containerWidth - Math.min(cardMax, containerWidth - contentPad)) / 2)
  const railInset = Math.min(140, Math.max(22, cardSide - 14))
  return side === 'left' ? railInset - CIRCUIT_HALF : containerWidth - railInset - CIRCUIT_HALF
}

/**
 * Corners placed so the 14×14 tile is centered on the card border line
 * (top-left of the tile sits at border - halfSize).
 */
function perimeterCorners(rect: RelativeRect, side: 'left' | 'right'): Point[] {
  const h = CIRCUIT_HALF
  const top = Math.max(rect.top, h)
  const bottom = Math.max(rect.bottom, top + CIRCUIT_TRAVELER_SIZE)
  const left = rect.left
  const right = Math.max(rect.right, left + CIRCUIT_TRAVELER_SIZE)

  // Center of tile rides exactly on each edge of the card border box.
  const tl = { x: left - h, y: top - h }
  const tr = { x: right - h, y: top - h }
  const br = { x: right - h, y: bottom - h }
  const bl = { x: left - h, y: bottom - h }

  return side === 'left' ? [tl, tr, br, bl] : [tr, br, bl, tl]
}

/**
 * Merge targets that heavily overlap (nested / stacked) so the path wraps the outer shell once.
 */
export function mergeOverlappingTargets(targets: CircuitTarget[]): CircuitTarget[] {
  const sorted = [...targets].sort((a, b) => a.rect.top - b.rect.top)
  const merged: CircuitTarget[] = []

  for (const target of sorted) {
    const last = merged[merged.length - 1]
    if (!last) {
      merged.push({ ...target, rect: { ...target.rect } })
      continue
    }

    const verticalOverlap =
      target.rect.top < last.rect.bottom - 24 && target.rect.bottom > last.rect.top + 24
    const horizontalOverlap =
      target.rect.left < last.rect.right - 24 && target.rect.right > last.rect.left + 24

    if (verticalOverlap && horizontalOverlap) {
      last.rect = {
        left: Math.min(last.rect.left, target.rect.left),
        top: Math.min(last.rect.top, target.rect.top),
        right: Math.max(last.rect.right, target.rect.right),
        bottom: Math.max(last.rect.bottom, target.rect.bottom),
      }
      last.id = `${last.id}+${target.id}`
      continue
    }

    merged.push({ ...target, rect: { ...target.rect } })
  }

  return merged
}

/**
 * Intelligent circuit path for green tiles:
 * - start below header
 * - ride outer rail
 * - fully wrap each main card (perimeter)
 * - return on the opposite rail
 */
export function buildCircuitWaypoints(input: CircuitRouteInput): Point[] {
  const { containerWidth, containerHeight, targets, side } = input
  const startY = Math.max(CIRCUIT_HALF + 4, input.startY ?? DEFAULT_CIRCUIT_START_Y)
  const endY = Math.max(
    startY + 120,
    Math.min(containerHeight - CIRCUIT_HALF - 4, input.endY ?? containerHeight - CIRCUIT_HALF - 4)
  )

  const xLeft = railX(containerWidth, 'left')
  const xRight = railX(containerWidth, 'right')
  const xOut = side === 'left' ? xLeft : xRight
  const xReturn = side === 'left' ? xRight : xLeft

  const sorted = mergeOverlappingTargets(
    targets.filter((t) => t.rect.bottom > startY + 16)
  ).sort((a, b) => a.rect.top - b.rect.top)

  const points: Point[] = []
  let cursorY = startY

  pushUnique(points, { x: xOut, y: startY })

  for (const { rect } of sorted) {
    // Use the measured card box (no outward pad) so tiles ride ON the border line.
    const safeRect: RelativeRect = {
      left: clamp(rect.left, 0, containerWidth - 8),
      right: clamp(rect.right, 8, containerWidth),
      top: Math.max(rect.top, startY + 2),
      bottom: Math.min(rect.bottom, endY - 2),
    }

    if (safeRect.bottom - safeRect.top < 40) continue
    if (safeRect.right - safeRect.left < 40) continue

    const corners = perimeterCorners(safeRect, side)
    const entryCorner = corners[0]
    const exitCorner = corners[corners.length - 1]

    // Descend on the rail until aligned with the card top, then step onto the border.
    const approachY = Math.max(cursorY, entryCorner.y)
    pushUnique(points, { x: xOut, y: approachY })
    // Horizontal approach along the top edge height if rail is outside the card
    if (Math.abs(xOut - entryCorner.x) > 1) {
      pushUnique(points, { x: entryCorner.x, y: approachY })
    }

    // Full perimeter on the card border line
    for (const corner of corners) {
      pushUnique(points, {
        x: clamp(corner.x, -CIRCUIT_HALF, containerWidth - CIRCUIT_HALF),
        y: Math.max(startY, corner.y),
      })
    }

    // Step back to the rail at the exit height, then continue down
    const exitY = Math.max(startY, exitCorner?.y ?? safeRect.bottom - CIRCUIT_HALF)
    if (Math.abs(xOut - (exitCorner?.x ?? xOut)) > 1) {
      pushUnique(points, { x: xOut, y: exitY })
    } else {
      pushUnique(points, { x: xOut, y: exitY })
    }
    cursorY = exitY
  }

  pushUnique(points, { x: xOut, y: endY })
  pushUnique(points, { x: xReturn, y: endY })
  pushUnique(points, { x: xReturn, y: startY })
  pushUnique(points, { x: xOut, y: startY })

  return points
}

/** Visible, steady pace — not frantic, not “frozen”. */
export function estimateRouteDuration(waypoints: Point[], pixelsPerSecond = 42): number {
  if (waypoints.length < 2) return 72

  let length = 0
  for (let i = 1; i < waypoints.length; i++) {
    length += distance(waypoints[i - 1], waypoints[i])
  }

  return Math.max(55, Math.min(110, Math.round(length / pixelsPerSecond)))
}

export type KeyframeOptions = {
  cornerDwellPx?: number
  /** Keep tiles fully visible (recommended). */
  keepVisible?: boolean
  peakOpacity?: number
}

function isCornerTurn(prev: Point, cur: Point, next: Point): boolean {
  const horizontalIn = Math.abs(cur.x - prev.x) >= Math.abs(cur.y - prev.y)
  const horizontalOut = Math.abs(next.x - cur.x) >= Math.abs(next.y - cur.y)
  return horizontalIn !== horizontalOut
}

export function waypointsToKeyframes(
  animationName: string,
  waypoints: Point[],
  options: KeyframeOptions = {}
): string {
  if (waypoints.length < 2) return ''

  const cornerDwellPx = options.cornerDwellPx ?? 14
  const keepVisible = options.keepVisible ?? true
  const peakOpacity = options.peakOpacity ?? 1

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
      const opacity = keepVisible ? peakOpacity : peakOpacity

      return `${rounded}% { transform: translate3d(${x}px, ${y}px, 0); opacity: ${opacity}; }`
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
 * Start fully below banner + navbar so tiles never sit on chrome / hamburger.
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

  return Math.max(CIRCUIT_HALF + 4, y + nav.offsetHeight + 12)
}
