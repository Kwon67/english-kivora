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
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: delay + index * staggerDelay,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    }),
  }

  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <m.div
      className={className}
    >
      {childrenArray.map((child, index) => (
        <m.div
          key={index}
          custom={index}
          variants={item}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '160px 0px' }}
        >
          {child}
        </m.div>
      ))}
    </m.div>
  )
}
