'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import MotionSurface from '@/components/motion/MotionSurface'

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
  return (
    <div {...props}>
      <MotionSurface onScroll stagger={stagger} className={className}>
        {children}
      </MotionSurface>
    </div>
  )
}
