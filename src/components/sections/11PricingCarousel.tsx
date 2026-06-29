'use client'

import { Check } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LandingCarouselControls from '@/components/ui/LandingCarouselControls'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { useLandingCarousel } from '@/hooks/useLandingCarousel'

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
      'Arena ao vivo',
      'Progresso detalhado',
      'Sem anúncios',
      'Suporte prioritário',
    ],
    highlighted: true,
    cta: 'Assinar Pro →',
  },
]

export default function PricingCarousel() {
  const { index, goNext, goPrev, bindSwipe } = useLandingCarousel(plans.length)

  return (
    <section id="precos" className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-6xl text-center">
        <SectionBadge label="Planos" className="mx-auto" />
        <h2 className="mt-8 font-heading text-3xl font-bold text-brand-dark sm:text-5xl">
          Escolha seu plano
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-secondary">
          Precisa de algo mais flexível?{' '}
          <a href="#contato" className="font-semibold text-brand-dark underline underline-offset-4">
            Fale conosco.
          </a>
        </p>

        <div className="relative mt-10">
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
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
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
    </section>
  )
}

function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <Card className={`text-left ${plan.highlighted ? 'border-2 border-brand-dark shadow-[8px_8px_0_#D5E06B]' : ''}`}>
      <h3 className="font-heading text-3xl font-bold text-brand-dark">{plan.name}</h3>
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
        href="/register"
        variant={plan.highlighted ? 'accent' : 'outline'}
        className="mt-8 w-full"
      >
        {plan.cta}
      </Button>
    </Card>
  )
}
