'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { Variants } from 'motion/react'
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
import { Dialog, DialogContent, DialogTitle } from '@/components/shadcn/dialog'
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
  homeSmallPillClass,
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

/* Deliberately quiet: this opens an explainer, it is not a destination. A filled slab here
   outweighed the hero's real CTA and pulled the eye to the wrong control. */
const triggerButtonClass =
  'group inline-flex items-center gap-2 font-body text-sm font-semibold text-brand-secondary underline decoration-brand-secondary/40 underline-offset-4 transition-colors hover:text-brand-dark hover:decoration-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/30'

const modalPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 26,
    scale: 0.96,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 34,
      mass: 0.9,
      when: 'beforeChildren',
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1],
    },
  },
}

const modalItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 30,
    },
  },
}

const modalContentVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.08,
    },
  },
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

  return (
    <>
      <m.button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerButtonClass}
        whileTap={{ scale: 0.98 }}
      >
        <Target className="h-4 w-4 shrink-0" strokeWidth={2.4} />
        <span>Ver meu plano de estudo</span>
      </m.button>

      {/*
        Era ModalPortal com DOIS fundos: o próprio (via onClose) mais um m.div extra desenhando
        outro backdrop escurecido por cima só para ter a animação de fade — as duas camadas de
        "clique fora fecha" competindo. Dialog do shadcn traz overlay, Esc, foco travado e
        devolução de foco de graça, então as duas camadas viraram uma só (a do próprio Radix).

        A animação elaborada do painel (blur + escala + stagger dos filhos via
        `when: 'beforeChildren'`) continua em Motion, dentro do DialogContent, porque orquestra
        a revelação escalonada do conteúdo — não é só uma entrada de painel, é o que dispara
        a sequência de todo o resto. Trocar por Dialog não tenta assumir essa parte.
      */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl gap-0 overflow-hidden rounded-container border border-brand-dark bg-bg-card p-0 shadow-[10px_10px_0_var(--color-brand-dark)] ring-0"
        >
          <AnimatePresence>
            {open ? (
            <m.div
              variants={modalPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-h-[calc(100svh-2rem)] will-change-transform"
            >
              <m.div
                variants={modalItemVariants}
                className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-brand-dark bg-bg-card px-5 py-4 sm:px-6"
              >
                {/* The title has to hold one line at 375px: when it wrapped, the two-line text
                    block grew taller than the icon and `items-center` left the icon floating
                    against the gap between kicker and title. */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`h-10 w-10 shrink-0 ${homeIconBox}`}>
                    <Target className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
                      Plano inteligente
                    </p>
                    <DialogTitle className="mt-0.5 truncate font-heading text-base font-bold text-brand-dark sm:text-xl">
                      Seu estudo de hoje
                    </DialogTitle>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-brand-dark bg-bg-card text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </m.div>

              <div className="max-h-[calc(100svh-7rem)] overflow-y-auto">
                <m.div
                  variants={modalContentVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-5 p-5 sm:p-6"
                >
                {/* Icon and pill share one row; everything below runs flush to the card edge.
                    Nesting the copy beside the icon cost 77px of a 301px card on mobile and
                    squeezed the CTA until its label broke across two lines. */}
                <m.section variants={modalItemVariants} className="rounded-container border border-brand-dark bg-bg-primary p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 shrink-0 ${homeIconBox}`}>
                      <ActionIcon href={primaryAction.href} className="h-5 w-5" strokeWidth={2.4} />
                    </div>
                    <span className={homeSmallPillClass}>Prioridade agora</span>
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
                    <ActionIcon href={primaryAction.href} className="h-4 w-4 shrink-0" />
                    {primaryAction.label}
                  </Link>
                </m.section>

                <m.section variants={modalItemVariants} className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <m.div
                    variants={modalItemVariants}
                    className="rounded-control border border-brand-dark bg-bg-card p-4 sm:p-5"
                  >
                    {/* The heading used to sit in a column beside the icon while the summary
                        below started at the card edge, so the two left edges disagreed. */}
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 shrink-0 ${homeIconBoxSm}`}>
                        <ActionIcon
                          href={plan.primaryAction.href}
                          id={plan.primaryAction.id}
                          className="h-4 w-4"
                          strokeWidth={2.4}
                        />
                      </div>
                      <span className={homeSmallPillClass}>{getLearningFocusLabel(plan.stage)}</span>
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
                  </m.div>

                  <m.div
                    variants={modalItemVariants}
                    className="rounded-control border border-brand-dark bg-bg-card p-4 sm:p-5"
                  >
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
                  </m.div>
                </m.section>

                {plan.resources.length > 0 ? (
                  <m.section variants={modalItemVariants} className="rounded-container border border-brand-dark bg-bg-primary p-4 sm:p-5">
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
                            className="flex h-full items-start gap-3 rounded-control border border-brand-dark bg-bg-card p-3 transition-colors hover:bg-brand-accent/30"
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
                  </m.section>
                ) : null}

                <m.section variants={modalItemVariants} className="rounded-control border border-brand-dark/25 bg-bg-primary p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" strokeWidth={2.4} />
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-bold text-brand-dark">Por que essa sugestão?</p>
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
                </m.section>

                {/* The footer link repeats the priority CTA whenever the plan resolves to the
                    same place, which is the common case — then "Fechar" is all that is left to do. */}
                <m.div variants={modalItemVariants} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setOpen(false)} className={homeCardButton}>
                    Fechar
                  </button>
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
                </m.div>
                </m.div>
              </div>
            </m.div>
            ) : null}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
