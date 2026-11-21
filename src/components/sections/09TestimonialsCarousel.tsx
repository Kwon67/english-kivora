'use client'

import gsap from 'gsap'
import { useDrag } from '@use-gesture/react'
import { MoonStar, Quote, Sun, Zap, type LucideIcon } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import LandingCarouselControls from '@/components/ui/LandingCarouselControls'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { clampLandingSlide, getLandingSlideAfterDrag } from '@/lib/landingCarousel'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

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
  const [ready, setReady] = useState(false)
  const [hintOffset, setHintOffset] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const [pageHidden, setPageHidden] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const firstCardRef = useRef<HTMLElement>(null)
  const hasNudged = useRef(false)
  /** Set right before an autoplay step that wraps last→first, so that one step snaps instead of sliding backward across the whole track. */
  const autoplayWrapped = useRef(false)
  const [inView, setInView] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragging = useRef(false)
  const slide = useRef<gsap.core.Tween | null>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= 0.35), { threshold: 0.35 })
    observer.observe(containerRef.current!)
    return () => observer.disconnect()
  }, [])
  const reducedMotion = useHydratedReducedMotion()
  const gap = 24

  useLayoutEffect(() => {
    const container = containerRef.current
    const card = firstCardRef.current
    if (!container || !card) return

    const measure = () => {
      setGeometry({ containerWidth: container.clientWidth, cardWidth: card.offsetWidth })
      setReady(true)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(card)

    // Safety net: some browsers can be slow (or fail) to report the first
    // ResizeObserver measurement. Never leave the carousel invisible over it —
    // worst case it fades in at the default (unmeasured) position.
    const fallback = window.setTimeout(() => setReady(true), 400)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
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
        const next = (current + 1) % testimonials.length
        autoplayWrapped.current = next === 0
        return next
      })
    }, 3200)

    return () => window.clearInterval(timer)
  }, [shouldAutoplay])

  const baseX = geometry.containerWidth / 2 - geometry.cardWidth / 2
  const x = baseX - index * (geometry.cardWidth + gap) + hintOffset

  function goTo(nextIndex: number) {
    autoplayWrapped.current = false
    setHintOffset(0)
    setIndex(clampLandingSlide(nextIndex, testimonials.length))
  }

  const slideDuration = reducedMotion || autoplayWrapped.current || !ready ? 0 : 0.62
  useLayoutEffect(() => {
    if (!dragging.current) slide.current = gsap.to(track.current, { x, duration: slideDuration, ease: 'expo.out', overwrite: 'auto' })
    return () => { slide.current?.kill() }
  }, [x, slideDuration])

  const bindDrag = useDrag(({ first, last, xy, initial, velocity, direction, canceled, event, tap }) => {
    if (tap || !track.current) return
    if (first) {
      dragging.current = true
      slide.current?.kill()
      dragStartX.current = Number(gsap.getProperty(track.current, 'x'))
      setInteractionPaused(true)
    }
    const offsetX = xy[0] - initial[0]
    if (!last) {
      gsap.set(track.current, { x: dragStartX.current + offsetX * 0.12 })
      return
    }
    dragging.current = false
    const interrupted = canceled || event.type === 'pointercancel' || event.type === 'touchcancel'
    const next = interrupted ? index : getLandingSlideAfterDrag({
      current: index, count: testimonials.length, offsetX, velocityX: velocity[0] * direction[0] * 1000,
    })
    if (next === index) {
      slide.current = gsap.to(track.current, { x: baseX - index * (geometry.cardWidth + gap), duration: reducedMotion ? 0 : 0.62, ease: 'expo.out', overwrite: 'auto' })
    }
    goTo(next)
    setInteractionPaused(false)
  }, { axis: 'x', filterTaps: true })

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
          data-contained-carousel
          aria-label="Depoimentos de estudantes"
          aria-live={autoplayEnabled ? 'off' : 'polite'}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') goTo(index - 1)
            if (event.key === 'ArrowRight') goTo(index + 1)
          }}
          className="relative mx-auto mt-12 max-w-[1440px] overflow-hidden py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-dark"
        >
          <div ref={track} {...bindDrag()}
            className={`flex cursor-grab touch-pan-y gap-6 [will-change:transform] active:cursor-grabbing transition-opacity duration-300 ${
              ready ? 'opacity-100' : 'opacity-0'
            }`}
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
                  className={`landing-frosted-surface landing-frosted-surface-soft relative w-[min(82vw,680px)] shrink-0 select-none overflow-hidden rounded-[20px] border border-brand-dark p-6 text-left transition-[opacity,transform] duration-500 [contain:paint] [will-change:transform,opacity] sm:p-9 ${active ? 'scale-100 opacity-100' : 'scale-[0.94] opacity-50'}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <span className="inline-flex rounded-full border border-brand-dark/20 bg-bg-primary px-3 py-1 font-heading text-2xs font-bold uppercase tracking-wider text-brand-secondary">
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
          </div>
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

const avatarIcons: Record<string, LucideIcon> = {
  sun: Sun,
  bolt: Zap,
  moon: MoonStar,
}

function AvatarMark({ type }: { type: string }) {
  const Icon = avatarIcons[type] ?? Sun

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-dark bg-brand-accent">
      <Icon className="h-7 w-7 text-brand-dark" strokeWidth={1.5} aria-hidden="true" />
    </div>
  )
}
