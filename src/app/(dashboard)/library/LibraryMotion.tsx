'use client'

import { m, type HTMLMotionProps, type Variants } from 'motion/react'

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
} satisfies Variants

const groupVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} satisfies Variants

type LibraryMotionSectionProps = HTMLMotionProps<'section'> & {
  stagger?: boolean
}

export function LibraryMotionSection({ stagger = false, children, ...props }: LibraryMotionSectionProps) {
  return (
    <m.section
      initial="hidden"
      animate="visible"
      variants={stagger ? groupVariants : itemVariants}
      {...props}
    >
      {children}
    </m.section>
  )
}

export function LibraryMotionItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <m.div variants={itemVariants} {...props}>
      {children}
    </m.div>
  )
}
