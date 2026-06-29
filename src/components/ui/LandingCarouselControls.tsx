'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

type LandingCarouselControlsProps = {
  onPrev: () => void
  onNext: () => void
  prevLabel: string
  nextLabel: string
}

export default function LandingCarouselControls({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: LandingCarouselControlsProps) {
  return (
    <div className="mt-8 flex justify-center gap-4">
      <button
        type="button"
        aria-label={prevLabel}
        onClick={onPrev}
        className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-accent active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label={nextLabel}
        onClick={onNext}
        className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-accent active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}