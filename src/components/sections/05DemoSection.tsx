'use client'

import { CheckCircle2, Loader2, Play, Sparkles } from 'lucide-react'
import { m } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { useSafariIOS } from '@/hooks/useSafariIOS'
import { landingSectionIntroClass, landingSectionTitleClass } from '@/lib/landingTypography'

const demoSteps = [
  'Criando contexto de prática',
  'Ajustando dificuldade ao seu nível',
  'Gerando correções em tempo real',
]

export default function DemoSection() {
  const isIOS = useSafariIOS()
  const [prompt, setPrompt] = useState('Quero treinar entrevista de emprego')
  const [isRunning, setIsRunning] = useState(false)
  const [hasDemo, setHasDemo] = useState(false)
  const [visibleStage, setVisibleStage] = useState(0)
  const timers = useRef<number[]>([])

  const practiceTopic = useMemo(() => {
    const cleanPrompt = prompt.trim()

    if (!cleanPrompt) {
      return 'situação do dia a dia'
    }

    return cleanPrompt.replace(/[.!?]+$/, '')
  }, [prompt])

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  function runDemo() {
    clearTimers()
    setIsRunning(true)
    setHasDemo(true)
    setVisibleStage(0)

    const schedule = [
      { delay: 180, stage: 1 },
      { delay: 850, stage: 2 },
      { delay: 2400, stage: 3 },
      { delay: 3800, stage: 4 },
      { delay: 5600, stage: 5 },
    ]

    schedule.forEach(({ delay, stage }) => {
      timers.current.push(window.setTimeout(() => setVisibleStage(stage), delay))
    })

    timers.current.push(window.setTimeout(() => setIsRunning(false), 6200))
  }

  useEffect(() => clearTimers, [])

  return (
    <LandingSectionFrame band="plain" className="py-16">
      <RevealOnScroll className="mx-auto max-w-6xl text-left">
        <SectionBadge label="Demonstração" />
        <h2 className={`mt-8 max-w-4xl ${landingSectionTitleClass}`}>
          IA que aprende com você, em tempo real
        </h2>
        <p className={landingSectionIntroClass}>
          Descreva o que quer praticar e o agente cria uma sessão guiada com feedback instantâneo.
        </p>
        <div className="relative mx-auto mt-10 max-w-5xl overflow-x-hidden rounded-[13px] border border-brand-dark bg-bg-card p-0 text-left shadow-[0_1px_0_rgba(28,25,21,0.08)]">
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-brand-dark px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <MacTrafficLights className="shrink-0" />
              <span className="min-w-0 truncate rounded-md border border-brand-dark bg-bg-primary px-2 py-1 text-[10px] text-brand-secondary sm:px-3 sm:text-xs">
                app.kivoraenglish.com/praticar
              </span>
            </div>
            <MacWindowControlButtons className="shrink-0" />
          </div>
          <div className="grid min-w-0 gap-0 md:grid-cols-[0.9fr_1.1fr]">
            <div className="min-w-0 border-b border-brand-dark bg-bg-primary/55 p-4 md:border-b-0 md:border-r sm:p-6">
              <label className="text-sm font-semibold text-brand-dark">Nova prática</label>
              <div className="mt-4 flex flex-col gap-3 rounded-[13px] border border-brand-dark bg-bg-card p-3 sm:flex-row sm:items-center">
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-brand-secondary"
                  placeholder="Quero treinar entrevista de emprego"
                />
                <Button
                  onClick={runDemo}
                  disabled={isRunning}
                  className="w-full shrink-0 justify-center px-4 py-2.5 text-sm sm:w-auto disabled:cursor-wait disabled:opacity-70"
                >
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {isRunning ? 'Gerando' : 'Praticar'}
                </Button>
              </div>
              <div className="mt-5 space-y-3">
                {demoSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 text-sm text-brand-secondary">
                    <span className="flex h-6 w-6 items-center justify-center rounded-[5px] border border-brand-dark bg-bg-card">
                      {hasDemo || isRunning ? (
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            visibleStage > index || isRunning ? 'text-brand-dark' : 'text-brand-secondary/40'
                          }`}
                        />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-brand-border" />
                      )}
                    </span>
                    <span>{index + 1}. {step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-0 bg-[#F7F3ED] p-4 sm:p-6">
              {!hasDemo && !isRunning ? (
                <div className="flex w-full min-w-0 flex-col items-center justify-center rounded-[13px] border border-dashed border-brand-dark bg-bg-card px-4 py-12 text-center sm:min-h-[300px] sm:px-6">
                  <Sparkles className="h-8 w-8 shrink-0 text-brand-secondary" />
                  <p className="mt-4 font-heading text-lg font-bold text-brand-dark">Pronto para simular</p>
                  <p className="mt-2 w-full text-sm leading-6 text-brand-secondary">
                    Clique em “Praticar” para ver o tutor montar uma sessão com conversa, correção e próximo desafio.
                  </p>
                </div>
              ) : (
                <m.div
                  initial={isIOS ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: isIOS ? 0 : 0.35, ease: 'easeOut' }}
                  className="min-w-0 space-y-3"
                >
                  {visibleStage === 0 && (
                    <div className="flex min-h-[298px] items-center justify-center rounded-[13px] border border-brand-dark bg-bg-card">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-dark" />
                        <p className="mt-4 font-heading text-sm font-bold uppercase text-brand-dark">
                          Montando sua prática
                        </p>
                      </div>
                    </div>
                  )}

                  {visibleStage >= 1 && (
                    <DemoBlock className="rounded-[13px] border border-brand-dark bg-bg-card p-3">
                      <p className="font-heading text-xs font-bold uppercase text-brand-secondary">Objetivo</p>
                      <Typewriter
                        text={practiceTopic}
                        className="mt-1 min-h-5 text-sm font-semibold text-brand-dark"
                      />
                    </DemoBlock>
                  )}

                  {visibleStage >= 2 && (
                    <DemoBlock className="max-w-full rounded-[13px] bg-brand-dark px-4 py-3 text-sm leading-6 text-white sm:max-w-[88%]">
                      <Typewriter
                        text={`Let's practice: ${practiceTopic}. Answer naturally in English, and I will correct only what blocks clarity.`}
                      />
                    </DemoBlock>
                  )}

                  {visibleStage >= 3 && (
                    <DemoBlock className="ml-auto max-w-full rounded-[13px] border border-brand-dark bg-bg-card px-4 py-3 text-sm leading-6 text-brand-dark sm:max-w-[88%]">
                      <Typewriter text="I want improve my English because I need speak with clients." />
                    </DemoBlock>
                  )}

                  {visibleStage >= 4 && (
                    <DemoBlock className="max-w-full rounded-[13px] bg-brand-accent px-4 py-3 text-sm leading-6 text-brand-dark sm:max-w-[92%]">
                      <Typewriter text="Boa. Melhor: “I want to improve my English because I need to speak with clients.” Agora repita usando “confidently”." />
                    </DemoBlock>
                  )}

                  {visibleStage >= 5 && (
                    <m.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut', staggerChildren: 0.08 }}
                      className="grid gap-3 pt-2 sm:grid-cols-3"
                    >
                    {['Clareza 82%', 'Vocabulário +4', 'XP +120'].map((item) => (
                      <m.div
                        key={item}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="rounded-[13px] border border-brand-dark bg-bg-card px-3 py-2 text-center font-heading text-xs font-bold text-brand-dark"
                      >
                        {item}
                      </m.div>
                    ))}
                    </m.div>
                  )}
                </m.div>
              )}
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}

function DemoBlock({
  children,
  className,
}: {
  children: React.ReactNode
  className: string
}) {
  const isIOS = useSafariIOS()

  if (isIOS) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </m.div>
  )
}

function Typewriter({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    setDisplayedText('')

    let index = 0
    const interval = window.setInterval(() => {
      index += 2
      setDisplayedText(text.slice(0, index))

      if (index >= text.length) {
        window.clearInterval(interval)
      }
    }, 14)

    return () => window.clearInterval(interval)
  }, [text])

  return (
    <span className={className}>
      {displayedText}
      {displayedText.length < text.length && <span className="animate-pulse">|</span>}
    </span>
  )
}
