'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
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
import ModalPortal from '@/components/ui/ModalPortal'
import LearningResourceLink from '@/features/learning-profile/components/LearningResourceLink'
import type {
  LearningProfilePlan,
  LearningProfileRecommendation,
} from '@/features/learning-profile/lib/learningProfile'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  homeCardButton,
  homeIconBox,
  homeIconBoxSm,
  homePrimaryButton,
  homeSecondaryButton,
  homeSmallPillClass,
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
  if (href.includes('/blitz')) return <Zap className={className} strokeWidth={strokeWidth} />
  if (href.includes('/tutor')) return <MessageCircle className={className} strokeWidth={strokeWidth} />
  if (href.includes('youtube.com')) return <Video className={className} strokeWidth={strokeWidth} />
  if (href.includes('/play') || href.includes('/study')) {
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

export default function TodaysStudyButton({ primaryAction, plan }: TodaysStudyButtonProps) {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={homeSecondaryButton}>
        <Target className="h-4 w-4" strokeWidth={2.2} />
        Qual é meu estudo de hoje?
      </button>

      <AnimatePresence>
        {open ? (
          <ModalPortal onClose={() => setOpen(false)}>
            <m.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative my-auto max-h-[calc(100svh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[13px] border border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-brand-dark bg-bg-card px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`h-10 w-10 ${homeIconBox}`}>
                    <Target className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                      Plano inteligente
                    </p>
                    <h2 id={titleId} className="mt-1 font-heading text-lg font-bold text-brand-dark sm:text-xl">
                      Seu estudo de hoje
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-brand-dark bg-bg-card text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <section className="rounded-[13px] border border-brand-dark bg-bg-primary p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className={`h-11 w-11 ${homeIconBox}`}>
                      <ActionIcon href={primaryAction.href} className="h-5 w-5" strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={homeSmallPillClass}>Prioridade agora</span>
                      <h3 className="mt-3 font-heading text-xl font-bold leading-tight text-brand-dark">
                        {primaryAction.title}
                      </h3>
                      <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                        {primaryAction.description}
                      </p>
                      <Link
                        href={primaryAction.href}
                        transitionTypes={navForwardTransitionTypes}
                        prefetch={false}
                        className={`${homePrimaryButton} mt-5 w-full sm:w-auto`}
                        onClick={() => setOpen(false)}
                      >
                        <ActionIcon href={primaryAction.href} className="h-4 w-4" />
                        {primaryAction.label}
                      </Link>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[13px] border border-brand-dark bg-bg-card p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 ${homeIconBoxSm}`}>
                        <ActionIcon
                          href={plan.primaryAction.href}
                          id={plan.primaryAction.id}
                          className="h-4 w-4"
                          strokeWidth={2.4}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className={homeSmallPillClass}>{plan.stage}</span>
                        <h3 className="mt-3 font-heading text-lg font-bold leading-tight text-brand-dark">
                          {plan.headline}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary">
                      {plan.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {plan.focusAreas.map((area) => (
                        <span key={area} className={homeSmallPillClass}>
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[13px] border border-brand-dark bg-bg-card p-4 sm:p-5">
                    <p className="font-heading text-sm font-bold uppercase tracking-widest text-brand-secondary">
                      Faça nesta ordem
                    </p>
                    <ol className="mt-4 space-y-3">
                      {plan.studySteps.map((step, index) => (
                        <li key={step} className="flex gap-3 font-body text-sm leading-relaxed text-brand-secondary">
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
                  <section className="rounded-[13px] border border-brand-dark bg-bg-primary p-4 sm:p-5">
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
                            className="flex h-full items-start gap-3 rounded-[13px] border border-brand-dark bg-bg-card p-3 transition-colors hover:bg-brand-accent/30"
                          >
                            <div className={`h-9 w-9 ${homeIconBoxSm}`}>
                              <ResourceIcon resource={resource} className="h-4 w-4" strokeWidth={2.4} />
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

                <section className="rounded-[13px] border border-brand-dark/25 bg-bg-primary p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" strokeWidth={2.4} />
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-bold text-brand-dark">Por que essa sugestão?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {plan.signals.map((signal) => (
                          <span key={signal} className={homeSmallPillClass}>
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setOpen(false)} className={homeCardButton}>
                    Fechar
                  </button>
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
                </div>
              </div>
            </m.div>
          </ModalPortal>
        ) : null}
      </AnimatePresence>
    </>
  )
}
