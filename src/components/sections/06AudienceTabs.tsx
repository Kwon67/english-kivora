'use client'

import { BarChart3, Clock3, MessageSquareText, Sparkles, Target, Trophy } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import Card from '@/components/ui/Card'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { useSafariIOS } from '@/hooks/useSafariIOS'
import { landingSectionIntroClass, landingSectionTitleClass } from '@/lib/landingTypography'

type AudienceMetric = {
  icon: LucideIcon
  value: string
  title: string
  description: string
}

type AudienceTab = {
  id: string
  label: string
  pitch: string
  metrics: AudienceMetric[]
}

const audiences: AudienceTab[] = [
  {
    id: 'iniciantes',
    label: 'Iniciantes',
    pitch: 'Comece com confiança, sem travar na primeira frase.',
    metrics: [
      {
        icon: Sparkles,
        value: 'A1–A2',
        title: 'trilha guiada do zero',
        description: 'vocabulário essencial primeiro',
      },
      {
        icon: Clock3,
        value: '5 min',
        title: 'para criar o hábito',
        description: 'sessões curtas e leves',
      },
      {
        icon: Target,
        value: '100%',
        title: 'feedback imediato',
        description: 'sem medo de errar',
      },
    ],
  },
  {
    id: 'intermediarios',
    label: 'Intermediários',
    pitch: 'Ganhe fluência com prática diária e revisão inteligente.',
    metrics: [
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
    ],
  },
  {
    id: 'avancados',
    label: 'Avançados',
    pitch: 'Refine nuance, velocidade e naturalidade em contextos reais.',
    metrics: [
      {
        icon: Trophy,
        value: 'B2+',
        title: 'desafios de alta pressão',
        description: 'Blitz padrão e Blitz IA',
      },
      {
        icon: MessageSquareText,
        value: 'IA',
        title: 'tutor com correção fina',
        description: 'tom, ritmo e precisão',
      },
      {
        icon: BarChart3,
        value: '360°',
        title: 'progresso detalhado',
        description: 'gargalos e metas claras',
      },
    ],
  },
]

export default function AudienceTabs() {
  const isIOS = useSafariIOS()
  const [activeIndex, setActiveIndex] = useState(1)
  const [indicator, setIndicator] = useState({ width: 0, left: 0 })
  const tabListRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const activeAudience = audiences[activeIndex]

  const syncIndicator = useCallback(() => {
    const tab = tabRefs.current[activeIndex]
    const list = tabListRef.current
    if (!tab || !list) return

    const listRect = list.getBoundingClientRect()
    const tabRect = tab.getBoundingClientRect()

    setIndicator({
      width: tabRect.width,
      left: tabRect.left - listRect.left,
    })
  }, [activeIndex])

  useLayoutEffect(() => {
    syncIndicator()

    const list = tabListRef.current
    if (!list) return

    const resizeObserver = new ResizeObserver(() => {
      syncIndicator()
    })

    resizeObserver.observe(list)
    tabRefs.current.forEach((tab) => {
      if (tab) resizeObserver.observe(tab)
    })

    window.addEventListener('resize', syncIndicator)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', syncIndicator)
    }
  }, [syncIndicator])

  const contentTransition = isIOS
    ? { duration: 0.22, ease: 'easeOut' as const }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <LandingSectionFrame band="soft">
      <RevealOnScroll className="mx-auto max-w-6xl text-left">
        <SectionBadge label="Para quem é" />
        <h2 className={`mt-8 max-w-3xl ${landingSectionTitleClass}`}>
          Construído para todo tipo de aprendiz
        </h2>
        <p className={landingSectionIntroClass}>
          Escolha seu perfil e veja como o Kivora se adapta ao seu ritmo de estudo.
        </p>
        <Card
          data-landing-circuit-target="audience"
          className="relative mt-10 flex min-h-[430px] flex-col overflow-hidden border-brand-dark p-0"
        >
          <div
            ref={tabListRef}
            className="relative flex w-full shrink-0 border-b border-brand-dark sm:grid sm:grid-cols-3"
          >
            <m.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 rounded-t-[13px] bg-brand-dark"
              initial={false}
              animate={{
                width: indicator.width,
                left: indicator.left,
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              style={{ borderRadius: '13px 13px 0 0' }}
            />
            {audiences.map((audience, index) => {
              const isActive = index === activeIndex

              return (
                <button
                  key={audience.id}
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="relative z-10 min-h-11 w-full flex-1 touch-manipulation px-2 py-4 text-center text-xs font-semibold leading-tight transition-colors duration-200 sm:px-3 sm:py-5 sm:text-base"
                >
                  <span className={isActive ? 'text-white' : 'text-brand-secondary hover:text-brand-dark'}>
                    {audience.label}
                  </span>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={activeAudience.id}
              initial={isIOS ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={isIOS ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={contentTransition}
              className="flex min-h-0 w-full flex-1 flex-col"
            >
              <div className="w-full shrink-0 border-b border-brand-dark bg-bg-primary">
                <p className="px-6 py-4 text-sm font-medium text-brand-secondary sm:px-8 sm:text-base">
                  {activeAudience.pitch}
                </p>
              </div>
              <div className="relative min-h-0 w-full flex-1">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden md:block"
                >
                  <span className="absolute bottom-0 left-1/3 top-0 border-l border-brand-dark" />
                  <span className="absolute bottom-0 left-2/3 top-0 border-l border-brand-dark" />
                </div>
                <div className="grid h-full min-h-0 gap-0 md:grid-cols-3 md:grid-rows-1">
                {activeAudience.metrics.map((metric, metricIndex) => {
                  const Icon = metric.icon

                  return (
                    <m.div
                      key={metric.title}
                      initial={isIOS ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        ...contentTransition,
                        delay: isIOS ? 0 : metricIndex * 0.07,
                      }}
                      className="relative z-10 flex min-h-full flex-col items-center justify-center border-b border-brand-dark p-6 last:border-b-0 sm:p-8 md:border-b-0"
                    >
                      <Icon className="mx-auto h-7 w-7 text-brand-secondary" />
                      <m.p
                        initial={isIOS ? false : { scale: 0.92 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 520, damping: 28, delay: isIOS ? 0 : 0.08 + metricIndex * 0.05 }}
                        className="mt-4 font-heading text-4xl font-bold text-brand-dark"
                      >
                        {metric.value}
                      </m.p>
                      <p className="mt-3 font-semibold text-brand-dark">{metric.title}</p>
                      <p className="mt-1 text-sm text-brand-secondary">{metric.description}</p>
                    </m.div>
                  )
                })}
                </div>
              </div>
            </m.div>
          </AnimatePresence>
        </Card>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
