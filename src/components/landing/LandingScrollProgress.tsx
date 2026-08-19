'use client'

import { m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LANDING_CHAPTERS } from '@/lib/landingSections'
import { landingBorder, landingRadius , landingRadiusLg} from '@/lib/landingStyles'
import { useLandingNavigation } from '@/components/landing/LandingNavigationProvider'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

export function LandingMobileProgress() {
  const { scrollProgress } = useLandingNavigation()
  const reducedMotion = useHydratedReducedMotion()

  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-brand-border md:hidden">
      <m.span
        className="block h-full origin-left bg-brand-accent"
        animate={{ scaleX: scrollProgress }}
        transition={{ duration: reducedMotion ? 0 : 0.12, ease: 'easeOut' }}
      />
    </div>
  )
}

export default function LandingScrollProgress() {
  const { activeSection } = useLandingNavigation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const nav = (
    <nav
      aria-label="Capítulos da página"
      className="landing-scroll-progress pointer-events-none fixed inset-y-0 right-4 z-40 hidden py-24 xl:flex xl:items-center 2xl:right-6"
    >
      {/*
        Full-height fixed rail + flex center keeps the control vertically middle
        while py-24 reserves space for the sticky header / bottom edge so the
        panel never clips the top of the page while scrolling.
      */}
      <ol
        className={`pointer-events-auto flex max-h-full flex-col items-end gap-1 overflow-y-auto p-2 ${landingBorder} ${landingRadiusLg} bg-[#F4F1EA]/72 shadow-[4px_4px_0_#1C1915] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#F4F1EA]/55`}
      >
        {LANDING_CHAPTERS.map((chapter, index) => {
          const active = chapter.id === activeSection

          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={active ? 'location' : undefined}
                aria-label={`Ir para ${chapter.label}`}
                className={`group flex min-h-9 items-center justify-end gap-2 px-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark ${landingRadius}`}
              >
                <span
                  className={`max-w-0 overflow-hidden whitespace-nowrap font-heading text-[10px] font-bold uppercase tracking-wider transition-[max-width,opacity] duration-200 group-hover:max-w-28 group-hover:opacity-100 group-focus-visible:max-w-28 group-focus-visible:opacity-100 ${
                    active ? 'max-w-28 text-brand-dark opacity-100' : 'text-brand-secondary opacity-0'
                  }`}
                >
                  {chapter.label}
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center border text-[10px] font-bold transition-[background-color,border-color,color,box-shadow] duration-200 ${landingRadius} ${
                    active
                      ? 'border-brand-dark bg-brand-accent text-brand-dark shadow-[2px_2px_0_#1C1915]'
                      : 'border-brand-dark/25 bg-[#F4F1EA]/60 text-brand-secondary backdrop-blur-sm group-hover:border-brand-dark group-hover:bg-[#F4F1EA]/90 group-hover:text-brand-dark'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )

  // Portal to <body> so position:fixed is not clipped by the landing
  // wrapper's overflow-x-hidden (which broke the bar at the top of the page).
  if (!mounted) return null
  return createPortal(nav, document.body)
}
