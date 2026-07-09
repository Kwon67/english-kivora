'use client'

import {
  m,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion'
import Image from 'next/image'
import { useLayoutEffect, useRef, useState } from 'react'

const partners = [
  { name: 'Escola Nativa', logo: '/images/landing/trust/escola-nativa.svg' },
  { name: 'Fluency Lab', logo: '/images/landing/trust/fluency-lab.svg' },
  { name: 'Kivora Academy', logo: '/images/landing/trust/kivora-academy.svg' },
  { name: 'Tech Teens', logo: '/images/landing/trust/tech-teens.svg' },
  { name: 'Global Start', logo: '/images/landing/trust/global-start.svg' },
  { name: 'English Hub', logo: '/images/landing/trust/english-hub.svg' },
] as const

/** Horizontal speed in px/s — clearly visible on phone and desktop. */
const MARQUEE_SPEED_PX_S = 48

function PartnerLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex h-12 w-[9.75rem] shrink-0 items-center justify-center rounded-[12px] border border-brand-dark/10 bg-bg-card px-3 opacity-65 grayscale transition-[opacity,border-color] duration-200 hover:border-brand-dark/30 hover:opacity-100 sm:h-16 sm:w-[12.5rem] sm:px-5 md:w-[13.5rem]">
      <Image
        src={logo}
        alt={name}
        width={220}
        height={56}
        unoptimized
        draggable={false}
        className="pointer-events-none h-8 w-auto max-w-full select-none object-contain sm:h-10 md:h-11"
      />
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
          <PartnerLogo name={partner.name} logo={partner.logo} />
        </li>
      ))}
    </ul>
  )
}

export default function TrustBar() {
  const reducedMotion = useReducedMotion()
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
                <PartnerLogo name={partner.name} logo={partner.logo} />
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
