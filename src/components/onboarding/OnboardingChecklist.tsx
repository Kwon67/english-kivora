import Link from 'next/link'
import { Brain, Compass, ListChecks, Zap } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  cardSheen,
  glassPanel,
  glassTile,
  primaryBtn,
  softBtn,
  softKicker,
} from '@/lib/dashboardUi'

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
  const containerClass = variant === 'panel' ? `${glassPanel} p-5 sm:p-7` : `${glassTile} p-6 sm:p-8`

  return (
    <article data-testid="onboarding-checklist" className={`${containerClass} relative overflow-hidden`}>
      <div className={cardSheen} />

      <div className="relative z-10">
        <p className={softKicker}>Primeiros passos</p>
        <h2 className="mt-4 font-montserrat text-2xl font-bold leading-tight text-text dark:text-text sm:text-3xl">
          Monte sua rotina em 3 passos
        </h2>
        <p className="mt-3 max-w-2xl font-inter text-sm leading-relaxed text-text-muted sm:text-base dark:text-text-muted">
          Escolha packs no catálogo, adicione à rotina e faça sua primeira sessão de estudo.
        </p>

        <ol className="mt-6 space-y-3 text-sm text-text-muted dark:text-text-muted">
          {ONBOARDING_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-black text-primary dark:bg-primary/12">
                {index + 1}
              </span>
              <span>
                <strong className="text-text dark:text-text">{step.title}</strong>
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
            className={primaryBtn}
          >
            <Compass className="h-4 w-4" />
            Explorar packs
          </Link>
          <Link
            href={secondaryHref}
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={softBtn}
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
                className={softBtn}
              >
                <Brain className="h-4 w-4" />
                Revisar
              </Link>
              <Link
                href="/blitz"
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className={softBtn}
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