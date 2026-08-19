'use client'

import {
  m,
  useAnimationFrame,
  useMotionValue,
} from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'
import { partners, type Partner } from '@/components/sections/trustLogos'

/** Horizontal speed in px/s — clearly visible on phone and desktop. */
const MARQUEE_SPEED_PX_S = 48

/**
 * The old treatment stacked `grayscale` on top of `opacity-65`, which flattened already-grey
 * artwork into near-invisibility. The marks now carry their own accent, so the resting state
 * only softens them slightly and hover restores full colour, lifts the card and warms the border.
 */
function PartnerLogo({ name, Mark }: Partner) {
  return (
    <div className="group/logo flex h-14 w-[11rem] shrink-0 items-center gap-2.5 rounded-[14px] border border-brand-dark/12 bg-bg-card px-3.5 opacity-80 shadow-[0_1px_0_rgba(28,25,21,0.04)] transition-[opacity,border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-brand-dark/35 hover:opacity-100 hover:shadow-[3px_3px_0_var(--color-brand-accent)] sm:h-16 sm:w-[13.5rem] sm:gap-3 sm:px-5">
      <Mark className="h-7 w-7 shrink-0 transition-transform duration-300 group-hover/logo:scale-110 sm:h-9 sm:w-9" />
      <span className="min-w-0 truncate font-heading text-[11px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[13px]">
        {name}
      </span>
    </div>
  )
}

function PartnerGroup({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 list-none items-center gap-2.5 p-0 pr-2.5 sm:gap-3.5 sm:pr-3.5"
      aria-hidden={ariaHidden || undefined}
    >
      {partners.map((partner) => (
        <li key={partner.name} className="shrink-0">
          <PartnerLogo {...partner} />
        </li>
      ))}
    </ul>
  )
}

export default function TrustBar() {
  const reducedMotion = useHydratedReducedMotion()
  const [paused, setPaused] = useState(false)
  const [pageHidden, setPageHidden] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const halfWidthRef = useRef(0)
  const offsetRef = useRef(0)
  const x = useMotionValue(0)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    const measure = () => {
      // Two identical groups → loop distance is half the track width
      halfWidthRef.current = track.scrollWidth / 2
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [reducedMotion])

  useLayoutEffect(() => {
    const sync = () => setPageHidden(document.visibilityState === 'hidden')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  useAnimationFrame((_, delta) => {
    if (reducedMotion || paused || pageHidden) return

    const half = halfWidthRef.current
    if (half <= 0) return

    offsetRef.current -= (delta / 1000) * MARQUEE_SPEED_PX_S
    // Wrap seamlessly when one full group has scrolled past
    if (offsetRef.current <= -half) {
      offsetRef.current += half
    }
    x.set(offsetRef.current)
  })

  return (
    <section
      aria-labelledby="trust-title"
      className="overflow-hidden border-y border-brand-dark/20 bg-bg-primary py-8 sm:py-10"
    >
      <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:max-w-5xl">
        <p
          id="trust-title"
          className="text-center font-heading text-sm font-bold text-brand-dark sm:text-base"
        >
          Já usado por estudantes de todo o Brasil
        </p>
      </div>

      <div
        className="landing-trust-marquee relative mt-6 overflow-hidden"
        role="region"
        aria-label="Parceiros e escolas que usam a Kivora"
        aria-live="off"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setPaused(false)
          }
        }}
      >
        {reducedMotion ? (
          <ul className="mx-auto flex max-w-6xl list-none flex-wrap items-center justify-center gap-2.5 px-4 p-0 sm:gap-3.5 sm:px-6">
            {partners.map((partner) => (
              <li key={partner.name} className="shrink-0">
                <PartnerLogo {...partner} />
              </li>
            ))}
          </ul>
        ) : (
          <m.div
            ref={trackRef}
            className="flex w-max"
            style={{ x }}
          >
            <PartnerGroup />
            <PartnerGroup ariaHidden />
          </m.div>
        )}
      </div>
    </section>
  )
}
