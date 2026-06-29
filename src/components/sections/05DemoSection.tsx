'use client'

import { CheckCircle2, Loader2, Play, Sparkles } from 'lucide-react'
import { m } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { useSafariIOS } from '@/hooks/useSafariIOS'

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
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-6xl text-center">
        <SectionBadge label="Demonstração" className="mx-auto" />
        <h2 className="mt-8 font-heading text-3xl font-bold text-brand-dark sm:text-5xl">
          IA que aprende com você, em tempo real
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-brand-secondary">
          Descreva o que quer praticar e o agente cria uma sessão guiada com feedback instantâneo.
        </p>
        <Card className="mt-10 overflow-x-hidden p-0 text-left">
          <div className="flex min-w-0 items-center gap-2 border-b border-brand-border px-4 py-3 sm:px-5 sm:py-4">
            <span className="h-3 w-3 shrink-0 rounded-full bg-red-400" />
            <span className="h-3 w-3 shrink-0 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 shrink-0 rounded-full bg-brand-accent" />
            <span className="ml-1 min-w-0 truncate rounded-md border border-brand-border bg-bg-primary px-2 py-1 text-[10px] text-brand-secondary sm:ml-3 sm:px-3 sm:text-xs">
              app.kivoraenglish.com/praticar
            </span>
          </div>
          <div className="grid min-w-0 gap-4 p-4 sm:gap-6 sm:p-5 md:grid-cols-[0.9fr_1.1fr] md:p-8">
            <div className="min-w-0 rounded-2xl border border-brand-border bg-bg-primary p-4">
              <label className="text-sm font-semibold text-brand-dark">Nova prática</label>
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand-border bg-white/50 p-3 sm:flex-row sm:items-center">
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
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-border bg-bg-card">
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
            <div className="min-w-0 rounded-2xl border border-brand-border bg-bg-primary p-4">
              {!hasDemo && !isRunning ? (
                <div className="flex w-full min-w-0 flex-col items-center justify-center rounded-xl border border-dashed border-brand-border bg-bg-card px-4 py-10 text-center sm:px-6 sm:py-12">
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
                    <div className="flex min-h-[298px] items-center justify-center rounded-xl border border-brand-border bg-bg-card">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-dark" />
                        <p className="mt-4 font-heading text-sm font-bold uppercase text-brand-dark">
                          Montando sua prática
                        </p>
                      </div>
                    </div>
                  )}

                  {visibleStage >= 1 && (
                    <DemoBlock className="rounded-xl border border-brand-border bg-bg-card p-3">
                      <p className="font-heading text-xs font-bold uppercase text-brand-secondary">Objetivo</p>
                      <Typewriter
                        text={practiceTopic}
                        className="mt-1 min-h-5 text-sm font-semibold text-brand-dark"
                      />
                    </DemoBlock>
                  )}

                  {visibleStage >= 2 && (
                    <DemoBlock className="max-w-full rounded-xl bg-brand-dark px-4 py-3 text-sm leading-6 text-white sm:max-w-[88%]">
                      <Typewriter
                        text={`Let's practice: ${practiceTopic}. Answer naturally in English, and I will correct only what blocks clarity.`}
                      />
                    </DemoBlock>
                  )}

                  {visibleStage >= 3 && (
                    <DemoBlock className="ml-auto max-w-full rounded-xl border border-brand-border bg-bg-card px-4 py-3 text-sm leading-6 text-brand-dark sm:max-w-[88%]">
                      <Typewriter text="I want improve my English because I need speak with clients." />
                    </DemoBlock>
                  )}

                  {visibleStage >= 4 && (
                    <DemoBlock className="max-w-full rounded-xl bg-brand-accent px-4 py-3 text-sm leading-6 text-brand-dark sm:max-w-[92%]">
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
                        className="rounded-lg border border-brand-border bg-bg-card px-3 py-2 text-center font-heading text-xs font-bold text-brand-dark"
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
        </Card>
      </RevealOnScroll>
    </section>
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
