'use client'

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RevealState = 'idle' | 'pending' | 'visible'

type RevealOnScrollProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  stagger?: boolean
}

export default function RevealOnScroll({
  children,
  className = '',
  stagger = false,
  ...props
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<RevealState>('idle')

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('visible')
      return
    }

    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const alreadyInView = rect.top < viewportHeight && rect.bottom > 0

    if (alreadyInView) {
      setState('visible')
      return
    }

    setState('pending')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setState('visible')
        observer.disconnect()
      },
      { rootMargin: '0px 0px -20px 0px', threshold: 0.04 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal-scroll
      data-reveal-state={state}
      data-reveal-stagger={stagger || undefined}
      className={cn('landing-reveal', className)}
      {...props}
    >
      {children}
    </div>
  )
}
