'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import {
  buildCircuitWaypoints,
  estimateRouteDuration,
  measureCircuitStartY,
  MOBILE_CIRCUIT_MAX_WIDTH,
  MOBILE_SAFE_RIGHT_INSET,
  waypointsToKeyframes,
  type CircuitTarget,
} from '@/lib/landingCircuitRoutes'

const TRAVELERS = [
  { id: 't1', side: 'left' as const, delay: 0, pixelsPerSecond: 24 },
  { id: 't2', side: 'right' as const, delay: 18, pixelsPerSecond: 22 },
] as const

const RETURN_MS = 5000
const EXPLODE_MS = 480
const PARTICLE_COUNT = 8

type DynamicRoute = {
  animationName: string
  duration: number
}

type TravelerPhase = 'cruising' | 'exploding' | 'returning'

type BurstParticle = {
  id: string
  dx: number
  dy: number
  rotate: number
}

function collectCircuitTargets(landingRoot: HTMLElement): CircuitTarget[] {
  const landingBox = landingRoot.getBoundingClientRect()
  const nodes = landingRoot.querySelectorAll<HTMLElement>('[data-landing-circuit-target]')

  return Array.from(nodes).flatMap((element, index) => {
    const box = element.getBoundingClientRect()
    if (box.width < 40 || box.height < 40) return []

    const id = element.getAttribute('data-landing-circuit-target') || `card-${index}`
    const top = box.top - landingBox.top
    const left = box.left - landingBox.left

    return [
      {
        id,
        rect: {
          left,
          right: left + box.width,
          top,
          bottom: top + box.height,
        },
      },
    ]
  })
}

function readElementTranslate(element: HTMLElement): { x: number; y: number } {
  const style = window.getComputedStyle(element)
  const transform = style.transform
  if (!transform || transform === 'none') {
    return { x: 0, y: 0 }
  }

  // matrix(a, b, c, d, tx, ty) or matrix3d(...)
  const matrix3d = transform.match(/^matrix3d\((.+)\)$/)
  if (matrix3d) {
    const parts = matrix3d[1].split(',').map((v) => Number(v.trim()))
    return { x: parts[12] || 0, y: parts[13] || 0 }
  }

  const matrix = transform.match(/^matrix\((.+)\)$/)
  if (matrix) {
    const parts = matrix[1].split(',').map((v) => Number(v.trim()))
    return { x: parts[4] || 0, y: parts[5] || 0 }
  }

  return { x: 0, y: 0 }
}

function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      // short burst pattern feels like a pop
      navigator.vibrate([18, 30, 18])
    }
  } catch {
    // ignore unsupported devices
  }
}

function createBurstParticles(): BurstParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const angle = (Math.PI * 2 * index) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.35
    const distance = 18 + Math.random() * 28
    return {
      id: `p-${index}-${Math.random().toString(36).slice(2, 7)}`,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      rotate: (Math.random() - 0.5) * 180,
    }
  })
}

type CircuitTileProps = {
  travelerId: string
  side: 'left' | 'right'
  delay: number
  route: DynamicRoute | null
  useDynamic: boolean
  isPagePaused: boolean
  homeX: string
  homeY: string
}

function CircuitTile({
  travelerId,
  side,
  delay,
  route,
  useDynamic,
  isPagePaused,
  homeX,
  homeY,
}: CircuitTileProps) {
  const tileRef = useRef<HTMLButtonElement>(null)
  const timersRef = useRef<number[]>([])
  const [phase, setPhase] = useState<TravelerPhase>('cruising')
  const [burst, setBurst] = useState<{
    x: number
    y: number
    particles: BurstParticle[]
  } | null>(null)
  const [returnPose, setReturnPose] = useState<{
    fromX: number
    fromY: number
    toX: number
    toY: number
  } | null>(null)
  const [animationEpoch, setAnimationEpoch] = useState(0)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const handlePop = useCallback(() => {
    if (phase !== 'cruising') return
    const tile = tileRef.current
    if (!tile) return

    triggerHaptic()

    const current = readElementTranslate(tile)
    // Resolve home CSS vars to px via a temporary measure against the track
    const track = tile.parentElement
    let toX = current.x
    let toY = current.y

    if (track) {
      const probe = document.createElement('span')
      probe.style.cssText =
        'position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;transform:translate3d(var(--tile-home-x), var(--tile-home-y), 0);'
      probe.style.setProperty('--tile-home-x', homeX)
      probe.style.setProperty('--tile-home-y', homeY)
      track.appendChild(probe)
      const probePos = readElementTranslate(probe)
      track.removeChild(probe)
      toX = probePos.x
      toY = probePos.y
    } else {
      const root = tile.closest('.landing-grid-circuit') as HTMLElement | null
      if (root) {
        const styles = getComputedStyle(root)
        const startY = Number.parseFloat(styles.getPropertyValue('--circuit-start-y')) || 100
        const left = Number.parseFloat(styles.getPropertyValue('--circuit-rail-inset-left')) || 16
        const right = Number.parseFloat(styles.getPropertyValue('--circuit-rail-inset-right')) || 52
        toY = startY
        toX = side === 'left' ? left - 7 : root.clientWidth - right - 7
      }
    }

    setBurst({
      x: current.x,
      y: current.y,
      particles: createBurstParticles(),
    })
    setReturnPose({
      fromX: current.x,
      fromY: current.y,
      toX,
      toY,
    })
    setPhase('exploding')

    const explodeTimer = window.setTimeout(() => {
      setBurst(null)
      setPhase('returning')

      const returnTimer = window.setTimeout(() => {
        setReturnPose(null)
        setPhase('cruising')
        // Restart loop animation cleanly from the beginning
        setAnimationEpoch((value) => value + 1)
      }, RETURN_MS)

      timersRef.current.push(returnTimer)
    }, EXPLODE_MS)

    timersRef.current.push(explodeTimer)
  }, [homeX, homeY, phase, side])

  const tileStyle: CSSProperties =
    phase === 'cruising'
      ? {
          animationDuration: `${useDynamic && route ? route.duration : 120}s`,
          animationDelay: `${delay}s`,
          ...(useDynamic && route ? { animationName: route.animationName } : {}),
        }
      : phase === 'exploding'
        ? {
            animation: 'none',
            opacity: 0,
            transform: `translate3d(${returnPose?.fromX ?? 0}px, ${returnPose?.fromY ?? 0}px, 0) scale(0.2)`,
            pointerEvents: 'none',
          }
        : {
            animation: 'none',
            pointerEvents: 'none',
          }

  // Kick the return transition from the burst coordinates
  useEffect(() => {
    if (phase !== 'returning' || !returnPose || !tileRef.current) return

    const tile = tileRef.current
    tile.style.transition = 'none'
    tile.style.transform = `translate3d(${returnPose.fromX}px, ${returnPose.fromY}px, 0) scale(0.85)`
    tile.style.opacity = '0.35'

    const frame = window.requestAnimationFrame(() => {
      tile.style.transition = `transform ${RETURN_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${RETURN_MS}ms ease`
      tile.style.transform = `translate3d(${returnPose.toX}px, ${returnPose.toY}px, 0) scale(1)`
      tile.style.opacity = '1'
    })

    return () => window.cancelAnimationFrame(frame)
  }, [phase, returnPose])

  return (
    <>
      <button
        key={`${travelerId}-${animationEpoch}`}
        ref={tileRef}
        type="button"
        aria-label="Explodir quadrado da animação"
        className={[
          'landing-circuit-traveler',
          phase === 'cruising' && useDynamic ? 'landing-circuit-traveler--live' : '',
          phase === 'cruising' && !useDynamic ? `landing-circuit-route-${side}` : '',
          phase !== 'cruising' ? 'landing-circuit-traveler--interactive-busy' : '',
          isPagePaused && phase === 'cruising' ? 'landing-circuit-traveler--page-paused' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          {
            ...tileStyle,
            ['--tile-home-x' as string]: homeX,
            ['--tile-home-y' as string]: homeY,
          } as CSSProperties
        }
        onClick={handlePop}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handlePop()
          }
        }}
      />

      {burst ? (
        <span
          className="landing-circuit-burst"
          style={{
            transform: `translate3d(${burst.x}px, ${burst.y}px, 0)`,
          }}
          aria-hidden="true"
        >
          <span className="landing-circuit-burst-flash" />
          {burst.particles.map((particle) => (
            <span
              key={particle.id}
              className="landing-circuit-burst-particle"
              style={
                {
                  ['--burst-dx' as string]: `${particle.dx}px`,
                  ['--burst-dy' as string]: `${particle.dy}px`,
                  ['--burst-rot' as string]: `${particle.rotate}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      ) : null}
    </>
  )
}

export default function LandingGridCircuit() {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [dynamicRoutes, setDynamicRoutes] = useState<Record<string, DynamicRoute>>({})
  const [dynamicCss, setDynamicCss] = useState('')
  const [hasDynamic, setHasDynamic] = useState(false)

  useEffect(() => {
    const syncPaused = () => setIsPaused(document.visibilityState === 'hidden')
    syncPaused()
    document.addEventListener('visibilitychange', syncPaused)
    return () => document.removeEventListener('visibilitychange', syncPaused)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let frame = 0
    let disposed = false

    const measureAndBuild = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (disposed) return

        const landingRoot = root.parentElement
        if (!landingRoot) return

        const containerWidth = landingRoot.clientWidth || window.innerWidth
        const containerHeight = Math.max(
          landingRoot.scrollHeight,
          landingRoot.offsetHeight,
          document.documentElement.scrollHeight
        )

        const startY = measureCircuitStartY(landingRoot)
        const targets = collectCircuitTargets(landingRoot)

        const footerTarget = targets.find((t) => t.id === 'footer')
        const lastTargetBottom = targets.reduce((max, t) => Math.max(max, t.rect.bottom), startY)
        const endY = footerTarget
          ? Math.min(containerHeight - 12, Math.max(startY + 200, footerTarget.rect.bottom + 10))
          : Math.min(containerHeight - 12, Math.max(startY + 400, lastTargetBottom + 40))

        const isMobile = containerWidth <= MOBILE_CIRCUIT_MAX_WIDTH
        const leftInset = isMobile ? 16 : Math.min(120, Math.max(24, containerWidth * 0.055))
        const rightInset = isMobile
          ? MOBILE_SAFE_RIGHT_INSET
          : Math.min(120, Math.max(24, containerWidth * 0.055))

        root.style.setProperty('--circuit-page-height', `${containerHeight}px`)
        root.style.setProperty('--circuit-start-y', `${Math.round(startY)}px`)
        root.style.setProperty('--circuit-rail-inset-left', `${Math.round(leftInset)}px`)
        root.style.setProperty('--circuit-rail-inset-right', `${Math.round(rightInset)}px`)

        const routeTargets =
          targets.length > 0
            ? targets
            : [
                {
                  id: 'fallback-hero',
                  rect: {
                    left: 16,
                    right: containerWidth - 16,
                    top: startY + 40,
                    bottom: startY + 280,
                  },
                },
              ]

        const keyframes: string[] = []
        const nextRoutes: Record<string, DynamicRoute> = {}

        TRAVELERS.forEach((traveler) => {
          const waypoints = buildCircuitWaypoints({
            containerWidth,
            containerHeight,
            targets: routeTargets,
            side: traveler.side,
            startY,
            endY,
          })

          if (waypoints.length < 2) return

          const animationName = `landing-tile-${instanceId}-${traveler.id}`
          const css = waypointsToKeyframes(animationName, waypoints, {
            cornerDwellPx: 16,
            keepVisible: true,
            peakOpacity: 1,
          })

          if (!css) return

          keyframes.push(css)
          nextRoutes[traveler.id] = {
            animationName,
            duration: estimateRouteDuration(waypoints, traveler.pixelsPerSecond),
          }
        })

        setDynamicRoutes(nextRoutes)
        setDynamicCss(keyframes.join('\n\n'))
        setHasDynamic(keyframes.length > 0)
      })
    }

    measureAndBuild()

    const resizeObserver = new ResizeObserver(measureAndBuild)
    resizeObserver.observe(root)
    resizeObserver.observe(document.documentElement)
    if (root.parentElement) resizeObserver.observe(root.parentElement)

    const landingRoot = root.parentElement
    if (landingRoot) {
      landingRoot.querySelectorAll('[data-landing-circuit-target]').forEach((node) => {
        resizeObserver.observe(node)
      })
    }

    const origin = document.querySelector<HTMLElement>('[data-landing-circuit-origin="nav"]')
    if (origin) resizeObserver.observe(origin)

    window.addEventListener('resize', measureAndBuild)
    window.addEventListener('load', measureAndBuild)
    const latePasses = [150, 500, 1200].map((ms) => window.setTimeout(measureAndBuild, ms))

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      latePasses.forEach((id) => window.clearTimeout(id))
      resizeObserver.disconnect()
      window.removeEventListener('resize', measureAndBuild)
      window.removeEventListener('load', measureAndBuild)
    }
  }, [instanceId])

  const rootClass = [
    'landing-grid-circuit',
    isPaused ? 'landing-grid-circuit--paused' : '',
    hasDynamic ? 'landing-grid-circuit--dynamic' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={rootRef} className={rootClass} data-landing-circuit>
      {dynamicCss ? <style>{dynamicCss}</style> : null}

      <div className="landing-circuit-track">
        {TRAVELERS.map((traveler) => {
          const dynamic = dynamicRoutes[traveler.id] ?? null
          const useDynamic = hasDynamic && Boolean(dynamic)
          const homeX =
            traveler.side === 'left' ? 'var(--circuit-x-left)' : 'var(--circuit-x-right)'
          const homeY = 'var(--circuit-start-y)'

          return (
            <CircuitTile
              key={traveler.id}
              travelerId={traveler.id}
              side={traveler.side}
              delay={traveler.delay}
              route={dynamic}
              useDynamic={useDynamic}
              isPagePaused={isPaused}
              homeX={homeX}
              homeY={homeY}
            />
          )
        })}
      </div>
    </div>
  )
}
