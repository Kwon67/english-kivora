'use client'

import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  Check,
  Loader2,
  Mic2,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import SectionBadge from '@/components/ui/SectionBadge'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingCtaCardShadow, landingHeroCardClass, landingRadius } from '@/lib/landingStyles'

const scenarios = [
  {
    id: 'entrevista',
    label: 'Entrevista',
    prompt: 'Quero treinar uma entrevista de emprego',
    tutor: 'Tell me about a project you are proud of.',
    answer: 'I worked in a project that helped many customers.',
    correction: 'I worked on a project that helped many customers.',
    tip: 'Use “worked on” para falar sobre participação em projetos.',
  },
  {
    id: 'reuniao',
    label: 'Reunião',
    prompt: 'Quero apresentar uma ideia em uma reunião',
    tutor: 'How would this idea improve the team’s workflow?',
    answer: 'This idea can make the process more faster.',
    correction: 'This idea can make the process faster.',
    tip: '“Faster” já é comparativo; não precisa de “more”.',
  },
  {
    id: 'viagem',
    label: 'Viagem',
    prompt: 'Quero praticar inglês para uma viagem',
    tutor: 'Your room is not ready yet. What would you ask?',
    answer: 'Can I leave my luggages here?',
    correction: 'Can I leave my luggage here?',
    tip: '“Luggage” é incontável e não recebe “s”.',
  },
] as const

type DemoStage = 'idle' | 'preparing' | 'tutor' | 'answer' | 'correction' | 'complete'

export default function Hero() {
  const reducedMotion = useReducedMotion()
  const [scenarioId, setScenarioId] = useState<(typeof scenarios)[number]['id']>('entrevista')
  const [prompt, setPrompt] = useState<string>(scenarios[0].prompt)
  const [stage, setStage] = useState<DemoStage>('idle')
  const timers = useRef<number[]>([])

  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0]
  const running = stage !== 'idle' && stage !== 'complete'

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  function selectScenario(next: (typeof scenarios)[number]) {
    clearTimers()
    setScenarioId(next.id)
    setPrompt(next.prompt)
    setStage('idle')
  }

  function runPractice() {
    clearTimers()
    setStage('preparing')

    const sequence: Array<{ delay: number; stage: DemoStage }> = reducedMotion
      ? [{ delay: 80, stage: 'complete' }]
      : [
          { delay: 450, stage: 'tutor' },
          { delay: 1900, stage: 'answer' },
          { delay: 3300, stage: 'correction' },
          { delay: 4900, stage: 'complete' },
        ]

    sequence.forEach((item) => {
      timers.current.push(window.setTimeout(() => setStage(item.stage), item.delay))
    })
  }

  useEffect(() => () => clearTimers(), [])

  return (
    <section id="produto" className="relative scroll-mt-28 px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
      <m.div
        initial={false}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`relative mx-auto max-w-7xl overflow-hidden ${landingHeroCardClass} ${landingCtaCardShadow} lg:grid lg:grid-cols-[0.78fr_1.22fr]`}
      >
        <div className="relative flex flex-col justify-center px-6 py-9 sm:px-9 sm:py-12 lg:border-r lg:border-brand-dark lg:px-10 xl:px-12">
          <div aria-hidden="true" className="absolute right-8 top-8 hidden grid-cols-2 gap-1.5 opacity-30 sm:grid">
            {[0, 1, 2, 3].map((item) => (
              <span key={item} className={`h-2.5 w-2.5 rounded-[2px] ${item === 3 ? 'bg-brand-accent' : 'bg-brand-dark'}`} />
            ))}
          </div>
          <SectionBadge label="Seu inglês em movimento" />
          <h1 className="mt-6 max-w-xl font-heading text-4xl font-bold leading-[1.06] text-brand-dark sm:text-5xl xl:text-[4rem]">
            Pratique o inglês que você realmente vai usar.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-brand-secondary sm:text-lg">
            Escolha uma situação. Fale do seu jeito. Receba uma correção clara e transforme cada erro na próxima prática.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button landing href="/register" className="group">
              Começar grátis
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Button>
            <a href="#como-funciona" className="font-heading text-sm font-bold text-brand-dark underline decoration-brand-border underline-offset-4 transition-colors hover:decoration-brand-dark">
              Ver como funciona
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-brand-dark/15 pt-5 text-xs font-semibold text-brand-secondary">
            {['Sem cartão', 'Sessões curtas', 'Feedback imediato'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand-dark" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 bg-[#E9E5DC] p-3 sm:p-5 lg:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(213,224,107,0.38),transparent_31%)]" />
          <div className={`relative overflow-hidden ${landingRadius} border border-brand-dark bg-bg-card shadow-[0_16px_45px_rgba(28,25,21,0.12)]`}>
            <div className="flex items-center justify-between gap-3 border-b border-brand-dark/30 bg-bg-card px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <MacTrafficLights className="shrink-0" />
                <span className="truncate font-heading text-[10px] font-bold uppercase tracking-wider text-brand-secondary sm:text-xs">
                  Kivora · sessão guiada
                </span>
              </div>
              <MacWindowControlButtons className="shrink-0" />
            </div>

            <div className="grid min-h-[470px] md:grid-cols-[0.8fr_1.2fr] lg:min-h-[520px]">
              <div className="border-b border-brand-dark/20 bg-bg-primary/75 p-4 md:border-b-0 md:border-r sm:p-5">
                <p className="font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Escolha um cenário</p>
                <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-1" aria-label="Cenários de prática">
                  {scenarios.map((item) => {
                    const active = item.id === scenario.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectScenario(item)}
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-[10px] border px-2.5 py-2 text-xs font-semibold transition-[background-color,transform,box-shadow] duration-200 md:justify-start ${
                          active
                            ? 'border-brand-dark bg-brand-dark text-white shadow-[3px_3px_0_#D5E06B]'
                            : 'border-brand-dark/25 bg-bg-card text-brand-secondary hover:-translate-y-0.5 hover:border-brand-dark hover:text-brand-dark'
                        }`}
                      >
                        {item.id === 'entrevista' ? <Sparkles className="h-4 w-4" /> : item.id === 'reuniao' ? <Mic2 className="h-4 w-4" /> : <span aria-hidden="true">✦</span>}
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>

                <label htmlFor="hero-practice-prompt" className="mt-6 block font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-brand-secondary">
                  O que você quer praticar?
                </label>
                <textarea
                  id="hero-practice-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={4}
                  className="mt-3 w-full resize-none rounded-[10px] border border-brand-dark/25 bg-bg-card px-3 py-3 text-sm leading-6 text-brand-dark outline-none transition focus:border-brand-dark focus:ring-2 focus:ring-brand-accent"
                />
                <button
                  type="button"
                  onClick={runPractice}
                  disabled={running || !prompt.trim()}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-brand-dark bg-brand-accent px-4 font-heading text-sm font-bold text-brand-dark shadow-[3px_3px_0_#1C1915] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[4px_5px_0_#1C1915] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-60"
                >
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : stage === 'complete' ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {stage === 'preparing' ? 'Preparando' : running ? 'Conversando…' : stage === 'complete' ? 'Praticar de novo' : 'Praticar'}
                </button>
              </div>

              <div className="relative flex min-w-0 flex-col p-4 sm:p-5" aria-live="polite">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Tutor ao vivo</p>
                    <p className="mt-1 text-xs text-brand-secondary">Nível intermediário · feedback essencial</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-brand-dark/20 bg-bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-brand-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent ring-1 ring-brand-dark" />
                    online
                  </span>
                </div>

                <div className="mt-5 flex min-h-0 flex-1 flex-col justify-end gap-3">
                  {stage === 'idle' ? (
                    <m.div
                      key={scenario.id}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      className="my-auto rounded-[12px] border border-dashed border-brand-dark/35 bg-bg-primary/50 px-5 py-8 text-center"
                    >
                      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[12px] border border-brand-dark bg-brand-accent">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <p className="mt-4 font-heading text-base font-bold">Pronto para {scenario.label.toLowerCase()}</p>
                      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-brand-secondary">
                        Ajuste o objetivo se quiser e pressione “Praticar” para ver a sessão acontecer.
                      </p>
                    </m.div>
                  ) : null}

                  <AnimatePresence initial={false}>
                    {stage === 'preparing' ? (
                      <m.div
                        key="preparing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="my-auto flex flex-col items-center text-center"
                      >
                        <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-brand-dark bg-brand-accent">
                          <Sparkles className="h-6 w-6" />
                          <span className="absolute inset-0 animate-ping rounded-full border border-brand-dark/30" />
                        </span>
                        <p className="mt-4 font-heading text-sm font-bold">Criando contexto útil</p>
                      </m.div>
                    ) : null}

                    {['tutor', 'answer', 'correction', 'complete'].includes(stage) ? (
                      <PracticeMessage key="tutor" tone="dark" reducedMotion={Boolean(reducedMotion)}>
                        <WordRevealText text={scenario.tutor} reducedMotion={Boolean(reducedMotion)} />
                      </PracticeMessage>
                    ) : null}
                    {['answer', 'correction', 'complete'].includes(stage) ? (
                      <PracticeMessage key="answer" tone="light" align="right" reducedMotion={Boolean(reducedMotion)}>
                        <WordRevealText text={scenario.answer} reducedMotion={Boolean(reducedMotion)} />
                      </PracticeMessage>
                    ) : null}
                    {['correction', 'complete'].includes(stage) ? (
                      <PracticeMessage key="correction" tone="accent" reducedMotion={Boolean(reducedMotion)}>
                        <p className="font-semibold">
                          <WordRevealText text={scenario.correction} reducedMotion={Boolean(reducedMotion)} />
                        </p>
                        <p className="mt-1 text-xs leading-5 opacity-75">
                          <WordRevealText text={scenario.tip} reducedMotion={Boolean(reducedMotion)} intervalMs={72} />
                        </p>
                      </PracticeMessage>
                    ) : null}
                  </AnimatePresence>
                </div>

                <AnimatePresence initial={false}>
                  {stage === 'complete' ? (
                    <m.div
                      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 grid grid-cols-3 gap-2 border-t border-brand-dark/15 pt-4"
                    >
                      {[['Clareza', '82%'], ['Novas palavras', '+4'], ['Sessão', '+120 XP']].map(([label, value]) => (
                        <div key={label} className="rounded-[9px] bg-bg-primary px-2 py-2.5 text-center">
                          <p className="font-heading text-xs font-bold text-brand-dark">{value}</p>
                          <p className="mt-1 text-[9px] leading-tight text-brand-secondary">{label}</p>
                        </div>
                      ))}
                    </m.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </section>
  )
}

function PracticeMessage({
  children,
  tone,
  align = 'left',
  reducedMotion,
}: {
  children: React.ReactNode
  tone: 'dark' | 'light' | 'accent'
  align?: 'left' | 'right'
  reducedMotion: boolean
}) {
  const toneClass =
    tone === 'dark'
      ? 'bg-brand-dark text-white'
      : tone === 'accent'
        ? 'border border-brand-dark/25 bg-brand-accent text-brand-dark'
        : 'border border-brand-dark/20 bg-bg-primary text-brand-dark'

  return (
    <m.div
      initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
      className={`max-w-[92%] rounded-[12px] px-4 py-3 text-sm leading-6 [contain:layout_paint] [will-change:transform,opacity] ${toneClass} ${align === 'right' ? 'ml-auto' : ''}`}
    >
      {children}
    </m.div>
  )
}

function WordRevealText({
  text,
  reducedMotion,
  intervalMs = 112,
}: {
  text: string
  reducedMotion: boolean
  intervalMs?: number
}) {
  const words = text.split(' ')
  const [visibleWords, setVisibleWords] = useState(reducedMotion ? words.length : 0)

  useEffect(() => {
    if (reducedMotion) {
      setVisibleWords(words.length)
      return
    }

    setVisibleWords(0)
    const timer = window.setInterval(() => {
      setVisibleWords((current) => {
        if (current >= words.length) {
          window.clearInterval(timer)
          return current
        }
        return current + 1
      })
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs, reducedMotion, text, words.length])

  const typing = visibleWords < words.length

  return (
    <>
      {words.slice(0, visibleWords).join(' ')}
      {typing ? <span className="ml-0.5 inline-block h-[1em] w-px translate-y-[2px] animate-pulse bg-current" aria-hidden="true" /> : null}
    </>
  )
}
