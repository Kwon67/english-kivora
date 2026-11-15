import { ArrowRight, Check, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { landingFrostedSurface, landingRadiusLg } from '@/lib/landingStyles'

const plans = [
  {
    name: 'Free',
    price: 'R$0',
    cadence: 'para sempre',
    description: 'Para criar consistência com as práticas essenciais.',
    features: ['Modos básicos de prática', 'Flashcards com SRS', 'Ranking semanal', 'Sessões diárias'],
    highlighted: false,
    cta: 'Começar grátis',
    href: '/register',
  },
  {
    name: 'Pro',
    price: 'R$29,90',
    cadence: 'por mês',
    description: 'Para acelerar sua fluência com IA e uma rotina completa.',
    features: ['Sessões ilimitadas', 'Tutor de IA avançado', 'Todos os modos de prática', 'Blitz padrão e Blitz IA', 'Progresso detalhado', 'Sem anúncios'],
    highlighted: true,
    cta: 'Assinar Pro',
    href: '/register?plan=pro',
  },
] as const

export default function PricingCarousel() {
  return (
    <LandingSectionFrame id="precos" band="plain" className="scroll-mt-24 py-20 sm:py-24">
      <RevealOnScroll className="mx-auto max-w-6xl">
        <LandingSectionHeader
          centered
          badge="Planos simples"
          title="Seu ritmo. Seu plano."
          titleClassName="max-w-4xl"

        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2 md:items-stretch">
          {plans.map((plan) => (
            <article
              key={plan.name}
              data-landing-plan={plan.highlighted ? 'featured' : 'standard'}
              className={`relative flex min-h-full flex-col overflow-hidden ${landingRadiusLg} ${landingFrostedSurface} border p-6 sm:p-8 ${
                plan.highlighted
                  ? 'landing-frosted-highlight border-brand-dark shadow-offset-sm'
                  : 'border-brand-dark/25'
              }`}
            >
              {plan.highlighted ? (
                <div data-tone="streak" className="tone-chip absolute right-3 top-3">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Pro
                </div>
              ) : null}
              <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-brand-secondary">Plano {plan.name}</p>
              <h3 className="mt-5 font-section text-4xl font-semibold text-brand-dark">{plan.price}</h3>
              <p className="mt-1 text-xs font-semibold text-brand-secondary">{plan.cadence}</p>

              <div className="my-6 h-px bg-brand-dark/15" />
              <ul className="flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium text-brand-dark">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-dark ${plan.highlighted ? 'bg-brand-accent' : 'bg-bg-primary'}`}>
                      <Check className="h-3 w-3" strokeWidth={1.5} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                landing
                href={plan.href}
                variant={plan.highlighted ? 'accent' : 'outline'}
                className="mt-8 w-full"
              >
                {plan.cta} <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </article>
          ))}
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
