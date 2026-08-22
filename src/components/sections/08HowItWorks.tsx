'use client'

import {
  BarChart3,
  Bot,
  Check,
  Gamepad2,
  Headphones,
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
import { AnimatePresence, m } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingFrostedSubtle, landingFrostedSurface, landingRadiusLg } from '@/lib/landingStyles'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

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

/**
 * Each mode carries what it actually trains — a bare label list said six names but
 * nothing about why any of them is worth the tap. Headphones rather than a speaker
 * for Listening, so it does not read as a near-duplicate of Speaking's microphone.
 */
const capabilities = [
  { label: 'Flashcards', detail: 'Ative vocabulário', icon: Layers3 },
  { label: 'Blitz', detail: 'Partidas rápidas', icon: Zap },
  { label: 'Speaking', detail: 'Fale com feedback', icon: Mic2 },
  { label: 'Listening', detail: 'Treine o ouvido', icon: Headphones },
  { label: 'Digitação', detail: 'Escreva de memória', icon: Keyboard },
  { label: 'Tutor IA', detail: 'Converse com contexto', icon: MessageSquareText },
]

/** Where down the viewport a step is considered "the one you're reading". */
const FOCUS_LINE_RATIO = 0.42
/** A rival step must be at least this much closer to the focus line before we switch. */
const HYSTERESIS_PX = 28
/** Above this scroll speed we stop switching and wait for the flick to end. */
const FLING_PX_PER_MS = 1.1
/** How long the scroll must be calm before we re-evaluate after a flick. */
const SETTLE_MS = 140

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const activeIndexRef = useRef(0)
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([])
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)
  const previousCardRects = useRef<DOMRect[]>([])
  const cardAnimations = useRef<Animation[]>([])
  const manualSelectionUntil = useRef(0)
  const reducedMotion = useHydratedReducedMotion()

  const activateStep = useCallback((index: number) => {
    if (index === activeIndexRef.current) return

    setDirection(index > activeIndexRef.current ? 1 : -1)
    // Capture positions once before React changes the layout. The movement after
    // the expansion is then animated with transforms instead of height updates.
    previousCardRects.current = cardRefs.current.map((card) => card?.getBoundingClientRect() ?? new DOMRect())
    activeIndexRef.current = index
    setActiveIndex(index)
  }, [])

  useLayoutEffect(() => {
    const previousRects = previousCardRects.current
    if (!previousRects.length || reducedMotion) return

    cardAnimations.current.forEach((animation) => animation.cancel())
    cardAnimations.current = cardRefs.current.flatMap((card, index) => {
      if (!card) return []

      const offsetY = previousRects[index].top - card.getBoundingClientRect().top
      if (Math.abs(offsetY) < 1) return []

      // The layout still has to reconcile the preview changing height on mobile,
      // but a short lateral sweep makes the hand-off read as moving through a
      // sequence instead of the cards simply bouncing up and down.
      const sweepX = direction * -14

      return card.animate(
        [
          {
            opacity: 0.76,
            transform: `translate3d(${sweepX}px, ${offsetY}px, 0) scale(0.985)`,
          },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        ],
        { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      )
    })
    previousCardRects.current = []
  }, [activeIndex, direction, reducedMotion])

  /**
   * Picks the step nearest a focus line instead of the one clipping a band.
   *
   * The previous version used an IntersectionObserver with `rootMargin
   * -58%/-41%`, which leaves an activation band 1% of the viewport tall — 9px
   * against cards 202-226px tall. A scroll flick jumps hundreds of pixels per
   * frame, so that band was routinely crossed between frames: the callback
   * either missed it or reported several cards at once, and the old
   * `entries.forEach(activateStep)` kept whichever entry came last (observer
   * entry order is not document order), landing on the wrong step.
   *
   * Nearest-wins can't pick the wrong card. Hysteresis stops two near-equidistant
   * cards from flickering, and the fling gate stops a fast scroll from firing
   * four transitions whose 650ms animations then cancel each other.
   */
  useEffect(() => {
    if (reducedMotion) return

    let frame = 0
    let settleTimer = 0
    let lastY = window.scrollY
    let lastT = performance.now()

    /**
     * `settled` runs when scrolling has stopped. Hysteresis exists to stop the
     * highlight flickering between two steps *while* the page is moving; applying
     * it to a settled reading would strand the section on the wrong step, because
     * no further scroll event would ever arrive to correct it.
     */
    const evaluate = (settled = false) => {
      frame = 0
      if (Date.now() < manualSelectionUntil.current) return

      const list = listRef.current
      if (!list) return

      const rect = list.getBoundingClientRect()
      if (rect.height <= 0) return

      // Progress of the step list past the focus line: 0 when its top arrives,
      // 1 when its bottom leaves. Mapping that to the step count guarantees every
      // step gets an equal slice of scroll — position-based picking could not,
      // because this section only affords ~255px of travel for a ~550px list, so
      // steps 3 and 4 never reached the focus line at all.
      const focusY = window.innerHeight * FOCUS_LINE_RATIO
      const progress = (focusY - rect.top) / rect.height
      const slice = 1 / steps.length

      // Bias by half a step so a step owns the scroll around its own centre, and
      // require the crossing to clear a hysteresis margin before committing.
      const raw = progress / slice - 0.5
      const nearest = Math.round(raw)
      const target = Math.min(steps.length - 1, Math.max(0, nearest))
      if (target === activeIndexRef.current) return

      if (!settled) {
        const distanceIntoNext = Math.abs(raw - nearest)
        const margin = HYSTERESIS_PX / rect.height / slice
        if (distanceIntoNext > 0.5 - margin) return
      }

      activateStep(target)
    }

    const onScroll = () => {
      const now = performance.now()
      const velocity = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastT)
      lastY = window.scrollY
      lastT = now

      // Always schedule a settle pass, so wherever the scroll comes to rest the
      // section commits to the step that actually belongs to that position.
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => evaluate(true), SETTLE_MS)

      if (velocity > FLING_PX_PER_MS) {
        // Mid-flick: hold the current step so a fast scroll resolves to one clean
        // transition at the end instead of burning through all four on the way.
        return
      }

      if (!frame) frame = requestAnimationFrame(() => evaluate(false))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    evaluate(true)

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
      window.clearTimeout(settleTimer)
    }
  }, [activateStep, reducedMotion])

  const selectStep = useCallback(
    (index: number) => {
      manualSelectionUntil.current = Date.now() + 1200
      activateStep(index)
    },
    [activateStep],
  )

  /** Arrow keys move between steps once the list has focus. */
  const handleStepKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
      if (!delta) return
      const next = index + delta
      if (next < 0 || next >= steps.length) return
      event.preventDefault()
      selectStep(next)
      stepRefs.current[next]?.focus()
    },
    [selectStep],
  )

  return (
    <LandingSectionFrame id="como-funciona" band="default" className="scroll-mt-24 py-20 sm:py-24">
      <RevealOnScroll className="mx-auto max-w-6xl">
        <LandingSectionHeader
          badge="Como funciona"
          title="Um ciclo simples. Uma prática que fica mais inteligente."
          titleClassName="max-w-5xl"
          description="Cada ação alimenta a próxima: pratique, revise, converse e acompanhe o que mudou."
        />

        <div className="mt-12 grid items-start gap-6 md:grid-cols-[0.82fr_1.18fr] md:gap-8 lg:gap-10">
          <div ref={listRef} className="relative space-y-3 md:pl-6">
            {/* Progress rail: a thumb that glides to the active card tells you the
                section is advancing with you, instead of the panel just swapping. */}
            <div aria-hidden="true" className="absolute bottom-1 left-0 top-1 hidden w-[3px] overflow-hidden rounded-full bg-brand-dark/12 md:block">
              <m.div
                className="w-full rounded-full bg-brand-accent"
                animate={{
                  height: `${100 / steps.length}%`,
                  y: `${activeIndex * 100}%`,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 260, damping: 30, mass: 0.7 }
                }
              />
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon
              const active = index === activeIndex
              return (
                <div
                  key={step.id}
                  ref={(element) => {
                    cardRefs.current[index] = element
                  }}
                  className="[will-change:transform,opacity]"
                >
                  <m.button
                    ref={(element) => {
                      stepRefs.current[index] = element
                    }}
                    data-journey-index={index}
                    type="button"
                    aria-expanded={active}
                    aria-controls={`journey-preview-mobile-${index}`}
                    onClick={() => selectStep(index)}
                    onKeyDown={(event) => handleStepKeyDown(event, index)}
                    animate={{ x: active ? 6 : 0 }}
                    whileHover={reducedMotion || active ? undefined : { x: 4 }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 320, damping: 30, mass: 0.6 }
                    }
                    className={`group grid w-full grid-cols-[auto_1fr_auto] items-start gap-4 rounded-[20px] border p-4 text-left transition-[background-color,border-color,transform,box-shadow,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-5 ${
                      active
                        ? `border-brand-dark opacity-100 shadow-[5px_5px_0_#D5E06B] ${landingFrostedSurface}`
                        : `border-brand-dark/15 opacity-70 hover:border-brand-dark/45 hover:opacity-100 ${landingFrostedSubtle}`
                    }`}
                  >
                    <m.span
                      animate={{ rotate: active ? -4 : 0, scale: active ? 1.05 : 1 }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 360, damping: 24, mass: 0.55 }
                      }
                      className={`flex h-11 w-11 items-center justify-center rounded-[13px] border transition-[background-color,border-color,color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        active
                          ? 'border-brand-dark bg-brand-dark text-white'
                          : 'border-brand-dark/20 bg-bg-card text-brand-secondary'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </m.span>
                    <span>
                      <span className="font-heading text-base font-bold text-brand-dark sm:text-lg">{step.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-brand-secondary">{step.description}</span>
                    </span>
                    <span className={`font-heading text-xs font-bold ${active ? 'text-brand-dark' : 'text-brand-secondary/60'}`}>{step.number}</span>
                  </m.button>
                  <div className="md:hidden">
                    {active ? (
                      <m.div
                        key={`mobile-preview-${step.id}`}
                        initial={
                          reducedMotion
                            ? false
                            : {
                                clipPath: direction > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
                                opacity: 0,
                                scale: 0.99,
                                x: 18 * direction,
                              }
                        }
                        animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.52, ease: [0.16, 1, 0.3, 1] }}
                        className="[contain:layout_paint] [overflow-anchor:none] [will-change:clip-path,opacity,transform]"
                      >
                        <JourneyPreview
                          id={`journey-preview-mobile-${index}`}
                          activeIndex={activeIndex}
                          compact
                        />
                      </m.div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="sticky top-28 hidden md:block">
            <JourneyPreview id="journey-preview-desktop" activeIndex={activeIndex} direction={direction} />
          </div>
        </div>

        <div className="mt-12 border-t border-brand-dark/15 pt-8">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px] border border-brand-dark bg-brand-accent" />
            <p className="font-heading text-2xs font-bold uppercase tracking-[0.18em] text-brand-dark">
              Tudo conectado na mesma rotina
            </p>
            <span aria-hidden="true" className="h-px flex-1 bg-brand-dark/15" />
          </div>

          {/* Was a flat row of grey labels — the one element in the section that ignored the
              brand's offset-shadow language. Each mode now gets an icon plate that fills with
              lime on hover, plus what it trains, and the row staggers in on first view. */}
          <ul className="mt-5 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-3 lg:grid-cols-6">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon
              return (
                <m.li
                  key={capability.label}
                  initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.45,
                    delay: reducedMotion ? 0 : index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`group flex flex-col gap-3 rounded-[13px] border border-brand-dark/15 p-3.5 transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand-dark hover:shadow-[4px_4px_0_var(--color-brand-accent)] ${landingFrostedSubtle}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-brand-dark/15 bg-bg-primary text-brand-dark transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:border-brand-dark group-hover:bg-brand-accent">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-heading text-sm font-bold text-brand-dark">
                      {capability.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-brand-secondary">
                      {capability.detail}
                    </span>
                  </span>
                </m.li>
              )
            })}
          </ul>
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}

function JourneyPreview({
  id,
  activeIndex,
  direction = 1,
  compact = false,
}: {
  id: string
  activeIndex: number
  direction?: number
  compact?: boolean
}) {
  const reducedMotion = useHydratedReducedMotion()
  const active = steps[activeIndex]
  const preview = (
    <>
      {active.id === 'pratique' ? <PracticePreview /> : null}
      {active.id === 'revise' ? <ReviewPreview /> : null}
      {active.id === 'converse' ? <ConversationPreview /> : null}
      {active.id === 'evolua' ? <ProgressPreview /> : null}
    </>
  )

  return (
    <div
      id={id}
      className={`mt-3 overflow-hidden ${landingRadiusLg} ${landingFrostedSurface} border border-brand-dark lg:mt-0`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-brand-dark/20 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <MacTrafficLights />
          <span className="font-heading text-2xs font-bold uppercase tracking-wider text-brand-secondary">Kivora · {active.title}</span>
        </div>
        <MacWindowControlButtons />
      </div>
      <div className={`relative overflow-hidden bg-bg-primary/30 p-4 sm:p-6 ${compact ? 'min-h-[330px]' : 'min-h-[470px]'}`}>
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(213,224,107,0.10),transparent_38%)]" />
        {/* Content enters from the side you moved toward, so the swap reads as advancing
            through one connected flow instead of bouncing vertically between panels. */}
        {compact ? (
          <div className="relative">{preview}</div>
        ) : (
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <m.div
              key={active.id}
              custom={direction}
              initial={{ filter: 'blur(6px)', opacity: 0, scale: 0.985, x: 32 * direction }}
              animate={{ filter: 'blur(0px)', opacity: 1, scale: 1, x: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 1 }
                  : { filter: 'blur(4px)', opacity: 0, scale: 0.99, x: -24 * direction }
              }
              transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative [will-change:filter,opacity,transform]"
            >
              {preview}
            </m.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function PreviewHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-heading text-2xs font-bold uppercase tracking-[0.18em] text-brand-secondary">{eyebrow}</p>
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
            <div key={mode.label} className={`rounded-[13px] border border-brand-dark/25 p-4 ${index === 1 ? 'bg-brand-accent shadow-offset-sm' : landingFrostedSubtle}`}>
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
          <div key={word} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[13px] border border-brand-dark/20 p-4 ${landingFrostedSubtle}`}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-[13px] border border-brand-dark/20 ${index === 0 ? 'bg-brand-accent' : 'bg-bg-primary'}`}>
              <Repeat2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-heading text-sm font-bold">{word}</span>
              <span className="mt-0.5 block text-2xs text-brand-secondary">{status}</span>
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
        <div className="max-w-[85%] rounded-[13px] bg-brand-dark px-4 py-3 text-sm leading-6 text-white">
          What would make you feel more confident in your next meeting?
        </div>
        <div className={`ml-auto max-w-[85%] rounded-[13px] border border-brand-dark/20 px-4 py-3 text-sm leading-6 ${landingFrostedSubtle}`}>
          I want explain my ideas without stop too much.
        </div>
        <div className="max-w-[92%] rounded-[13px] border border-brand-dark/25 bg-brand-accent px-4 py-3 text-sm leading-6">
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
          <div key={label} className={`rounded-[13px] border border-brand-dark/20 p-4 ${index === 3 ? 'bg-brand-accent' : landingFrostedSubtle}`}>
            <p className="text-2xs font-semibold uppercase tracking-wide text-brand-secondary">{label}</p>
            <p className="mt-4 font-heading text-lg font-bold text-brand-dark">{value}</p>
          </div>
        ))}
      </div>
      <div className={`mt-3 flex items-center gap-3 rounded-[13px] border border-brand-dark/20 p-4 ${landingFrostedSubtle}`}>
        <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-brand-dark text-white"><Check className="h-4 w-4" /></span>
        <div>
          <p className="font-heading text-sm font-bold">Plano ajustado</p>
          <p className="mt-1 text-2xs text-brand-secondary">Mais duas práticas de speaking nesta semana.</p>
        </div>
      </div>
    </>
  )
}
