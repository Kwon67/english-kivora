import { Check, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { landingRadius } from '@/lib/landingStyles'

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
          title="Comece no seu ritmo. Evolua quando fizer sentido."
          titleClassName="max-w-4xl"
          description={
            <>
              Os dois planos ficam claros desde o início. Sem surpresa e sem esconder a comparação.{' '}
              <a href="#contato" className="font-semibold text-brand-dark underline underline-offset-4">Fale conosco.</a>
            </>
          }
          descriptionClassName="mt-4 max-w-2xl text-base leading-7 text-brand-secondary sm:text-lg"
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2 md:items-stretch">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex min-h-full flex-col overflow-hidden ${landingRadius} border p-6 sm:p-8 ${
                plan.highlighted
                  ? 'border-brand-dark bg-brand-accent/20 shadow-[7px_7px_0_#1C1915]'
                  : 'border-brand-dark/25 bg-bg-card shadow-[0_18px_50px_rgba(28,25,21,0.05)]'
              }`}
            >
              {plan.highlighted ? (
                <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-bl-[12px] border-b border-l border-brand-dark bg-brand-dark px-3 py-2 font-heading text-[10px] font-bold uppercase tracking-wider text-white">
                  <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
                  Mais completo
                </div>
              ) : null}
              <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-brand-secondary">Plano {plan.name}</p>
              <h3 className="mt-5 font-section text-4xl font-semibold text-brand-dark">{plan.price}</h3>
              <p className="mt-1 text-xs font-semibold text-brand-secondary">{plan.cadence}</p>
              <p className="mt-5 min-h-12 text-sm leading-6 text-brand-secondary">{plan.description}</p>
              <div className="my-6 h-px bg-brand-dark/15" />
              <ul className="flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium text-brand-dark">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-dark ${plan.highlighted ? 'bg-brand-accent' : 'bg-bg-primary'}`}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                landing
                href={plan.href}
                variant={plan.highlighted ? 'accent' : 'outline'}
                className={`mt-8 w-full ${plan.highlighted ? 'bg-brand-accent shadow-[3px_3px_0_#1C1915]' : ''}`}
              >
                {plan.cta} →
              </Button>
            </article>
          ))}
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
