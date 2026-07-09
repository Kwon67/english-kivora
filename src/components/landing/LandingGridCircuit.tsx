'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  buildCircuitWaypoints,
  estimateRouteDuration,
  measureCircuitStartY,
  rectRelativeToContainer,
  waypointsToKeyframes,
  type CircuitTarget,
  type CircuitTargetId,
} from '@/lib/landingCircuitRoutes'

type TravelerVariant = 'accent' | 'ink' | 'ghost'

const TRAVELERS = [
  { id: 't1', side: 'left' as const, delay: 0, variant: 'accent' as TravelerVariant, trail: true },
  { id: 't2', side: 'right' as const, delay: 16, variant: 'ink' as TravelerVariant, trail: true },
  { id: 't3', side: 'left' as const, delay: 32, variant: 'ghost' as TravelerVariant, trail: false },
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
  const [dynamicRoutes, setDynamicRoutes] = useState<Record<string, DynamicRoute>>({})
  const [dynamicCss, setDynamicCss] = useState('')
  const [hasDynamic, setHasDynamic] = useState(false)

  useEffect(() => {
    const syncPaused = () => {
      setIsPaused(document.visibilityState === 'hidden')
    }

    syncPaused()
    document.addEventListener('visibilitychange', syncPaused)
    return () => document.removeEventListener('visibilitychange', syncPaused)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let frame = 0

    const measureAndBuild = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const landingRoot = root.parentElement
        if (!landingRoot) return

        const containerRect = root.getBoundingClientRect()
        const containerWidth = containerRect.width
        const containerHeight = Math.max(
          landingRoot.scrollHeight,
          root.offsetHeight,
          root.scrollHeight,
          document.documentElement.scrollHeight
        )

        const startY = measureCircuitStartY(landingRoot)

        const targets: CircuitTarget[] = TARGET_IDS.flatMap((id) => {
          const element = document.querySelector<HTMLElement>(`[data-landing-circuit-target="${id}"]`)
          if (!element) return []

          const rect = rectRelativeToContainer(element.getBoundingClientRect(), containerRect)
          // Correct sticky/scroll drift for vertical position using document metrics when possible.
          const scrollAdjustedTop =
            element.getBoundingClientRect().top - landingRoot.getBoundingClientRect().top
          const height = rect.bottom - rect.top

          return [
            {
              id,
              rect: {
                left: rect.left,
                right: rect.right,
                top: scrollAdjustedTop,
                bottom: scrollAdjustedTop + height,
              },
            },
          ]
        })

        if (targets.length === 0) {
          root.style.removeProperty('--circuit-page-height')
          root.style.removeProperty('--circuit-start-y')
          root.style.removeProperty('--circuit-rail-top')
          root.style.removeProperty('--circuit-rail-height')
          setDynamicRoutes({})
          setDynamicCss('')
          setHasDynamic(false)
          return
        }

        const footerTarget = targets.find((t) => t.id === 'footer')
        const endY = footerTarget
          ? Math.min(containerHeight - 8, footerTarget.rect.bottom + 12)
          : containerHeight - 8

        const contentPad = 36
        const cardMax = 1152
        const cardSide = Math.max(0, (containerWidth - Math.min(cardMax, containerWidth - contentPad)) / 2)
        const railInset =
          containerWidth <= 639 ? 14 : Math.min(150, Math.max(14, cardSide - 16))

        root.style.setProperty('--circuit-page-height', `${containerHeight}px`)
        root.style.setProperty('--circuit-start-y', `${Math.round(startY)}px`)
        root.style.setProperty('--circuit-rail-top', `${Math.round(startY)}px`)
        root.style.setProperty(
          '--circuit-rail-height',
          `${Math.max(0, Math.round(endY - startY))}px`
        )
        root.style.setProperty('--circuit-rail-inset', `${Math.round(railInset)}px`)

        const keyframes: string[] = []
        const nextRoutes: Record<string, DynamicRoute> = {}

        TRAVELERS.forEach((traveler) => {
          const waypoints = buildCircuitWaypoints({
            containerWidth,
            containerHeight,
            targets,
            side: traveler.side,
            startY,
            endY,
          })
          const animationName = `landing-circuit-live-${instanceId}-${traveler.id}`
          const css = waypointsToKeyframes(animationName, waypoints, {
            cornerDwellPx: traveler.variant === 'ghost' ? 12 : 20,
            softLoopOpacity: true,
          })

          if (css) {
            keyframes.push(css)
            nextRoutes[traveler.id] = {
              animationName,
              duration: estimateRouteDuration(waypoints, traveler.variant === 'ghost' ? 48 : 52),
            }
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

    const landingRoot = root.parentElement
    if (landingRoot) resizeObserver.observe(landingRoot)

    TARGET_IDS.forEach((id) => {
      const element = document.querySelector<HTMLElement>(`[data-landing-circuit-target="${id}"]`)
      if (element) resizeObserver.observe(element)
    })

    const origin = document.querySelector<HTMLElement>('[data-landing-circuit-origin="nav"]')
    if (origin) resizeObserver.observe(origin)

    window.addEventListener('resize', measureAndBuild)
    window.addEventListener('load', measureAndBuild)

    // Fonts / late layout can shift hero card after first paint.
    const latePass = window.setTimeout(measureAndBuild, 400)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(latePass)
      resizeObserver.disconnect()
      window.removeEventListener('resize', measureAndBuild)
      window.removeEventListener('load', measureAndBuild)
    }
  }, [instanceId])

  const rootClass = [
    'landing-grid-circuit',
    'landing-grid-circuit--premium',
    isPaused ? 'landing-grid-circuit--paused' : '',
    hasDynamic ? 'landing-grid-circuit--dynamic' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={rootRef} className={rootClass} aria-hidden="true" data-landing-circuit>
      {dynamicCss ? <style>{dynamicCss}</style> : null}

      <div className="landing-circuit-rails">
        <span className="landing-circuit-rail landing-circuit-rail--left" />
        <span className="landing-circuit-rail landing-circuit-rail--right" />
      </div>

      <div className="landing-circuit-track">
        {TRAVELERS.map((traveler) => {
          const dynamic = dynamicRoutes[traveler.id]
          const useDynamic = hasDynamic && dynamic

          return (
            <span key={traveler.id} className="landing-circuit-traveler-stack">
              {traveler.trail && useDynamic ? (
                <span
                  className={[
                    'landing-circuit-traveler',
                    'landing-circuit-traveler--trail',
                    `landing-circuit-traveler--${traveler.variant}`,
                    'landing-circuit-traveler--dynamic',
                  ].join(' ')}
                  style={{
                    animationName: dynamic.animationName,
                    animationDuration: `${dynamic.duration}s`,
                    animationDelay: `${traveler.delay + 0.55}s`,
                  }}
                />
              ) : null}
              <span
                className={[
                  'landing-circuit-traveler',
                  `landing-circuit-traveler--${traveler.variant}`,
                  useDynamic ? 'landing-circuit-traveler--dynamic' : `landing-circuit-route-${traveler.side}`,
                ].join(' ')}
                style={{
                  animationDuration: `${useDynamic ? dynamic.duration : traveler.id === 't1' ? 68 : traveler.id === 't2' ? 76 : 84}s`,
                  animationDelay: `${traveler.delay}s`,
                  ...(useDynamic ? { animationName: dynamic.animationName } : {}),
                }}
              />
            </span>
          )
        })}
      </div>
    </div>
  )
}
