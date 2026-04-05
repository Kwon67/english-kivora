'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

interface Slide {
  quote: string
  author: string
  imageUrl: string
}

const SLIDES: Slide[] = [
  {
    quote: 'The limits of my language mean the limits of my world.',
    author: 'Ludwig Wittgenstein',
    imageUrl: 'https://picsum.photos/seed/london/800/500',
  },
  {
    quote: 'One language sets you in a corridor for life. Two languages open every door along the way.',
    author: 'Frank Smith',
    imageUrl: 'https://picsum.photos/seed/newyork/800/500',
  },
  {
    quote: 'Learning another language is not only learning different words for the same things, but learning another way to think about things.',
    author: 'Flora Lewis',
    imageUrl: 'https://picsum.photos/seed/books/800/500',
  },
  {
    quote: 'To have another language is to possess a second soul.',
    author: 'Charlemagne',
    imageUrl: 'https://picsum.photos/seed/university/800/500',
  },
]

export default function MotivationalCarousel() {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goNext = useCallback(() => {
    setActive((prev) => (prev + 1) % SLIDES.length)
  }, [])

  const goPrev = useCallback(() => {
    setActive((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(goNext, 5000)
  }, [goNext])

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startTimer])

  function handleManualNav(index: number) {
    setActive(index)
    startTimer()
  }

  return (
    <section className="w-full" aria-label="Frases motivacionais em inglês">
      {/* Main viewport */}
      <div className="relative overflow-hidden rounded-2xl h-[260px] sm:h-[300px] group">
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/15" />

            <div className="absolute inset-0 flex flex-col items-center justify-end p-6 pb-8 text-center">
              <Quote className="w-7 h-7 text-white/40 mb-3" strokeWidth={1.5} />
              <blockquote className="text-white text-lg sm:text-xl font-semibold leading-relaxed max-w-lg mb-2 drop-shadow-md">
                &ldquo;{slide.quote}&rdquo;
              </blockquote>
              <cite className="text-white/60 text-sm font-medium not-italic">
                — {slide.author}
              </cite>
            </div>
          </div>
        ))}

        {/* Arrows */}
        <button
          onClick={() => { goPrev(); startTimer() }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 text-slate-700 flex items-center justify-center shadow-sm hover:bg-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => { goNext(); startTimer() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 text-slate-700 flex items-center justify-center shadow-sm hover:bg-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10"
          aria-label="Próxima"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => handleManualNav(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail cards */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {SLIDES.map((slide, i) => (
          <button
            key={i}
            onClick={() => handleManualNav(i)}
            className={`group/thumb relative overflow-hidden rounded-xl h-16 sm:h-20 cursor-pointer transition-all duration-200 border-2 ${
              i === active
                ? 'border-[var(--color-primary)] shadow-sm'
                : 'border-transparent opacity-50 hover:opacity-90'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className={`absolute inset-0 transition-colors ${
              i === active ? 'bg-black/10' : 'bg-black/30 group-hover/thumb:bg-black/15'
            }`} />
          </button>
        ))}
      </div>
    </section>
  )
}
