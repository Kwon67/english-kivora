'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import type { Variants } from 'framer-motion'
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

const modalOverlayClass =
  'fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center overflow-y-auto overscroll-contain p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]'

const triggerButtonClass =
  'group relative inline-flex items-center justify-center gap-2 rounded-[13px] border border-brand-dark bg-brand-dark px-5 py-2.5 font-heading text-sm font-bold text-white shadow-[4px_4px_0_var(--color-brand-accent)] transition-[box-shadow,background-color,color] hover:bg-brand-accent hover:text-brand-dark hover:shadow-[6px_6px_0_var(--color-brand-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/30 active:shadow-[2px_2px_0_var(--color-brand-dark)]'

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
  const titleId = useId()

  return (
    <>
      <m.button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerButtonClass}
        whileHover={{ y: -2 }}
        whileTap={{ y: 1, scale: 0.98 }}
      >
        <span className="absolute inset-0 rounded-[13px] border border-white/15 opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-white/25 bg-white/10 transition-colors group-hover:border-brand-dark/30 group-hover:bg-bg-card">
          <Target className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <span className="relative">Qual é meu estudo de hoje?</span>
      </m.button>

      <AnimatePresence>
        {open ? (
          <ModalPortal onClose={() => setOpen(false)} className={modalOverlayClass}>
            <m.div
              className="fixed inset-0 bg-[#1C1915]/20 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onMouseDown={() => setOpen(false)}
            />
            <m.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              variants={modalPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative my-auto max-h-[calc(100svh-2rem)] w-full max-w-3xl overflow-hidden rounded-[13px] border border-brand-dark bg-bg-card shadow-[10px_10px_0_var(--color-brand-dark)] will-change-transform"
            >
              <m.div
                variants={modalItemVariants}
                className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-brand-dark bg-bg-card px-5 py-4 sm:px-6"
              >
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
              </m.div>

              <div className="max-h-[calc(100svh-7rem)] overflow-y-auto">
                <m.div
                  variants={modalContentVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-5 p-5 sm:p-6"
                >
                <m.section variants={modalItemVariants} className="rounded-[13px] border border-brand-dark bg-bg-primary p-4 sm:p-5">
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
                </m.section>

                <m.section variants={modalItemVariants} className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <m.div
                    variants={modalItemVariants}
                    className="rounded-[13px] border border-brand-dark bg-bg-card p-4 sm:p-5"
                  >
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
                  </m.div>

                  <m.div
                    variants={modalItemVariants}
                    className="rounded-[13px] border border-brand-dark bg-bg-card p-4 sm:p-5"
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
                  <m.section variants={modalItemVariants} className="rounded-[13px] border border-brand-dark bg-bg-primary p-4 sm:p-5">
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
                  </m.section>
                ) : null}

                <m.section variants={modalItemVariants} className="rounded-[13px] border border-brand-dark/25 bg-bg-primary p-4">
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
                </m.section>

                <m.div variants={modalItemVariants} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                </m.div>
                </m.div>
              </div>
            </m.div>
          </ModalPortal>
        ) : null}
      </AnimatePresence>
    </>
  )
}
