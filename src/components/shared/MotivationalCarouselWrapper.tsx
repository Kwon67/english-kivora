'use client'

import dynamic from 'next/dynamic'

const MotivationalCarousel = dynamic(
  () => import('@/components/shared/MotivationalCarousel'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[260px] sm:h-[300px] rounded-2xl bg-[var(--color-surface-hover)] animate-pulse" />
    )
  }
)

export default MotivationalCarousel
