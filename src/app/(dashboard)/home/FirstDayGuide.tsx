'use client'

import { m } from 'motion/react'
import Link from 'next/link'
import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { landingRadius } from '@/lib/landingStyles'
import {
  homeCardClass,
  homeNestedCardClass,
  homePrimaryButton,
  homeSectionTitleClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'
import type { FirstDayPlan } from '@/features/onboarding/lib/firstDayPlan'

type FirstDayGuideProps = {
  plan: FirstDayPlan
  firstName?: string | null
}

/**
 * Um card, uma ação. Os passos já feitos e os travados continuam visíveis, mas recuados, para o
 * usuário enxergar que existe um fim — sem que eles disputem atenção com o passo atual.
 */
/**
 * homeIconBoxSm já traz `bg-brand-accent` embutido, e acrescentar `bg-bg-primary` depois não
 * sobrescreve nada: as duas classes têm a mesma especificidade e o Tailwind emite a accent por
 * último, então o passo travado saía destacado em lime. Aqui a caixa é montada sem fundo e cada
 * estado escolhe o seu — assim só existe uma classe de fundo por vez.
 */
const stepIconBoxClass = `h-9 w-9 p-1.5 box-border flex shrink-0 items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark text-brand-dark`

/** Usernames são gravados como o usuário digitou ("armando"), e abrem a frase do título. */
function toDisplayName(name: string | null | undefined): string | null {
  const trimmed = name?.trim()
  if (!trimmed) return null
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export default function FirstDayGuide({ plan, firstName }: FirstDayGuideProps) {
  const { steps, nextStep, doneCount, totalMinutes } = plan
  const progress = (doneCount / steps.length) * 100
  const displayName = toDisplayName(firstName)

  return (
    <m.section
      data-testid="first-day-guide"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`${homeCardClass} home-frosted-surface p-6 sm:p-8`}
    >
      <SectionBadge label="Primeiro dia" />

      <h2 className={`mt-4 ${homeSectionTitleClass}`}>
        {displayName ? `${displayName}, seus` : 'Seus'} primeiros {totalMinutes} minutos
      </h2>
      <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
        Três passos curtos, um de cada vez. No fim do terceiro você já vai ter sentido o método
        funcionando — e não precisa decidir mais nada hoje.
      </p>

      <div className="mt-6" aria-hidden="true">
        <div className={`h-2 w-full overflow-hidden ${homeNestedCardClass} p-0`}>
          <m.div
            className="h-full bg-brand-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      <p className="mt-2 font-body text-xs font-semibold text-brand-secondary">
        {doneCount} de {steps.length} concluídos
      </p>

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => {
          const isCurrent = nextStep?.id === step.id

          return (
            <m.li
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: step.done || step.locked ? 0.55 : 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
              className={`${homeNestedCardClass} p-4 sm:p-5 ${isCurrent ? 'bg-bg-primary' : ''}`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <span className={`${stepIconBoxClass} ${step.done ? 'bg-brand-accent' : 'bg-bg-primary'}`}>
                  {step.done ? (
                    <m.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      className="flex"
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </m.span>
                  ) : step.locked ? (
                    <Lock className="h-3.5 w-3.5 text-brand-secondary" strokeWidth={2.4} />
                  ) : (
                    <span className="font-heading text-xs font-bold text-brand-dark">{index + 1}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-heading text-base font-bold text-brand-dark ${step.done ? 'line-through decoration-brand-secondary/60' : ''}`}
                    >
                      {step.title}
                    </h3>
                    <span className={homeSmallPillClass}>{step.minutes} min</span>
                  </div>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-brand-secondary">
                    {step.description}
                  </p>

                  {isCurrent ? (
                    <m.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                      className="mt-4"
                    >
                      <Link
                        href={step.href}
                        transitionTypes={navForwardTransitionTypes}
                        prefetch={false}
                        className={homePrimaryButton}
                        data-testid="first-day-cta"
                      >
                        {step.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </m.div>
                  ) : null}
                </div>
              </div>
            </m.li>
          )
        })}
      </ol>

      <p className="mt-5 flex items-start gap-2 font-body text-xs leading-relaxed text-brand-secondary">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        As frases que você vir hoje voltam em 1 e em 10 minutos. Isso é de propósito: lembrar
        pouco antes de esquecer é o que fixa de verdade.
      </p>
    </m.section>
  )
}
