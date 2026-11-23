'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useEntrance } from '@/components/motion/useEntrance'
import Link from 'next/link'
import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import SpotIllustration from '@/components/illustrations/SpotIllustration'
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

function revealCheck(element: HTMLSpanElement | null) {
  if (!element) return
  const media = gsap.matchMedia()
  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from(element, { scale: 0, rotation: -30, duration: 0.52, ease: 'elastic.out(1,0.55)' })
  })
  return () => media.revert()
}

export default function FirstDayGuide({ plan, firstName }: FirstDayGuideProps) {
  const { steps, nextStep, doneCount, totalMinutes } = plan
  const progress = (doneCount / steps.length) * 100
  const displayName = toDisplayName(firstName)

  const scope = useRef<HTMLElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const enterCta = useEntrance(6, 0, 0.35, 0.1)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(scope.current, { opacity: 0, y: 12, duration: 0.45, ease: 'expo.out', clearProps: 'opacity,transform' })
      gsap.from('ol > li', { opacity: 0, y: 10, duration: 0.4, stagger: 0.08, ease: 'expo.out' })
    }, scope)
    return () => media.revert()
  }, { scope })
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add({ full: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
      gsap.to(fill.current, { width: `${progress}%`, duration: context.conditions?.full ? 0.6 : 0, ease: 'expo.out' })
    })
    return () => media.revert()
  }, { scope, dependencies: [progress], revertOnUpdate: true })

  return (
    <section ref={scope}
      data-testid="first-day-guide"

      className={`${homeCardClass} home-frosted-surface p-6 sm:p-8`}
    >
      <div className="flex items-center justify-between gap-3">
        <SectionBadge label="Primeiro dia" />
        <SpotIllustration motif="sunflower" className="h-9 w-9 shrink-0" />
      </div>

      <h2 className={`mt-4 ${homeSectionTitleClass}`}>
        {displayName ? `${displayName}, seus` : 'Seus'} primeiros {totalMinutes} minutos
      </h2>
      <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
        Três passos curtos, um de cada vez. No fim do terceiro você já vai ter sentido o método
        funcionando — e não precisa decidir mais nada hoje.
      </p>

      <div className="mt-6" aria-hidden="true">
        <div className={`h-2 w-full overflow-hidden ${homeNestedCardClass} p-0`}>
          <div ref={fill} style={{ width: 0 }} className="h-full bg-brand-accent" />
        </div>
      </div>
      <p className="mt-2 font-body text-xs font-semibold text-brand-secondary">
        {doneCount} de {steps.length} concluídos
      </p>

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => {
          const isCurrent = nextStep?.id === step.id

          return (
            <li key={step.id} style={{ opacity: step.done || step.locked ? 0.55 : 1 }}
              className={`${homeNestedCardClass} p-4 sm:p-5 ${isCurrent ? 'bg-bg-primary' : ''}`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <span className={`${stepIconBoxClass} ${step.done ? 'bg-brand-accent' : 'bg-bg-primary'}`}>
                  {step.done ? (
                    <span ref={revealCheck} className="flex">
                      <Check className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                  ) : step.locked ? (
                    <Lock className="h-3.5 w-3.5 text-brand-secondary" strokeWidth={1.5} />
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
                    <div ref={enterCta} className="mt-4">
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
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-5 flex items-start gap-2 font-body text-xs leading-relaxed text-brand-secondary">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        As frases que você vir hoje voltam em 1 e em 10 minutos. Isso é de propósito: lembrar
        pouco antes de esquecer é o que fixa de verdade.
      </p>
    </section>
  )
}
