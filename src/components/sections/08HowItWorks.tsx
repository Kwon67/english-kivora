'use client'

import {
  BarChart3,
  Bot,
  Check,
  Gamepad2,
  Keyboard,
  Layers3,
  MessageSquareText,
  Mic2,
  Repeat2,
  TimerReset,
  Volume2,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingRadius } from '@/lib/landingStyles'

type JourneyStep = {
  id: string
  number: string
  title: string
  description: string
  icon: LucideIcon
}

const steps: JourneyStep[] = [
  {
    id: 'pratique',
    number: '01',
    title: 'Pratique do seu jeito',
    description: 'Escolha entre flashcards, listening, speaking, digitação e desafios rápidos.',
    icon: Gamepad2,
  },
  {
    id: 'revise',
    number: '02',
    title: 'Revise antes de esquecer',
    description: 'O SRS encontra o que está esfriando e monta uma sessão curta para recuperar.',
    icon: TimerReset,
  },
  {
    id: 'converse',
    number: '03',
    title: 'Converse com contexto',
    description: 'O tutor usa seus objetivos e erros recorrentes para criar uma prática relevante.',
    icon: Bot,
  },
  {
    id: 'evolua',
    number: '04',
    title: 'Enxergue a evolução',
    description: 'Histórico, sequência e pontos de atenção mostram exatamente onde avançar.',
    icon: BarChart3,
  },
]

const capabilities = [
  { label: 'Flashcards', icon: Layers3 },
  { label: 'Blitz', icon: Zap },
  { label: 'Speaking', icon: Mic2 },
  { label: 'Listening', icon: Volume2 },
  { label: 'Digitação', icon: Keyboard },
  { label: 'Tutor IA', icon: MessageSquareText },
]

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0)
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([])
  const manualSelectionUntil = useRef(0)

  useEffect(() => {
    let frame = 0

    const syncActiveStep = () => {
      frame = 0
      if (Date.now() < manualSelectionUntil.current) return
      const activationLine = window.innerHeight * (window.innerWidth < 1024 ? 0.68 : 0.54)
      let nextIndex = 0

      stepRefs.current.forEach((step, index) => {
        if (step && step.getBoundingClientRect().top <= activationLine) {
          nextIndex = index
        }
      })

      setActiveIndex((current) => (current === nextIndex ? current : nextIndex))
    }

    const scheduleSync = () => {
      if (!frame) frame = window.requestAnimationFrame(syncActiveStep)
    }

    syncActiveStep()
    window.addEventListener('scroll', scheduleSync, { passive: true })
    window.addEventListener('resize', scheduleSync)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleSync)
      window.removeEventListener('resize', scheduleSync)
    }
  }, [])

  return (
    <LandingSectionFrame id="como-funciona" band="default" className="scroll-mt-24 py-20 sm:py-24">
      <RevealOnScroll className="mx-auto max-w-6xl">
        <LandingSectionHeader
          badge="Como funciona"
          title="Um ciclo simples. Uma prática que fica mais inteligente."
          titleClassName="max-w-5xl"
          description="Cada ação alimenta a próxima: pratique, revise, converse e acompanhe o que mudou."
        />

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              const active = index === activeIndex
              return (
                <m.div
                  key={step.id}
                  layout="position"
                  transition={{ layout: { type: 'spring', stiffness: 210, damping: 28, mass: 0.9 } }}
                >
                  <button
                    ref={(element) => {
                      stepRefs.current[index] = element
                    }}
                    data-journey-index={index}
                    type="button"
                    aria-expanded={active}
                    aria-controls={`journey-preview-mobile-${index}`}
                    onClick={() => {
                      manualSelectionUntil.current = Date.now() + 900
                      setActiveIndex(index)
                    }}
                    className={`group grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 rounded-[13px] border p-4 text-left transition-[background-color,border-color,transform,box-shadow] duration-200 sm:p-5 ${
                      active
                        ? 'border-brand-dark bg-bg-card shadow-[5px_5px_0_#D5E06B]'
                        : 'border-brand-dark/15 bg-transparent hover:-translate-y-0.5 hover:border-brand-dark/45 hover:bg-bg-card/60'
                    }`}
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-[12px] border ${active ? 'border-brand-dark bg-brand-dark text-white' : 'border-brand-dark/20 bg-bg-card text-brand-secondary'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="font-heading text-base font-bold text-brand-dark sm:text-lg">{step.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-brand-secondary">{step.description}</span>
                    </span>
                    <span className={`font-heading text-xs font-bold ${active ? 'text-brand-dark' : 'text-brand-secondary/60'}`}>{step.number}</span>
                  </button>
                  <div className="lg:hidden">
                    <AnimatePresence initial={false}>
                      {active ? (
                        <m.div
                          key={`mobile-preview-${step.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.34, ease: 'easeOut' },
                          }}
                          className="overflow-hidden"
                        >
                          <m.div
                            initial={{ y: 16, scale: 0.99 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: -8, scale: 0.995 }}
                            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <JourneyPreview
                              id={`journey-preview-mobile-${index}`}
                              activeIndex={activeIndex}
                              compact
                            />
                          </m.div>
                        </m.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </m.div>
              )
            })}
          </div>

          <div className="sticky top-28 hidden lg:block">
            <JourneyPreview id="journey-preview-desktop" activeIndex={activeIndex} />
          </div>
        </div>

        <div className="mt-12 border-t border-brand-dark/15 pt-8">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-brand-secondary">Tudo conectado na mesma rotina</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {capabilities.map((capability) => {
              const Icon = capability.icon
              return (
                <div key={capability.label} className="group flex items-center gap-2.5 rounded-[11px] border border-brand-dark/15 bg-bg-card px-3 py-3 text-sm font-semibold text-brand-secondary transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-dark hover:text-brand-dark">
                  <Icon className="h-4 w-4" />
                  {capability.label}
                </div>
              )
            })}
          </div>
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}

function JourneyPreview({
  id,
  activeIndex,
  compact = false,
}: {
  id: string
  activeIndex: number
  compact?: boolean
}) {
  const reducedMotion = useReducedMotion()
  const active = steps[activeIndex]

  return (
    <div
      id={id}
      className={`mt-3 overflow-hidden ${landingRadius} border border-brand-dark bg-bg-card shadow-[0_20px_60px_rgba(28,25,21,0.10)] lg:mt-0`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-brand-dark/20 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <MacTrafficLights />
          <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-brand-secondary">Kivora · {active.title}</span>
        </div>
        <MacWindowControlButtons />
      </div>
      <div className={`relative overflow-hidden bg-[#E9E5DC] p-4 sm:p-6 ${compact ? 'min-h-[330px]' : 'min-h-[470px]'}`}>
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(213,224,107,0.3),transparent_36%)]" />
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active.id}
            initial={{ opacity: 0, y: 14, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10, scale: 0.995 }}
            transition={{ duration: reducedMotion ? 0 : 0.52, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {active.id === 'pratique' ? <PracticePreview /> : null}
            {active.id === 'revise' ? <ReviewPreview /> : null}
            {active.id === 'converse' ? <ConversationPreview /> : null}
            {active.id === 'evolua' ? <ProgressPreview /> : null}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function PreviewHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-brand-secondary">{eyebrow}</p>
      <h3 className="mt-2 font-section text-2xl font-semibold text-brand-dark sm:text-3xl">{title}</h3>
    </div>
  )
}

function PracticePreview() {
  return (
    <>
      <PreviewHeading eyebrow="Missão de hoje" title="Como você quer praticar?" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { label: 'Blitz', detail: 'Respostas rápidas', icon: Zap },
          { label: 'Speaking', detail: 'Fale e receba feedback', icon: Mic2 },
          { label: 'Listening', detail: 'Treine o ouvido', icon: Volume2 },
          { label: 'Flashcards', detail: 'Ative vocabulário', icon: Layers3 },
        ].map((mode, index) => {
          const Icon = mode.icon
          return (
            <div key={mode.label} className={`rounded-[12px] border border-brand-dark/25 p-4 ${index === 1 ? 'bg-brand-accent shadow-[3px_3px_0_#1C1915]' : 'bg-bg-card'}`}>
              <Icon className="h-5 w-5" />
              <p className="mt-5 font-heading text-sm font-bold">{mode.label}</p>
              <p className="mt-1 text-[11px] text-brand-secondary">{mode.detail}</p>
            </div>
          )
        })}
      </div>
    </>
  )
}

function ReviewPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Revisão inteligente" title="O que precisa voltar agora" />
      <div className="mt-6 space-y-3">
        {[
          ['to figure out', 'Quase esquecendo', 'Agora'],
          ['schedule', 'Precisa de contexto', 'Hoje'],
          ['although', 'Ganhando força', 'Amanhã'],
        ].map(([word, status, due], index) => (
          <div key={word} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[12px] border border-brand-dark/20 bg-bg-card p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-[9px] border border-brand-dark/20 ${index === 0 ? 'bg-brand-accent' : 'bg-bg-primary'}`}>
              <Repeat2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-heading text-sm font-bold">{word}</span>
              <span className="mt-0.5 block text-[10px] text-brand-secondary">{status}</span>
            </span>
            <span className="rounded-full bg-bg-primary px-2 py-1 text-[9px] font-bold uppercase text-brand-secondary">{due}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function ConversationPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Tutor contextual" title="Uma conversa que vira prática" />
      <div className="mt-6 space-y-3">
        <div className="max-w-[85%] rounded-[12px] bg-brand-dark px-4 py-3 text-sm leading-6 text-white">
          What would make you feel more confident in your next meeting?
        </div>
        <div className="ml-auto max-w-[85%] rounded-[12px] border border-brand-dark/20 bg-bg-card px-4 py-3 text-sm leading-6">
          I want explain my ideas without stop too much.
        </div>
        <div className="max-w-[92%] rounded-[12px] border border-brand-dark/25 bg-brand-accent px-4 py-3 text-sm leading-6">
          <strong>I want to explain my ideas without stopping too often.</strong>
          <p className="mt-1 text-xs opacity-70">Vamos praticar essa estrutura com uma objeção real.</p>
        </div>
      </div>
    </>
  )
}

function ProgressPreview() {
  return (
    <>
      <PreviewHeading eyebrow="Seu progresso" title="Clareza para decidir o próximo foco" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          ['Sequência', '12 dias'],
          ['Missões', '28 feitas'],
          ['Ponto forte', 'Listening'],
          ['Próximo foco', 'Speaking'],
        ].map(([label, value], index) => (
          <div key={label} className={`rounded-[12px] border border-brand-dark/20 p-4 ${index === 3 ? 'bg-brand-accent' : 'bg-bg-card'}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-secondary">{label}</p>
            <p className="mt-4 font-heading text-lg font-bold text-brand-dark">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-[12px] border border-brand-dark/20 bg-bg-card p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-brand-dark text-white"><Check className="h-4 w-4" /></span>
        <div>
          <p className="font-heading text-sm font-bold">Plano ajustado</p>
          <p className="mt-1 text-[10px] text-brand-secondary">Mais duas práticas de speaking nesta semana.</p>
        </div>
      </div>
    </>
  )
}
