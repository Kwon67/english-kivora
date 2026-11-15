'use client'

import { Children, type ReactNode } from 'react'
import MotionSurface from '@/components/motion/MotionSurface'

interface StaggeredFadeInProps {
  children: ReactNode
  delay?: number
  staggerDelay?: number
  maxItemDelay?: number
  className?: string
  animateOnMount?: boolean
}

export default function StaggeredFadeIn({
  children,
  delay = 0,
  staggerDelay = 0.06,
  maxItemDelay = 0.24,
  className = '',
  animateOnMount = false,
}: StaggeredFadeInProps) {
  return (
    <MotionSurface
      className={className}
      stagger
      onScroll={!animateOnMount}
      delay={delay}
      staggerDelay={staggerDelay}
      maxItemDelay={maxItemDelay}
    >
      {Children.toArray(children).map((child, index) => (
        <div key={index} className="min-w-0">
          {child}
        </div>
      ))}
    </MotionSurface>
  )
}
