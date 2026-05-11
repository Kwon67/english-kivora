'use client'

import { m } from 'framer-motion'
import { ReactNode } from 'react'

interface StaggeredFadeInProps {
  children: ReactNode
  delay?: number
  staggerDelay?: number
  className?: string
}

export default function StaggeredFadeIn({
  children,
  delay = 0,
  staggerDelay = 0.1,
  className = '',
}: StaggeredFadeInProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren: staggerDelay,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      }
    },
  }

  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <m.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {childrenArray.map((child, index) => (
        <m.div key={index} variants={item}>
          {child}
        </m.div>
      ))}
    </m.div>
  )
}
