'use client'

import { m, type HTMLMotionProps, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

export function useScrollReveal() {
  return {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  } as const
}

type RevealOnScrollProps = HTMLMotionProps<'div'> & {
  children: ReactNode
  stagger?: boolean
}

export default function RevealOnScroll({
  children,
  className = '',
  stagger = false,
  ...props
}: RevealOnScrollProps) {
  const childVariants = useScrollReveal()
  const variants = stagger
    ? {
        hidden: childVariants.hidden,
        visible: {
          ...childVariants.visible,
          transition: {
            ...childVariants.visible.transition,
            staggerChildren: 0.1,
          },
        },
      }
    : childVariants

  return (
    <m.div
      data-reveal-scroll
      initial={false}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -60px 0px' }}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </m.div>
  )
}

export const revealItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
} satisfies Variants