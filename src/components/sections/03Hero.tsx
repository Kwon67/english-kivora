'use client'

import { m } from 'framer-motion'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import SectionBadge from '@/components/ui/SectionBadge'
import StaggeredFadeIn from '@/components/ui/StaggeredFadeIn'
import { useSafariIOS } from '@/hooks/useSafariIOS'
import { landingCtaCardShadow, landingHeroCardClass } from '@/lib/landingStyles'

const enterTransition = { duration: 0.45, ease: 'easeOut' as const }

export default function Hero() {
  const isIOS = useSafariIOS()

  return (
    <section className="relative px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-12">
      <div className={`mx-auto max-w-6xl ${landingHeroCardClass} ${landingCtaCardShadow} lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-center`}>
        <StaggeredFadeIn
          animateOnMount
          className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-12"
          staggerDelay={0.08}
        >
          <SectionBadge label="Kivora English" />
          <h1 className="mt-6 max-w-xl font-heading text-4xl font-bold leading-[1.1] text-brand-dark sm:text-5xl lg:text-[3.75rem]">
            Aprenda inglês de verdade com IA
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-brand-secondary sm:text-lg">
            IA + gamificação + revisão espaçada. Evolua no seu ritmo, prove com dados.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            <Button landing href="/register" className="w-fit transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
              Começar grátis →
            </Button>
            <p className="text-sm text-brand-secondary">
              Quer saber mais?{' '}
              <a
                href="#contato"
                className="font-heading text-sm font-bold uppercase text-brand-dark underline underline-offset-4 transition-opacity hover:opacity-80"
              >
                Fale conosco
              </a>
            </p>
          </div>
        </StaggeredFadeIn>

        <m.div
          initial={isIOS ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...enterTransition, delay: isIOS ? 0 : 0.2 }}
          className="relative flex min-h-[180px] items-center justify-center px-4 py-4 sm:min-h-[360px] sm:px-6 sm:py-8 lg:min-h-[420px] lg:px-8"
        >
          <Image
            src="/images/home/undraw-online-learning.svg?v=9"
            alt="Ilustração de estudo online"
            width={480}
            height={380}
            priority
            unoptimized
            className="relative z-10 h-auto w-full max-w-[220px] select-none object-contain sm:max-w-[360px] lg:max-w-[500px]"
          />
          <m.div
            initial={isIOS ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...enterTransition, delay: isIOS ? 0 : 0.42 }}
            className="absolute right-4 top-4 rounded-full border border-brand-dark bg-bg-primary px-3 py-1.5 font-heading text-xs font-bold sm:right-8 sm:top-8"
          >
            XP +120
          </m.div>
        </m.div>
      </div>
    </section>
  )
}