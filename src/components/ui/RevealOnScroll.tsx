'use client'

import { m, type HTMLMotionProps, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { useSafariIOS } from '@/hooks/useSafariIOS'

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
  const isIOS = useSafariIOS()

  if (isIOS) {
    return (
      <div data-reveal-scroll className={className}>
        {children}
      </div>
    )
  }

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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2, margin: '-80px' }}
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
