'use client'

import { BarChart3, Clock3, MessageSquareText } from 'lucide-react'
import { m } from 'framer-motion'
import { useState } from 'react'
import Card from '@/components/ui/Card'
import RevealOnScroll, { revealItem } from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'

const tabs = ['Iniciantes', 'Intermediários', 'Avançados']

const metrics = [
  {
    icon: BarChart3,
    value: '7x',
    title: 'mais vocabulário retido',
    description: 'vs flashcard manual',
  },
  {
    icon: Clock3,
    value: '< 10 min',
    title: 'para uma sessão completa',
    description: 'por dia',
  },
  {
    icon: MessageSquareText,
    value: 'Zero',
    title: 'gramática decorada',
    description: 'aprenda pelo contexto',
  },
]

export default function AudienceTabs() {
  const [active, setActive] = useState(tabs[0])

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-6xl text-center" stagger>
        <SectionBadge label="Para quem é" className="mx-auto" />
        <h2 className="mt-8 font-heading text-3xl font-bold text-brand-dark sm:text-5xl">
          Construído para todo tipo de aprendiz
        </h2>
        <Card className="mt-10 p-0">
          <div className="grid grid-cols-3 border-b border-brand-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`px-3 py-5 text-sm font-semibold sm:text-base ${
                  active === tab
                    ? 'rounded-t-2xl bg-brand-dark text-white'
                    : 'text-brand-secondary hover:text-brand-dark'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid gap-0 md:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon

              return (
                <m.div
                  key={`${active}-${metric.value}`}
                  variants={revealItem}
                  className="border-b border-brand-border p-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
                >
                  <Icon className="mx-auto h-7 w-7 text-brand-secondary" />
                  <p className="mt-4 font-heading text-4xl font-bold text-brand-dark">{metric.value}</p>
                  <p className="mt-3 font-semibold text-brand-dark">{metric.title}</p>
                  <p className="mt-1 text-sm text-brand-secondary">{metric.description}</p>
                </m.div>
              )
            })}
          </div>
        </Card>
      </RevealOnScroll>
    </section>
  )
}
