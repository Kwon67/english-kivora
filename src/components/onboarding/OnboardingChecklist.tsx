import Link from 'next/link'
import { Brain, Compass, ListChecks, Zap } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  homeCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeSectionTitleClass,
} from '@/lib/homeStyles'

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
  secondaryHref = '/study',
  secondaryLabel = 'Ver minha rotina',
  showTertiary = false,
}: OnboardingChecklistProps) {
  const containerClass = `${homeCardClass} p-6 sm:p-8`

  return (
    <article data-testid="onboarding-checklist" className={containerClass}>
      <div>
        <SectionBadge label="Primeiros passos" />
        <h2 className={`mt-4 ${homeSectionTitleClass}`}>
          Monte sua rotina em 3 passos
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-secondary sm:text-base">
          Escolha packs no catálogo, adicione à rotina e faça sua primeira sessão de estudo.
        </p>

        <ol className="mt-6 space-y-4 text-sm text-brand-secondary">
          {ONBOARDING_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-dark bg-bg-primary font-heading text-xs font-bold text-brand-dark">
                {index + 1}
              </span>
              <span>
                <strong className="font-semibold text-brand-dark">{step.title}</strong>
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
            className={homePrimaryButton}
          >
            <Compass className="h-4 w-4" />
            Explorar packs
          </Link>
          <Link
            href={secondaryHref}
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={homeSecondaryButton}
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
                className={homeSecondaryButton}
              >
                <Brain className="h-4 w-4" />
                Revisar
              </Link>
              <Link
                href="/blitz"
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className={homeSecondaryButton}
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
