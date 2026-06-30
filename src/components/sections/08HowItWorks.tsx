'use client'

import { BarChart3, Bot, Gamepad2, Mic2, TimerReset, Zap } from 'lucide-react'
import { m } from 'framer-motion'
import Card from '@/components/ui/Card'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll, { revealItem } from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingSectionIntroClass, landingSectionTitleClass } from '@/lib/landingTypography'

const items = [
  {
    icon: Gamepad2,
    title: 'Para praticar todo dia',
    description: 'Flashcard, listening, speaking e digitação em sessões curtas, sem fricção.',
  },
  {
    icon: Bot,
    title: 'Para conversar com IA',
    description: 'Tutor pessoal com correções em tempo real e próximas missões adaptadas ao seu nível.',
  },
  {
    icon: TimerReset,
    title: 'Para revisar no tempo certo',
    description: 'SRS identifica o que está esfriando e antecipa a prática antes do esquecimento.',
  },
  {
    icon: Zap,
    title: 'Para medir progresso',
    description: 'Blitz, ranking e histórico mostram evolução real sem planilhas manuais.',
  },
]

const flowIcons = [Mic2, BarChart3, Bot, TimerReset]

export default function HowItWorks() {
  return (
    <LandingSectionFrame id="como-funciona" band="default">
      <RevealOnScroll className="mx-auto max-w-5xl" stagger>
        <m.div variants={revealItem}>
          <SectionBadge label="Como funciona" />
        </m.div>
        <m.h2
          variants={revealItem}
          className={`mt-8 max-w-3xl ${landingSectionTitleClass}`}
        >
          Uma plataforma, todos os modos
        </m.h2>
        <m.p variants={revealItem} className={landingSectionIntroClass}>
          Escolha o fluxo certo para estudar, revisar, conversar e provar avanço em inglês.
        </m.p>
        <m.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="relative mt-10 grid gap-4 sm:grid-cols-2"
        >
          {items.map((item, index) => {
            const Icon = item.icon
            const FlowIcon = flowIcons[index]

            return (
              <m.div key={item.title} variants={revealItem}>
                <Card className="h-full border-brand-dark p-5 transition-colors duration-200 hover:bg-bg-primary sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-brand-dark bg-bg-primary">
                      <Icon className="h-5 w-5 text-brand-dark" />
                    </div>
                    <FlowIcon className="h-5 w-5 text-brand-secondary" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-brand-dark">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-brand-secondary">{item.description}</p>
                </Card>
              </m.div>
            )
          })}
        </m.div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
