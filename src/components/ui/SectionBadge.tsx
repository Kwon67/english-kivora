'use client'

import { m, useReducedMotion } from 'framer-motion'
import { useSafariIOS } from '@/hooks/useSafariIOS'

const softKicker =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'

const squareClass =
  'inline-block h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent'
const lineClass = 'section-badge-line inline-block h-px w-8 bg-brand-dark/60'

const containerVariants = {
  hidden: {},
  visible: {},
}

const pillVariants = {
  hidden: { scale: 0.88, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' as const, delay: 0 },
  },
}

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.58, ease: 'easeOut' as const, delay: 0.22 },
  },
}

const squareVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] as const, delay: 0.42 },
  },
}

interface SectionBadgeProps {
  label: string
  className?: string
  animate?: boolean
}

export default function SectionBadge({ label, className = '', animate = true }: SectionBadgeProps) {
  const isIOS = useSafariIOS()
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = animate && !prefersReducedMotion && !isIOS

  if (!shouldAnimate) {
    return (
      <div className={`flex w-fit items-center ${className}`}>
        <span className={squareClass} aria-hidden="true" />
        <span className={lineClass} aria-hidden="true" />
        <span className={softKicker}>{label}</span>
        <span className={lineClass} aria-hidden="true" />
        <span className={squareClass} aria-hidden="true" />
      </div>
    )
  }

  return (
    <m.div
      data-section-badge
      className={`flex w-fit items-center ${className}`}
      initial={false}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -40px 0px' }}
      variants={containerVariants}
    >
      <m.span
        className={squareClass}
        variants={squareVariants}
        style={{ transformOrigin: 'center' }}
        aria-hidden="true"
      />
      <m.span
        className={`${lineClass} origin-right`}
        variants={lineVariants}
        style={{ transformOrigin: 'right center' }}
        aria-hidden="true"
      />
      <m.span className={softKicker} variants={pillVariants}>
        {label}
      </m.span>
      <m.span
        className={`${lineClass} origin-left`}
        variants={lineVariants}
        style={{ transformOrigin: 'left center' }}
        aria-hidden="true"
      />
      <m.span
        className={squareClass}
        variants={squareVariants}
        style={{ transformOrigin: 'center' }}
        aria-hidden="true"
      />
    </m.div>
  )
}