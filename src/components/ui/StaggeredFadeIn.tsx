'use client'

import { m } from 'framer-motion'
import { ReactNode } from 'react'

interface StaggeredFadeInProps {
  children: ReactNode
  delay?: number
  staggerDelay?: number
  /** Caps per-item delay so deep sections do not wait seconds when scrolled into view. */
  maxItemDelay?: number
  className?: string
  animateOnMount?: boolean
}

export default function StaggeredFadeIn({
  children,
  delay = 0,
  staggerDelay = 0.1,
  maxItemDelay = 0.6,
  className = '',
  animateOnMount = false,
}: StaggeredFadeInProps) {
  const container = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: delay || 0.1,
        staggerChildren: staggerDelay,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: animateOnMount ? 0 : Math.min(delay + index * staggerDelay, maxItemDelay),
        duration: 0.6,
        ease: 'easeOut' as const,
      },
    }),
  }

  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <m.div
      variants={container}
      initial="hidden"
      animate={animateOnMount ? 'show' : undefined}
      whileInView={animateOnMount ? undefined : 'show'}
      viewport={animateOnMount ? undefined : { once: true, margin: '160px 0px' }}
      className={className}
    >
      {childrenArray.map((child, index) => (
        <m.div
          key={index}
          custom={index}
          variants={item}
        >
          {child}
        </m.div>
      ))}
    </m.div>
  )
}
