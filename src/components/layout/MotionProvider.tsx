'use client'

import { LazyMotion, MotionConfig } from 'motion/react'

const loadFeatures = () => import('./motionFeatures').then(module => module.default)

export default function MotionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
