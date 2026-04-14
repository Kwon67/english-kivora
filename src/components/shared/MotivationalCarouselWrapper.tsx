'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const MotivationalCarouselImpl = dynamic(
  () => import('@/components/shared/MotivationalCarousel'),
  {
    ssr: false,
    loading: () => (
      <div className="surface-hero h-[320px] w-full animate-pulse rounded-[28px] sm:h-[360px]" />
    ),
  }
)

export default function MotivationalCarousel() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')

    const update = () => {
      setIsDesktop(media.matches)
    }

    update()
    media.addEventListener('change', update)

    return () => {
      media.removeEventListener('change', update)
    }
  }, [])

  if (!isDesktop) return null

  return <MotivationalCarouselImpl />
}
