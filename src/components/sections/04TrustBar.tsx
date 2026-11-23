'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
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
    <div className="landing-frosted-subtle group/logo flex h-14 w-[11rem] shrink-0 items-center gap-2.5 rounded-[14px] border border-brand-dark/12 px-3.5 opacity-80 transition-[opacity,border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-brand-dark/35 hover:opacity-100 hover:shadow-offset-sm sm:h-16 sm:w-[13.5rem] sm:gap-3 sm:px-5">
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
  const belt = useRef<gsap.core.Tween | null>(null)
  useGSAP(() => {
    const track = trackRef.current
    if (!track || reducedMotion) return
    const resize = () => {
      const width = track.scrollWidth / 2
      if (width <= 0) return
      const progress = belt.current?.progress() ?? 0
      const paused = belt.current?.paused() ?? false
      belt.current?.kill()
      belt.current = gsap.fromTo(track, { x: 0 }, {
        x: -width, duration: width / MARQUEE_SPEED_PX_S, ease: 'none', repeat: -1, paused,
      }).progress(progress)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(track)
    return () => {
      observer.disconnect()
      belt.current?.kill()
      belt.current = null
    }
  }, { scope: trackRef, dependencies: [reducedMotion], revertOnUpdate: true })

  useLayoutEffect(() => {
    const sync = () => setPageHidden(document.visibilityState === 'hidden')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  useLayoutEffect(() => {
    belt.current?.paused(paused || pageHidden)
  }, [paused, pageHidden, reducedMotion])

  return (
    <section
      aria-labelledby="trust-title"
      className="landing-frosted-surface landing-frosted-surface-soft overflow-hidden border-y border-brand-dark/20 py-8 sm:py-10"
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
          <div
            ref={trackRef}
            className="flex w-max"
          >
            <PartnerGroup />
            <PartnerGroup ariaHidden />
          </div>
        )}
      </div>
    </section>
  )
}
