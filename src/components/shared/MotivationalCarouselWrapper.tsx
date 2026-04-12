'use client'

import dynamic from 'next/dynamic'

const MotivationalCarousel = dynamic(
  () => import('@/components/shared/MotivationalCarousel'),
  {
    ssr: false,
    loading: () => (
      <div className="surface-hero h-[320px] w-full animate-pulse rounded-[28px] sm:h-[360px]" />
    )
  }
)

export default MotivationalCarousel
