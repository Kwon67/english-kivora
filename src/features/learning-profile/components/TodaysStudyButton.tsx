'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  MessageCircle,
  Play,
  Target,
  Video,
  X,
  Zap,
} from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog'
import LearningResourceLink from '@/features/learning-profile/components/LearningResourceLink'
import {
  getLearningFocusLabel,
  type LearningProfilePlan,
  type LearningProfileRecommendation,
} from '@/features/learning-profile/lib/learningProfile'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  homeCardButton,
  homeIconBox,
  homeIconBoxSm,
  homePrimaryButton,
  homeSecondaryButton,
  homeWrapPillClass,
} from '@/lib/homeStyles'

type TodayPrimaryAction = {
  href: string
  label: string
  title: string
  description: string
}

type TodaysStudyButtonProps = {
  primaryAction: TodayPrimaryAction
  plan: LearningProfilePlan
}

const triggerButtonClass =
  'inline-flex items-center gap-2 font-body text-sm font-semibold text-brand-secondary underline decoration-brand-secondary/40 underline-offset-4 transition-colors hover:text-primary'

function ActionIcon({
  href,
  id,
  className,
  strokeWidth,
}: {
  href: string
  id?: string
  className: string
  strokeWidth?: number
}) {
  if (href.includes('/review') || id === 'review' || id === 'problem-words') {
    return <Brain className={className} strokeWidth={strokeWidth} />
  }
  if (href.includes('/blitz'))
    return <Zap className={className} strokeWidth={strokeWidth} />
  if (href.includes('/tutor'))
    return <MessageCircle className={className} strokeWidth={strokeWidth} />
  if (href.includes('youtube.com'))
    return <Video className={className} strokeWidth={strokeWidth} />
  if (href.includes('/play') || href.includes('#trilha')) {
    return <BookOpen className={className} strokeWidth={strokeWidth} />
  }
  return <Target className={className} strokeWidth={strokeWidth} />
}

function ResourceIcon({
  resource,
  className,
  strokeWidth,
}: {
  resource: LearningProfileRecommendation
  className: string
  strokeWidth?: number
}) {
  if (resource.kind === 'video' || resource.href.includes('youtube.com')) {
    return <Video className={className} strokeWidth={strokeWidth} />
  }
  if (resource.kind === 'shadowing' || resource.kind === 'listening') {
    return <Play className={className} strokeWidth={strokeWidth} />
  }
  if (resource.href.includes('/tutor')) {
    return <MessageCircle className={className} strokeWidth={strokeWidth} />
  }
  return <BookOpen className={className} strokeWidth={strokeWidth} />
}

export default function TodaysStudyButton({
  primaryAction,
  plan,
}: TodaysStudyButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={triggerButtonClass}>
          <Target
            className="h-4 w-4 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          Ver meu plano de estudo
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="learning-plan-dialog flex max-w-[min(48rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden border border-brand-border p-0 sm:max-w-[min(48rem,calc(100%-2rem))]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-border px-4 py-3 sm:px-6">
          <DialogTitle className="min-w-0 font-heading text-lg font-semibold">
            Seu estudo de hoje
          </DialogTitle>
          <DialogClose
            className="learning-icon-link"
            aria-label="Fechar plano de estudo"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogClose>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <div className="space-y-4 p-4 sm:p-6">
            <section className="rounded-container border border-brand-border bg-surface-container-low p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 shrink-0 ${homeIconBox}`}>
                  <ActionIcon
                    href={primaryAction.href}
                    className="h-5 w-5"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="tone-chip" data-tone="streak">
                  Prioridade agora
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold leading-tight text-brand-dark sm:text-xl">
                {primaryAction.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                {primaryAction.description}
              </p>
              <Link
                href={primaryAction.href}
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className={`${homePrimaryButton} mt-5 w-full text-base sm:w-auto sm:text-lg`}
                onClick={() => setOpen(false)}
              >
                <ActionIcon
                  href={primaryAction.href}
                  className="h-4 w-4 shrink-0"
                />
                {primaryAction.label}
              </Link>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="home-frosted-subtle rounded-control border border-brand-dark p-4 sm:p-5">
                {/* The heading used to sit in a column beside the icon while the summary
                        below started at the card edge, so the two left edges disagreed. */}
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 shrink-0 ${homeIconBoxSm}`}>
                    <ActionIcon
                      href={plan.primaryAction.href}
                      id={plan.primaryAction.id}
                      className="h-4 w-4"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="tone-chip" data-tone="tutor">
                    {getLearningFocusLabel(plan.stage)}
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold leading-tight text-brand-dark">
                  {plan.headline}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                  {plan.summary}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {plan.focusAreas.map((area) => (
                    <span key={area} className={homeWrapPillClass}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="home-frosted-subtle rounded-control border border-brand-dark p-4 sm:p-5">
                <p className="font-heading text-sm font-bold uppercase tracking-widest text-brand-secondary">
                  Faça nesta ordem
                </p>
                <ol className="mt-4 space-y-3">
                  {plan.studySteps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-3 font-body text-sm leading-relaxed text-brand-secondary"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-dark bg-brand-accent font-heading text-xs font-bold text-brand-dark">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {plan.resources.length > 0 ? (
              <section className="rounded-container border border-brand-dark bg-bg-primary p-4 sm:p-5">
                <p className="font-heading text-sm font-bold uppercase tracking-widest text-brand-secondary">
                  Conteúdo recomendado
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {plan.resources.map((resource) => {
                    return (
                      <LearningResourceLink
                        key={resource.id}
                        resource={resource}
                        stage={plan.stage}
                        level={plan.level}
                        className="home-frosted-subtle flex h-full items-start gap-3 rounded-control border border-brand-dark p-3 transition-colors hover:bg-brand-accent/30"
                      >
                        <div className={`h-9 w-9 ${homeIconBoxSm}`}>
                          <ResourceIcon
                            resource={resource}
                            className="h-4 w-4"
                            strokeWidth={1.5}
                          />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block font-heading text-sm font-bold text-brand-dark">
                            {resource.title}
                          </span>
                          <span className="mt-1 block font-body text-xs leading-relaxed text-brand-secondary">
                            {resource.description}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-brand-secondary" />
                      </LearningResourceLink>
                    )
                  })}
                </div>
              </section>
            ) : null}

            <section className="rounded-control border border-brand-dark/25 bg-bg-primary p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark"
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold text-brand-dark">
                    Por que essa sugestão?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* Signals are full sentences and wrap on mobile — wrap-safe radius. */}
                    {plan.signals.map((signal) => (
                      <span key={signal} className={homeWrapPillClass}>
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* The footer link repeats the priority CTA whenever the plan resolves to the
                    same place, which is the common case — then "Fechar" is all that is left to do. */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <DialogClose className={homeCardButton}>Fechar</DialogClose>
              {plan.primaryAction.href !== primaryAction.href ? (
                <Link
                  href={plan.primaryAction.href}
                  transitionTypes={navForwardTransitionTypes}
                  prefetch={false}
                  className={homeSecondaryButton}
                  onClick={() => setOpen(false)}
                >
                  <ActionIcon
                    href={plan.primaryAction.href}
                    id={plan.primaryAction.id}
                    className="h-4 w-4"
                  />
                  {plan.primaryAction.actionLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
