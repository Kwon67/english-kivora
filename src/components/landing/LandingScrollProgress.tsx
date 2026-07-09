'use client'

import { m, useReducedMotion } from 'framer-motion'
import { LANDING_CHAPTERS } from '@/lib/landingSections'
import { useLandingNavigation } from '@/components/landing/LandingNavigationProvider'

export function LandingMobileProgress() {
  const { scrollProgress } = useLandingNavigation()
  const reducedMotion = useReducedMotion()

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

  return (
    <nav
      aria-label="Capítulos da página"
      className="landing-scroll-progress fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block 2xl:right-8"
    >
      <ol className="flex flex-col items-end gap-2 rounded-full border border-brand-dark/15 bg-bg-card/90 p-2 shadow-[0_8px_30px_rgba(28,25,21,0.08)] backdrop-blur">
        {LANDING_CHAPTERS.map((chapter, index) => {
          const active = chapter.id === activeSection

          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={active ? 'location' : undefined}
                aria-label={`Ir para ${chapter.label}`}
                className="group flex min-h-9 items-center justify-end gap-2 rounded-full px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
              >
                <span
                  className={`max-w-0 overflow-hidden whitespace-nowrap font-heading text-[10px] font-bold uppercase tracking-wider transition-[max-width,opacity] duration-200 group-hover:max-w-28 group-hover:opacity-100 group-focus-visible:max-w-28 group-focus-visible:opacity-100 ${
                    active ? 'max-w-28 text-brand-dark opacity-100' : 'text-brand-secondary opacity-0'
                  }`}
                >
                  {chapter.label}
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-bold transition-[background-color,transform] duration-200 ${
                    active
                      ? 'scale-110 border-brand-dark bg-brand-accent text-brand-dark'
                      : 'border-brand-dark/25 bg-bg-card text-brand-secondary group-hover:border-brand-dark'
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
}
