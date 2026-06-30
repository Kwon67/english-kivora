'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { landingRadius } from '@/lib/landingStyles'

type LandingCarouselControlsProps = {
  onPrev: () => void
  onNext: () => void
  prevLabel: string
  nextLabel: string
}

const controlClass = `flex h-12 w-12 touch-manipulation items-center justify-center ${landingRadius} border border-brand-dark bg-brand-accent active:scale-95`

export default function LandingCarouselControls({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: LandingCarouselControlsProps) {
  return (
    <div className="mt-8 flex justify-center gap-4">
      <button type="button" aria-label={prevLabel} onClick={onPrev} className={controlClass}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" aria-label={nextLabel} onClick={onNext} className={controlClass}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}