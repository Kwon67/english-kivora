'use client'

import { Check } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LandingCarouselControls from '@/components/ui/LandingCarouselControls'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { useLandingCarousel } from '@/hooks/useLandingCarousel'
import { useSafariIOS } from '@/hooks/useSafariIOS'
import { landingSectionTitleClass } from '@/lib/landingTypography'


const plans = [
  {
    name: 'Free',
    price: 'R$0',
    description: 'Para começar hoje com missões diárias.',
    features: ['Acesso aos modos básicos', 'Flashcards com SRS', 'Ranking semanal', 'Sessões limitadas por dia'],
    highlighted: false,
    cta: 'Começar Grátis →',
  },
  {
    name: 'Pro',
    price: 'R$29,90/mês',
    description: 'Para acelerar fluência com IA e todos os modos.',
    features: [
      'Sessões ilimitadas',
      'AI Tutor avançado',
      'Todos os modos',
      'Blitz padrão e Blitz IA',
      'Progresso detalhado',
      'Sem anúncios',
      'Suporte prioritário',
    ],
    highlighted: true,
    cta: 'Assinar Pro →',
  },
]

export default function PricingCarousel() {
  const isIOS = useSafariIOS()
  const { index, goNext, goPrev, bindSwipe } = useLandingCarousel(plans.length)

  return (
    <LandingSectionFrame id="precos" band="default">
      <RevealOnScroll className="mx-auto max-w-6xl text-center">
        <SectionBadge label="Planos" className="mx-auto" />
        <h2 className={`mt-8 ${landingSectionTitleClass}`}>
          Escolha seu plano
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-secondary">
          Precisa de algo mais flexível?{' '}
          <a href="#contato" className="font-semibold text-brand-dark underline underline-offset-4">
            Fale conosco.
          </a>
        </p>

        <div
          data-landing-circuit-target="pricing"
          className="relative mx-auto mt-10 max-w-3xl"
        >
          <div className="hidden grid-cols-2 gap-6 md:grid">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
          <div className="md:hidden">
            <div {...bindSwipe()} className="landing-carousel-swipe select-none">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={plans[index].name}
                  initial={isIOS ? false : { opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={isIOS ? { opacity: 1 } : { opacity: 0, x: -28 }}
                  transition={{ duration: isIOS ? 0 : 0.28, ease: 'easeOut' }}
                >
                  <PlanCard plan={plans[index]} />
                </m.div>
              </AnimatePresence>
            </div>
            <LandingCarouselControls
              onPrev={goPrev}
              onNext={goNext}
              prevLabel="Plano anterior"
              nextLabel="Próximo plano"
            />
          </div>
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}

function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <Card className={`border-brand-dark p-6 text-left ${plan.highlighted ? 'bg-brand-accent/15 ring-1 ring-brand-dark' : ''}`}>
      <h3 className="font-heading text-2xl font-bold text-brand-dark">{plan.name}</h3>
      <p className="mt-3 text-sm leading-6 text-brand-secondary">{plan.description}</p>
      <p className="mt-6 border-y border-brand-dark py-4 font-heading text-2xl font-bold text-brand-dark">
        {plan.price}
      </p>
      <ul className="mt-6 space-y-4">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-brand-dark">
            <Check className="mt-1 h-5 w-5 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        landing
        href="/register"
        variant={plan.highlighted ? 'accent' : 'outline'}
        className="mt-8 w-full"
      >
        {plan.cta}
      </Button>
    </Card>
  )
}
