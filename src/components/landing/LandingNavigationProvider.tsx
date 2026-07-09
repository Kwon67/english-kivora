'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LANDING_CHAPTERS, type LandingChapterId } from '@/lib/landingSections'

type LandingNavigationState = {
  activeSection: LandingChapterId
  scrollProgress: number
}

const LandingNavigationContext = createContext<LandingNavigationState>({
  activeSection: LANDING_CHAPTERS[0].id,
  scrollProgress: 0,
})

export function useLandingNavigation() {
  return useContext(LandingNavigationContext)
}

export default function LandingNavigationProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<LandingChapterId>(LANDING_CHAPTERS[0].id)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const sections = LANDING_CHAPTERS.map(({ id }) => document.getElementById(id)).filter(
      (section): section is HTMLElement => section !== null,
    )

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const nextId = visible[0]?.target.id as LandingChapterId | undefined
        if (nextId) setActiveSection(nextId)
      },
      {
        rootMargin: '-28% 0px -58% 0px',
        threshold: [0, 0.15, 0.35, 0.55],
      },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frame = 0

    const updateProgress = () => {
      frame = 0
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / maxScroll)))
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const value = useMemo(
    () => ({ activeSection, scrollProgress }),
    [activeSection, scrollProgress],
  )

  return (
    <LandingNavigationContext.Provider value={value}>
      {children}
    </LandingNavigationContext.Provider>
  )
}
