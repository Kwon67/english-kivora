'use client'

import { m, useInView, useReducedMotion, type PanInfo } from 'framer-motion'
import { Quote } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import LandingCarouselControls from '@/components/ui/LandingCarouselControls'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { clampLandingSlide, getLandingSlideAfterDrag } from '@/lib/landingCarousel'

const testimonials = [
  {
    quote: 'Eu parei de travar em reuniões. O tutor me corrige sem julgamento e eu consigo repetir até sair natural.',
    name: 'Marina Costa',
    level: 'Intermediária B1',
    context: 'Inglês para reuniões',
    avatar: 'sun',
  },
  {
    quote: 'O Blitz me fez estudar todos os dias. Parece jogo, mas meu vocabulário cresceu muito rápido.',
    name: 'Lucas Andrade',
    level: 'Iniciante A2',
    context: 'Rotina consistente',
    avatar: 'bolt',
  },
  {
    quote: 'Usei para entrevistas em inglês e consegui responder com mais clareza. O feedback em tempo real muda tudo.',
    name: 'Rafaela Nunes',
    level: 'Avançada B2',
    context: 'Preparação profissional',
    avatar: 'moon',
  },
] as const

export default function TestimonialsCarousel() {
  const [index, setIndex] = useState(0)
  const [geometry, setGeometry] = useState({ containerWidth: 0, cardWidth: 0 })
  const [hintOffset, setHintOffset] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const [pageHidden, setPageHidden] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const firstCardRef = useRef<HTMLElement>(null)
  const hasNudged = useRef(false)
  const autoplayDirection = useRef<1 | -1>(1)
  const inView = useInView(containerRef, { amount: 0.35 })
  const reducedMotion = useReducedMotion()
  const gap = 24

  useLayoutEffect(() => {
    const container = containerRef.current
    const card = firstCardRef.current
    if (!container || !card) return

    const measure = () => {
      setGeometry({ containerWidth: container.clientWidth, cardWidth: card.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(card)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || reducedMotion || hasNudged.current) return
    hasNudged.current = true
    const out = window.setTimeout(() => setHintOffset(-14), 220)
    const back = window.setTimeout(() => setHintOffset(0), 620)
    return () => {
      window.clearTimeout(out)
      window.clearTimeout(back)
    }
  }, [inView, reducedMotion])

  useEffect(() => {
    const syncVisibility = () => setPageHidden(document.visibilityState === 'hidden')
    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)
    return () => document.removeEventListener('visibilitychange', syncVisibility)
  }, [])

  const autoplayEnabled = !userPaused && !reducedMotion
  const shouldAutoplay = autoplayEnabled && inView && !interactionPaused && !pageHidden

  useEffect(() => {
    if (!shouldAutoplay) return

    const timer = window.setInterval(() => {
      setHintOffset(0)
      setIndex((current) => {
        if (current >= testimonials.length - 1) autoplayDirection.current = -1
        if (current <= 0) autoplayDirection.current = 1
        return current + autoplayDirection.current
      })
    }, 3200)

    return () => window.clearInterval(timer)
  }, [shouldAutoplay])

  const baseX = geometry.containerWidth / 2 - geometry.cardWidth / 2
  const x = baseX - index * (geometry.cardWidth + gap) + hintOffset

  function goTo(nextIndex: number) {
    setHintOffset(0)
    setIndex(clampLandingSlide(nextIndex, testimonials.length))
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    goTo(
      getLandingSlideAfterDrag({
        current: index,
        count: testimonials.length,
        offsetX: info.offset.x,
        velocityX: info.velocity.x,
      }),
    )
    setInteractionPaused(false)
  }

  return (
    <LandingSectionFrame id="depoimentos" band="soft" className="scroll-mt-24 overflow-hidden py-20 sm:py-24">
      <RevealOnScroll className="mx-auto max-w-6xl text-center">
        <LandingSectionHeader
          centered
          badge="Histórias reais"
          title="Quando o inglês deixa de ser teoria."
          titleClassName="max-w-4xl"
          description="Arraste para conhecer diferentes formas de usar o Kivora no dia a dia."
        />
      </RevealOnScroll>

      <div
        onMouseEnter={() => setInteractionPaused(true)}
        onMouseLeave={() => setInteractionPaused(false)}
        onFocusCapture={() => setInteractionPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false)
        }}
      >
        <div
          ref={containerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Depoimentos de estudantes"
          aria-live={autoplayEnabled ? 'off' : 'polite'}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') goTo(index - 1)
            if (event.key === 'ArrowRight') goTo(index + 1)
          }}
          className="relative mx-auto mt-12 max-w-[1440px] overflow-hidden py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-dark"
        >
          <m.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            dragMomentum={false}
            onDragStart={() => setInteractionPaused(true)}
            onDragEnd={handleDragEnd}
            animate={{ x }}
            transition={{
              type: 'tween',
              duration: reducedMotion ? 0 : 0.62,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex cursor-grab touch-pan-y gap-6 [will-change:transform] active:cursor-grabbing"
          >
            {testimonials.map((testimonial, testimonialIndex) => {
              const active = testimonialIndex === index
              return (
                <article
                  key={testimonial.name}
                  ref={testimonialIndex === 0 ? firstCardRef : undefined}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${testimonialIndex + 1} de ${testimonials.length}: ${testimonial.name}`}
                  aria-hidden={!active}
                  className={`relative w-[min(82vw,680px)] shrink-0 select-none overflow-hidden rounded-[18px] border border-brand-dark bg-bg-card p-6 text-left shadow-[0_20px_55px_rgba(28,25,21,0.10)] transition-[opacity,transform] duration-500 [contain:paint] [will-change:transform,opacity] sm:p-9 ${active ? 'scale-100 opacity-100' : 'scale-[0.94] opacity-50'}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <span className="inline-flex rounded-full border border-brand-dark/20 bg-bg-primary px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                      {testimonial.context}
                    </span>
                    <Quote className="h-8 w-8 shrink-0 text-brand-accent [fill:currentColor]" />
                  </div>
                  <blockquote className="mt-8 font-section text-2xl font-semibold leading-[1.35] text-brand-dark sm:text-3xl">
                    “{testimonial.quote}”
                  </blockquote>
                  <div className="mt-9 flex items-center gap-4 border-t border-brand-dark/15 pt-6">
                    <AvatarMark type={testimonial.avatar} />
                    <div>
                      <p className="font-heading text-sm font-bold text-brand-dark">{testimonial.name}</p>
                      <p className="mt-1 text-xs text-brand-secondary">{testimonial.level}</p>
                    </div>
                    <p className="ml-auto font-heading text-sm tracking-[0.16em] text-brand-dark" aria-label="5 estrelas">★★★★★</p>
                  </div>
                </article>
              )
            })}
          </m.div>
        </div>

        <LandingCarouselControls
          index={index}
          count={testimonials.length}
          onPrev={() => goTo(index - 1)}
          onNext={() => goTo(index + 1)}
          onSelect={goTo}
          isPlaying={Boolean(autoplayEnabled)}
          onTogglePlay={() => setUserPaused((paused) => !paused)}
          prevLabel="Depoimento anterior"
          nextLabel="Próximo depoimento"
        />
      </div>
    </LandingSectionFrame>
  )
}

function AvatarMark({ type }: { type: string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-dark bg-brand-accent">
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-7 w-7 text-brand-dark" fill="none">
        {type === 'sun' ? <><circle cx="24" cy="24" r="8.5" stroke="currentColor" strokeWidth="2.4" /><path d="M24 7.5v4.2M24 36.3v4.2M7.5 24h4.2M36.3 24h4.2M12.3 12.3l3 3M32.7 32.7l3 3M35.7 12.3l-3 3M15.3 32.7l-3 3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></> : null}
        {type === 'bolt' ? <path d="M27.5 5.5 13.8 25.1h9.4l-2.7 17.4 13.7-20.7h-9.3l2.6-16.3Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" /> : null}
        {type === 'moon' ? <><path d="M31.8 34.3c-2.7 2.4-6.3 3.8-10.2 3.6-8.4-.4-14.9-7.5-14.5-15.9.3-6.7 5-12.2 11.2-13.8-2.6 3.1-4 7.2-3.8 11.5.4 8.4 7.6 15 16 14.6h1.3Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M34 10.5h5M36.5 8v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></> : null}
      </svg>
    </div>
  )
}
