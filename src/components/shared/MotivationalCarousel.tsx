'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

interface Slide {
  quote: string
  author: string
  eyebrow: string
  note: string
  palette: 'teal' | 'blue' | 'orange'
  artwork: 'voice' | 'memory' | 'momentum'
}

const SLIDES: Slide[] = [
  {
    quote: 'The limits of my language mean the limits of my world.',
    author: 'Ludwig Wittgenstein',
    eyebrow: 'Voice and expression',
    note: 'Treino diario fica mais leve quando a interface te guia com clareza e ritmo.',
    palette: 'teal',
    artwork: 'voice',
  },
  {
    quote:
      'Learning another language is not only learning different words, but another way to think.',
    author: 'Flora Lewis',
    eyebrow: 'Memory and recall',
    note: 'Cards, repetição e contexto visual ajudam a transformar vocabulário em repertório.',
    palette: 'blue',
    artwork: 'memory',
  },
  {
    quote: 'One language sets you in a corridor for life. Two languages open every door along the way.',
    author: 'Frank Smith',
    eyebrow: 'Momentum and progress',
    note: 'Constancia vence intensidade isolada. O produto precisa te convidar a voltar todos os dias.',
    palette: 'orange',
    artwork: 'momentum',
  },
]

const PALETTE_STYLES = {
  teal: {
    surface: 'from-[rgba(43,122,11,0.16)] via-white/70 to-transparent',
    chip: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
    line: '#2B7A0B',
    lineAlt: '#1D4ED8',
    dot: '#112033',
  },
  blue: {
    surface: 'from-[rgba(29,78,216,0.16)] via-white/70 to-transparent',
    chip: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
    line: '#1D4ED8',
    lineAlt: '#2B7A0B',
    dot: '#EA580C',
  },
  orange: {
    surface: 'from-[rgba(234,88,12,0.16)] via-white/70 to-transparent',
    chip: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
    line: '#EA580C',
    lineAlt: '#1D4ED8',
    dot: '#2B7A0B',
  },
} as const

function SlideArtwork({
  artwork,
  line,
  lineAlt,
  dot,
}: {
  artwork: Slide['artwork']
  line: string
  lineAlt: string
  dot: string
}) {
  if (artwork === 'memory') {
    return (
      <svg
        aria-hidden="true"
        className="h-auto w-full"
        viewBox="0 0 340 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="34" y="28" width="126" height="82" rx="24" fill="white" fillOpacity="0.86" />
        <rect x="180" y="56" width="126" height="82" rx="24" fill="white" fillOpacity="0.72" />
        <rect x="72" y="146" width="196" height="72" rx="26" fill="white" fillOpacity="0.82" />
        <path d="M60 78H133" stroke={line} strokeWidth="8" strokeLinecap="round" />
        <path d="M205 104H278" stroke={lineAlt} strokeWidth="8" strokeLinecap="round" />
        <path d="M102 182H236" stroke={dot} strokeWidth="8" strokeLinecap="round" />
        <path d="M115 201H208" stroke={line} strokeWidth="8" strokeLinecap="round" opacity="0.7" />
        <circle cx="278" cy="170" r="18" fill={lineAlt} fillOpacity="0.16" />
      </svg>
    )
  }

  if (artwork === 'momentum') {
    return (
      <svg
        aria-hidden="true"
        className="h-auto w-full"
        viewBox="0 0 340 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="26" y="36" width="288" height="176" rx="36" fill="white" fillOpacity="0.72" />
        <path d="M74 166C116 136 149 102 170 70" stroke={line} strokeWidth="10" strokeLinecap="round" />
        <path d="M170 70L150 75" stroke={line} strokeWidth="10" strokeLinecap="round" />
        <path d="M170 70L166 90" stroke={line} strokeWidth="10" strokeLinecap="round" />
        <circle cx="80" cy="160" r="16" fill={dot} fillOpacity="0.16" />
        <circle cx="126" cy="126" r="14" fill={lineAlt} fillOpacity="0.16" />
        <circle cx="171" cy="70" r="18" fill={line} fillOpacity="0.16" />
        <circle cx="228" cy="110" r="12" fill={lineAlt} fillOpacity="0.22" />
        <circle cx="262" cy="82" r="28" fill="white" fillOpacity="0.88" />
        <path d="M250 82H274" stroke={lineAlt} strokeWidth="8" strokeLinecap="round" />
        <path d="M214 155H269" stroke={dot} strokeWidth="8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-auto w-full"
      viewBox="0 0 340 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="28" y="26" width="284" height="192" rx="40" fill="white" fillOpacity="0.72" />
      <path d="M67 90C101 67 133 56 163 56C199 56 230 70 266 98" stroke={line} strokeWidth="9" strokeLinecap="round" />
      <path d="M58 128C101 102 142 89 183 89C219 89 247 98 280 118" stroke={lineAlt} strokeWidth="9" strokeLinecap="round" />
      <path d="M80 167C112 151 145 143 179 143C210 143 238 149 265 161" stroke={line} strokeWidth="9" strokeLinecap="round" opacity="0.8" />
      <circle cx="80" cy="167" r="12" fill={dot} />
      <circle cx="266" cy="98" r="14" fill={lineAlt} fillOpacity="0.14" />
      <circle cx="281" cy="118" r="8" fill={lineAlt} />
    </svg>
  )
}

export default function MotivationalCarousel() {
  const slides = useMemo(() => SLIDES, [])
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goNext = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const goPrev = useCallback(() => {
    setActive((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(goNext, 6500)
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

  const slide = slides[active]
  const palette = PALETTE_STYLES[slide.palette]

  return (
    <section className="w-full" aria-label="Frases motivacionais em inglês">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <p className="section-kicker">Focus reset</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Frases, direção visual e um pouco mais de atmosfera para manter o estudo vivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              goPrev()
              startTimer()
            }}
            className="btn-ghost h-11 w-11 rounded-full p-0"
            aria-label="Frase anterior"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => {
              goNext()
              startTimer()
            }}
            className="btn-ghost h-11 w-11 rounded-full p-0"
            aria-label="Proxima frase"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="surface-hero relative min-h-[320px] overflow-hidden p-5 sm:p-7 lg:min-h-[360px] lg:p-8">
        <div className={`absolute inset-0 bg-gradient-to-br ${palette.surface}`} />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-xl">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${palette.chip}`}>
              {slide.eyebrow}
            </div>
            <Quote className="mt-6 h-8 w-8 text-[var(--color-text-subtle)]" strokeWidth={1.7} />
            <blockquote className="mt-4 text-3xl font-semibold leading-[1.02] text-[var(--color-text)] sm:text-4xl">
              &ldquo;{slide.quote}&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
              {slide.author}
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--color-text-muted)]">
              {slide.note}
            </p>
          </div>

          <div className="surface-muted overflow-hidden rounded-[28px] p-5 sm:p-6">
            <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(244,248,251,0.64))] p-4 shadow-[0_28px_58px_-44px_rgba(17,32,51,0.5)]">
              <SlideArtwork artwork={slide.artwork} line={palette.line} lineAlt={palette.lineAlt} dot={palette.dot} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {slides.map((item, index) => {
          const isActive = index === active

          return (
            <button
              key={item.author}
              type="button"
              onClick={() => handleManualNav(index)}
              className={`text-left transition-all ${
                isActive ? 'card' : 'surface-muted hover:bg-white/76'
              } rounded-[24px] p-4`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                {item.eyebrow}
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                {item.author}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {item.note}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
