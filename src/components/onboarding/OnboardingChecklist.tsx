import Link from 'next/link'
import { Brain, Compass, ListChecks, Zap } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export const ONBOARDING_STEPS = [
  {
    title: 'Explore o catálogo',
    description: 'Encontre packs por nível ou tema.',
  },
  {
    title: 'Adicione à rotina',
    description: 'Escolha o modo de estudo de cada pack.',
  },
  {
    title: 'Pratique',
    description: 'Revise cards ou jogue Blitz pelo Início.',
  },
] as const

type OnboardingChecklistProps = {
  variant?: 'panel' | 'tile'
  secondaryHref?: string
  secondaryLabel?: string
  showTertiary?: boolean
}

export default function OnboardingChecklist({
  variant = 'panel',
  secondaryHref = '/study',
  secondaryLabel = 'Ver minha rotina',
  showTertiary = false,
}: OnboardingChecklistProps) {
  const containerClass =
    variant === 'panel'
      ? 'rounded-2xl border-2 border-brand-dark bg-bg-card p-6 shadow-[6px_6px_0_var(--color-brand-dark)] sm:p-8'
      : 'rounded-2xl border-2 border-brand-dark bg-bg-card p-6 shadow-[6px_6px_0_var(--color-brand-dark)] sm:p-8'
  const secondaryButton =
    'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2.5 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white'

  return (
    <article data-testid="onboarding-checklist" className={containerClass}>
      <div>
        <SectionBadge label="Primeiros passos" />
        <h2 className="mt-4 font-heading text-2xl font-bold leading-tight text-brand-dark sm:text-3xl">
          Monte sua rotina em 3 passos
        </h2>
        <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
          Escolha packs no catálogo, adicione à rotina e faça sua primeira sessão de estudo.
        </p>

        <ol className="mt-6 space-y-4 font-body text-sm text-brand-secondary">
          {ONBOARDING_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-brand-dark bg-white font-heading text-xs font-bold text-brand-dark">
                {index + 1}
              </span>
              <span>
                <strong className="font-body font-semibold text-brand-dark">{step.title}</strong>
                {' — '}
                {step.description}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/explore"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-5 py-2.5 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--color-brand-accent)]"
          >
            <Compass className="h-4 w-4" />
            Explorar packs
          </Link>
          <Link
            href={secondaryHref}
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={secondaryButton}
          >
            <ListChecks className="h-4 w-4" />
            {secondaryLabel}
          </Link>
          {showTertiary ? (
            <>
              <Link
                href="/review"
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className={secondaryButton}
              >
                <Brain className="h-4 w-4" />
                Revisar
              </Link>
              <Link
                href="/blitz"
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className={secondaryButton}
              >
                <Zap className="h-4 w-4" />
                Blitz
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
}
