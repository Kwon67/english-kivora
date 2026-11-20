'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface BlitzCountUpNumberProps {
  value: number
  duration?: number
  delay?: number
  className?: string
}

/**
 * Animates a number counting up on mount/change. Mutates the span's textContent
 * directly (not React state) so the animation doesn't re-render every frame.
 */
export default function BlitzCountUpNumber({
  value,
  duration = 0.9,
  delay = 0,
  className,
}: BlitzCountUpNumberProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    const span = spanRef.current!
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const counter = { score: 0 }
      gsap.to(counter, { score: value, duration, delay, ease: 'power2.out',
        onUpdate: () => { span.textContent = String(Math.round(counter.score)) },
      })
      return () => { span.textContent = String(value) }
    })
    span.textContent = String(value)
    return () => media.revert()
  }, { scope: spanRef, dependencies: [value, duration, delay], revertOnUpdate: true })

  return (
    <span ref={spanRef} className={className}>
      {value}
    </span>
  )
}
