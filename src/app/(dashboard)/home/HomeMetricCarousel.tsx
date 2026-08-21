'use client'

import { m } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface HomeMetricCarouselProps {
  count: number
  children: ReactNode
}

export default function HomeMetricCarousel({ count, children }: HomeMetricCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-carousel-card]'))
    if (cards.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const mostVisible = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b))
        const index = cards.indexOf(mostVisible.target as HTMLElement)
        if (index !== -1) setActiveIndex(index)
      },
      { root: container, threshold: [0.5, 0.75, 1] }
    )
    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [count])

  return (
    <div>
      <div
        ref={containerRef}
        className="scroll-reveal-stagger -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 scroll-pr-4 pb-2 max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:scroll-p-0 md:pb-0"
      >
        <div aria-hidden="true" className="hidden w-4 shrink-0 snap-none max-md:block" />
        {children}
        <div aria-hidden="true" className="hidden w-4 shrink-0 snap-none max-md:block" />
      </div>
      <div
        className="mt-3 flex justify-center gap-1.5 md:hidden"
        role="tablist"
        aria-label="Indicador do carrossel de métricas"
      >
        {Array.from({ length: count }).map((_, index) => (
          <span key={index} aria-hidden="true" className="relative h-1.5 w-5 overflow-hidden rounded-full bg-brand-border">
            {index === activeIndex ? (
              <m.span
                layoutId="home-carousel-active-dot"
                className="absolute inset-0 rounded-full bg-brand-dark"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            ) : null}
          </span>
        ))}
      </div>
    </div>
  )
}
