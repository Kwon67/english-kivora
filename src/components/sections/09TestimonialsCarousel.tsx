'use client'

import { m, AnimatePresence } from 'framer-motion'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingSectionTitleClass } from '@/lib/landingTypography'
import LandingCarouselControls from '@/components/ui/LandingCarouselControls'
import { useLandingCarousel } from '@/hooks/useLandingCarousel'
import { useSafariIOS } from '@/hooks/useSafariIOS'

const testimonials = [
  {
    quote: 'Eu parei de travar em reuniões. O tutor me corrige sem julgamento e eu consigo repetir até sair natural.',
    name: 'Marina Costa',
    level: 'Intermediária B1',
    avatar: 'sun',
  },
  {
    quote: 'O Blitz me fez estudar todos os dias. Parece jogo, mas meu vocabulário cresceu muito rápido.',
    name: 'Lucas Andrade',
    level: 'Iniciante A2',
    avatar: 'bolt',
  },
  {
    quote: 'Usei para entrevistas em inglês e consegui responder com mais clareza. O feedback em tempo real muda tudo.',
    name: 'Rafaela Nunes',
    level: 'Avançada B2',
    avatar: 'moon',
  },
]

export default function TestimonialsCarousel() {
  const isIOS = useSafariIOS()
  const { index, goNext, goPrev, bindSwipe } = useLandingCarousel(testimonials.length)
  const testimonial = testimonials[index]

  return (
    <LandingSectionFrame band="soft" className="overflow-hidden">
      <RevealOnScroll className="mx-auto max-w-4xl text-center">
        <SectionBadge label="Depoimentos" className="mx-auto" />
        <h2 className={`mt-8 ${landingSectionTitleClass}`}>Amado por estudantes</h2>
        <p className="mt-6 font-heading text-lg text-brand-dark">★★★★★</p>

        <div {...bindSwipe()} className="landing-carousel-swipe select-none">
          <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={testimonial.name}
                  initial={isIOS ? false : { opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={isIOS ? { opacity: 1 } : { opacity: 0, x: -28 }}
                  transition={{ duration: isIOS ? 0 : 0.28, ease: 'easeOut' }}
                >
              <blockquote className="mx-auto mt-6 max-w-3xl font-heading text-xl font-bold italic leading-9 text-brand-dark sm:text-2xl">
                “{testimonial.quote}”
              </blockquote>
              <div className="mt-8 flex items-center justify-center gap-4">
                <AvatarMark type={testimonial.avatar} />
                <div className="text-left">
                  <p className="font-semibold text-brand-dark">{testimonial.name}</p>
                  <p className="text-sm text-brand-secondary">{testimonial.level}</p>
                </div>
              </div>
            </m.div>
          </AnimatePresence>
        </div>

        <LandingCarouselControls
          onPrev={goPrev}
          onNext={goNext}
          prevLabel="Depoimento anterior"
          nextLabel="Próximo depoimento"
        />
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}

function AvatarMark({ type }: { type: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-dark bg-brand-accent">
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="h-9 w-9 text-brand-dark"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {type === 'sun' && (
          <>
            <circle cx="24" cy="24" r="8.5" stroke="currentColor" strokeWidth="2.4" />
            <path
              d="M24 7.5v4.2M24 36.3v4.2M7.5 24h4.2M36.3 24h4.2M12.3 12.3l3 3M32.7 32.7l3 3M35.7 12.3l-3 3M15.3 32.7l-3 3"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        )}
        {type === 'bolt' && (
          <path
            d="M27.5 5.5 13.8 25.1h9.4l-2.7 17.4 13.7-20.7h-9.3l2.6-16.3Z"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
        )}
        {type === 'moon' && (
          <>
            <path
              d="M31.8 34.3c-2.7 2.4-6.3 3.8-10.2 3.6-8.4-.4-14.9-7.5-14.5-15.9.3-6.7 5-12.2 11.2-13.8-2.6 3.1-4 7.2-3.8 11.5.4 8.4 7.6 15 16 14.6h1.3Z"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M34 10.5h5M36.5 8v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  )
}
