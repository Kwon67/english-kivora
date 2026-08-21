'use client'

import { useEffect, useRef } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'motion/react'

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
  const prefersReducedMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (prefersReducedMotion) {
      if (spanRef.current) spanRef.current.textContent = String(value)
      return
    }

    motionValue.set(0)
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: 'easeOut',
      onUpdate: (latest) => {
        if (spanRef.current) spanRef.current.textContent = String(Math.round(latest))
      },
    })

    return () => controls.stop()
  }, [value, duration, delay, prefersReducedMotion, motionValue])

  return (
    <span ref={spanRef} className={className}>
      {value}
    </span>
  )
}
