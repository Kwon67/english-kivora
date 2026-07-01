'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  buildCircuitWaypoints,
  estimateRouteDuration,
  MOBILE_CIRCUIT_MAX_WIDTH,
  rectRelativeToContainer,
  waypointsToKeyframes,
  type CircuitTarget,
  type CircuitTargetId,
} from '@/lib/landingCircuitRoutes'

const TRAVELERS = [
  { id: 't1', routeClass: 'landing-circuit-route-left', side: 'left' as const, delay: 0 },
  { id: 't2', routeClass: 'landing-circuit-route-right', side: 'right' as const, delay: 24 },
] as const

const TARGET_IDS: CircuitTargetId[] = ['hero', 'demo', 'footer']

type DynamicRoute = {
  animationName: string
  duration: number
}

export default function LandingGridCircuit() {
  const instanceId = useId().replace(/:/g, '')
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [dynamicRoutes, setDynamicRoutes] = useState<Record<string, DynamicRoute>>({})
  const [dynamicCss, setDynamicCss] = useState('')

  useEffect(() => {
    const syncPaused = () => {
      setIsPaused(document.visibilityState === 'hidden')
    }

    syncPaused()
    document.addEventListener('visibilitychange', syncPaused)
    return () => document.removeEventListener('visibilitychange', syncPaused)
  }, [])

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_CIRCUIT_MAX_WIDTH}px)`)
    const syncMobile = () => setIsMobile(media.matches)

    syncMobile()
    media.addEventListener('change', syncMobile)
    return () => media.removeEventListener('change', syncMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setDynamicRoutes({})
      setDynamicCss('')
      return
    }

    const root = rootRef.current
    if (!root) return

    let frame = 0

    const measureAndBuild = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const landingRoot = root.parentElement
        const containerRect = root.getBoundingClientRect()
        const containerWidth = containerRect.width
        const containerHeight = Math.max(
          landingRoot?.scrollHeight ?? 0,
          root.offsetHeight,
          root.scrollHeight,
        )

        const targets: CircuitTarget[] = TARGET_IDS.flatMap((id) => {
          const element = document.querySelector<HTMLElement>(`[data-landing-circuit-target="${id}"]`)
          if (!element) return []

          return [
            {
              id,
              rect: rectRelativeToContainer(element.getBoundingClientRect(), containerRect),
            },
          ]
        })

        if (targets.length === 0) {
          root.style.removeProperty('--circuit-mobile-height')
          return
        }

        root.style.setProperty('--circuit-mobile-height', `${containerHeight}px`)

        const keyframes: string[] = []
        const nextRoutes: Record<string, DynamicRoute> = {}

        TRAVELERS.forEach((traveler) => {
          const waypoints = buildCircuitWaypoints({
            containerWidth,
            containerHeight,
            targets,
            side: traveler.side,
          })
          const animationName = `landing-circuit-mobile-${instanceId}-${traveler.id}`
          const css = waypointsToKeyframes(animationName, waypoints)

          if (css) {
            keyframes.push(css)
            nextRoutes[traveler.id] = {
              animationName,
              duration: estimateRouteDuration(waypoints),
            }
          }
        })

        setDynamicRoutes(nextRoutes)
        setDynamicCss(keyframes.join('\n\n'))
      })
    }

    measureAndBuild()

    const resizeObserver = new ResizeObserver(measureAndBuild)
    resizeObserver.observe(root)
    resizeObserver.observe(document.documentElement)

    TARGET_IDS.forEach((id) => {
      const element = document.querySelector<HTMLElement>(`[data-landing-circuit-target="${id}"]`)
      if (element) resizeObserver.observe(element)
    })

    window.addEventListener('resize', measureAndBuild)
    window.addEventListener('load', measureAndBuild)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', measureAndBuild)
      window.removeEventListener('load', measureAndBuild)
    }
  }, [instanceId, isMobile])

  const rootClass = [
    'landing-grid-circuit',
    isPaused ? 'landing-grid-circuit--paused' : '',
    isMobile && dynamicCss ? 'landing-grid-circuit--mobile-dynamic' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={rootRef} className={rootClass} aria-hidden="true" data-landing-circuit>
      {dynamicCss ? <style>{dynamicCss}</style> : null}
      <div className="landing-circuit-track">
        {TRAVELERS.map((traveler) => {
          const dynamic = dynamicRoutes[traveler.id]
          const useDynamic = isMobile && dynamic

          return (
            <span
              key={traveler.id}
              className={[
                'landing-circuit-traveler',
                useDynamic ? 'landing-circuit-traveler--dynamic' : traveler.routeClass,
              ].join(' ')}
              style={{
                animationDuration: `${useDynamic ? dynamic.duration : traveler.id === 't1' ? 80 : 92}s`,
                animationDelay: `${traveler.delay}s`,
                ...(useDynamic ? { animationName: dynamic.animationName } : {}),
              }}
            />
          )
        })}
      </div>
    </div>
  )
}