'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

type LandingCarouselControlsProps = {
  index: number
  count: number
  onPrev: () => void
  onNext: () => void
  onSelect: (index: number) => void
  prevLabel: string
  nextLabel: string
}

const controlClass =
  'flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-brand-dark bg-bg-card text-brand-dark transition-[transform,background-color,opacity] duration-200 hover:-translate-y-0.5 hover:bg-brand-accent active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-bg-card'

export default function LandingCarouselControls({
  index,
  count,
  onPrev,
  onNext,
  onSelect,
  prevLabel,
  nextLabel,
}: LandingCarouselControlsProps) {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
      <button type="button" aria-label={prevLabel} onClick={onPrev} disabled={index === 0} className={controlClass}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div role="group" aria-label="Escolher depoimento" className="flex items-center gap-2">
        {Array.from({ length: count }, (_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            aria-label={`Mostrar depoimento ${dotIndex + 1}`}
            aria-current={dotIndex === index ? 'true' : undefined}
            onClick={() => onSelect(dotIndex)}
            className={`h-2.5 rounded-full border border-brand-dark transition-[width,background-color] duration-250 ${dotIndex === index ? 'w-8 bg-brand-accent' : 'w-2.5 bg-bg-card hover:bg-brand-border'}`}
          />
        ))}
      </div>
      <button type="button" aria-label={nextLabel} onClick={onNext} disabled={index === count - 1} className={controlClass}>
        <ChevronRight className="h-5 w-5" />
      </button>
      <span className="w-full text-center font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
        {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
      </span>
    </div>
  )
}
