'use client'

import { Bot, Gamepad2, TimerReset, Zap } from 'lucide-react'
import { m } from 'framer-motion'
import Card from '@/components/ui/Card'
import RevealOnScroll, { revealItem } from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'

const items = [
  {
    icon: Gamepad2,
    title: '7 Modos de Jogo',
    description: 'Flashcard, Listening, Speaking, digitação e combinação para variar a prática no seu ritmo.',
  },
  {
    icon: Bot,
    title: 'AI Tutor Pessoal',
    description: 'Converse em inglês, receba correções em tempo real e mantenha seu progresso salvo.',
  },
  {
    icon: TimerReset,
    title: 'Revisão Espaçada (SRS)',
    description: 'Um algoritmo identifica quando você vai esquecer e antecipa a prática certa.',
  },
  {
    icon: Zap,
    title: 'Blitz: Desafio Relâmpago',
    description:
      'Modo padrão: partidas solo rápidas com modos mistos, combos e três vidas. Blitz IA: a IA monta um pack temporário no seu nível CEFR para cada rodada.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-5xl" stagger>
        <m.div variants={revealItem}>
          <SectionBadge label="Como funciona" className="mx-auto" />
        </m.div>
        <m.h2
          variants={revealItem}
          className="mt-8 text-center font-heading text-3xl font-bold text-brand-dark sm:text-5xl"
        >
          Uma plataforma, todos os modos
        </m.h2>
        <m.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="mt-10 overflow-hidden rounded-2xl border border-brand-border bg-bg-card"
        >
          {items.map((item) => {
            const Icon = item.icon

            return (
              <m.div key={item.title} variants={revealItem}>
                <Card className="grid gap-5 rounded-none border-0 border-b border-brand-border bg-transparent transition-colors duration-200 last:border-b-0 hover:bg-bg-primary sm:grid-cols-[64px_1fr]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-border bg-bg-primary">
                    <Icon className="h-6 w-6 text-brand-dark" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-dark">{item.title}</h3>
                    <p className="mt-2 leading-7 text-brand-secondary">{item.description}</p>
                  </div>
                </Card>
              </m.div>
            )
          })}
        </m.div>
      </RevealOnScroll>
    </section>
  )
}