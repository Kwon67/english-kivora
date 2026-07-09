'use client'

import { LazyMotion, MotionConfig, domMax } from 'framer-motion'

export default function MotionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
