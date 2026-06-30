'use client'

import {
  BarChart3,
  Bot,
  Check,
  Gamepad2,
  Globe,
  Keyboard,
  Layers,
  Mic2,
  MonitorSmartphone,
  Smartphone,
  Sparkles,
  TimerReset,
  Volume2,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { m } from 'framer-motion'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll, { revealItem } from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingSectionIntroClass, landingSectionTitleClass } from '@/lib/landingTypography'
import { landingRadius } from '@/lib/landingStyles'

type StackItem = {
  name: string
  icon: LucideIcon
}

type StackGroup = {
  title: string
  items: StackItem[]
}

const stackGroups: StackGroup[] = [
  {
    title: 'Modos de Prática',
    items: [
      { name: 'Flashcard', icon: Layers },
      { name: 'Blitz', icon: Zap },
      { name: 'Speaking', icon: Mic2 },
      { name: 'Listening', icon: Volume2 },
      { name: 'Blitz IA', icon: Sparkles },
      { name: 'Digitação', icon: Keyboard },
    ],
  },
  {
    title: 'Tecnologia',
    items: [
      { name: 'AI Tutor', icon: Bot },
      { name: 'SRS', icon: TimerReset },
      { name: 'Gamificação', icon: Gamepad2 },
      { name: 'Progresso', icon: BarChart3 },
      { name: 'CEFR', icon: Globe },
    ],
  },
  {
    title: 'Plataformas',
    items: [
      { name: 'Web', icon: MonitorSmartphone },
      { name: 'PWA', icon: Smartphone },
      { name: 'Mobile', icon: Smartphone },
    ],
  },
]

function StackLogoCell({ item }: { item: StackItem }) {
  const Icon = item.icon

  return (
    <div className="relative flex min-h-[108px] flex-col items-center justify-center bg-bg-card px-3 py-5 sm:min-h-[118px]">
      <Check
        className="absolute right-2.5 top-2.5 h-4 w-4 text-[#1797F2]"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span className={`flex h-11 w-11 items-center justify-center ${landingRadius} border border-brand-dark bg-bg-primary`}>
        <Icon className="h-5 w-5 text-brand-dark" aria-hidden="true" />
      </span>
      <span className="mt-3 text-center text-xs font-semibold leading-tight text-brand-dark sm:text-sm">
        {item.name}
      </span>
    </div>
  )
}

export default function LearningStack() {
  return (
    <LandingSectionFrame id="recursos" band="plain">
      <RevealOnScroll className="mx-auto max-w-6xl" stagger>
        <m.div variants={revealItem}>
          <SectionBadge label="Recursos" />
          <h2 className={`mt-8 max-w-3xl ${landingSectionTitleClass}`}>
            Nossa Stack de Aprendizado
          </h2>
          <p className={landingSectionIntroClass}>
            Ferramentas de prática, revisão e progresso para aprender inglês sem montar uma rotina do zero.
          </p>
        </m.div>

        <m.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className={`relative mt-10 overflow-hidden ${landingRadius} border border-brand-dark bg-bg-card`}
        >
          {stackGroups.map((group) => (
            <m.section key={group.title} variants={revealItem} className="border-b border-brand-dark last:border-b-0">
              <div className="border-b border-brand-dark bg-bg-primary px-5 py-3 sm:px-6">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-brand-dark sm:text-base">
                  {group.title}
                </h3>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-brand-dark sm:grid-cols-3">
                {group.items.map((item) => (
                  <StackLogoCell key={item.name} item={item} />
                ))}
              </div>
            </m.section>
          ))}
        </m.div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}