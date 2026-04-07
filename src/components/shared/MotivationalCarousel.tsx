'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

interface Slide {
  quote: string
  author: string
  imageUrl: string
}

const QUOTES = [
  {
    quote: 'The limits of my language mean the limits of my world.',
    author: 'Ludwig Wittgenstein',
  },
  {
    quote: 'One language sets you in a corridor for life. Two languages open every door along the way.',
    author: 'Frank Smith',
  },
  {
    quote: 'Learning another language is not only learning different words for the same things, but learning another way to think about things.',
    author: 'Flora Lewis',
  },
  {
    quote: 'To have another language is to possess a second soul.',
    author: 'Charlemagne',
  },
]

// Get a time block that changes every 5 hours
function getCurrentTimeBlock(): number {
  const now = new Date()
  const hours = now.getHours()
  const day = now.getDate()
  const month = now.getMonth()
  const year = now.getFullYear()
  const block = Math.floor(hours / 5)
  return year * 1000000 + month * 10000 + day * 100 + block
}

// Generate random seed based on time block
function getRandomSeed(timeBlock: number, index: number): string {
  const seed = (timeBlock * 1000 + index * 137) % 100000
  return `motivation-${timeBlock}-${seed}`
}

// Generate fresh images every 5 hours
function generateSlides(): Slide[] {
  const timeBlock = getCurrentTimeBlock()
  return QUOTES.map((quote, index) => ({
    ...quote,
    imageUrl: `https://picsum.photos/seed/${getRandomSeed(timeBlock, index)}/800/500`,
  }))
}

export default function MotivationalCarousel() {
  const initialTimeBlock = getCurrentTimeBlock()
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const imageRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [slides, setSlides] = useState<Slide[]>(() => generateSlides())
  const [timeBlock, setTimeBlock] = useState<number>(initialTimeBlock)

  // Check for image updates every minute
  useEffect(() => {
    imageRefreshRef.current = setInterval(() => {
      const newBlock = getCurrentTimeBlock()
      if (newBlock !== timeBlock) {
        setTimeBlock(newBlock)
        setSlides(generateSlides())
      }
    }, 60000)

    return () => {
      if (imageRefreshRef.current) clearInterval(imageRefreshRef.current)
    }
  }, [timeBlock])

  const goNext = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const goPrev = useCallback(() => {
    setActive((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    // Auto-advance slide every 5 seconds
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

  if (slides.length === 0) {
    return <section className="w-full h-[260px] sm:h-[300px] rounded-2xl bg-slate-200 animate-pulse" />
  }

  return (
    <section className="w-full" aria-label="Frases motivacionais em inglês">
      {/* Image refresh indicator */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-[var(--color-text-subtle)]">
          Imagens atualizadas a cada 5 horas
        </span>
      </div>

      {/* Main viewport */}
      <div className="relative overflow-hidden rounded-2xl h-[260px] sm:h-[300px] group">
        {slides.map((slide: Slide, i: number) => (
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
          {slides.map((_: Slide, i: number) => (
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
        {slides.map((slide: Slide, i: number) => (
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
