'use client'

import {
  BarChart3,
  Compass,
  MessageSquareText,
  Repeat2,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useRef, useState } from 'react'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { landingRadiusLg } from '@/lib/landingStyles'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

type AudienceBenefit = {
  icon: LucideIcon
  title: string
  description: string
}

type Audience = {
  id: string
  label: string
  eyebrow: string
  pitch: string
  benefits: AudienceBenefit[]
}

const audiences: Audience[] = [
  {
    id: 'iniciantes',
    label: 'Estou começando',
    eyebrow: 'Base sem pressão',
    pitch: 'Comece com frases que resolvem situações reais e uma rotina que cabe no seu dia.',
    benefits: [
      { icon: Compass, title: 'Caminho guiado', description: 'Você sempre sabe o que praticar em seguida.' },
      { icon: Sparkles, title: 'Correção acolhedora', description: 'Entenda o erro sem interromper sua confiança.' },
      { icon: Repeat2, title: 'Revisão automática', description: 'O Kivora traz cada palavra de volta na hora certa.' },
    ],
  },
  {
    id: 'intermediarios',
    label: 'Quero destravar',
    eyebrow: 'Fluência no cotidiano',
    pitch: 'Transforme o inglês que você já conhece em respostas mais rápidas e naturais.',
    benefits: [
      { icon: MessageSquareText, title: 'Conversa contextual', description: 'Treine reuniões, viagens e situações criadas por você.' },
      { icon: Target, title: 'Erros que viram prática', description: 'Gargalos recorrentes alimentam suas próximas missões.' },
      { icon: Repeat2, title: 'Vocabulário ativo', description: 'Revise menos por acaso e use mais no contexto certo.' },
    ],
  },
  {
    id: 'avancados',
    label: 'Quero refinar',
    eyebrow: 'Precisão e naturalidade',
    pitch: 'Ajuste nuance, ritmo e clareza em contextos que exigem mais do seu inglês.',
    benefits: [
      { icon: Trophy, title: 'Desafios sob pressão', description: 'Blitz e cenários de IA exigem decisões mais rápidas.' },
      { icon: MessageSquareText, title: 'Feedback fino', description: 'Trabalhe escolha de palavras, tom e construção de argumento.' },
      { icon: BarChart3, title: 'Progresso visível', description: 'Veja padrões, pontos fortes e o próximo foco com clareza.' },
    ],
  },
]

export default function AudienceTabs() {
  const [activeIndex, setActiveIndex] = useState(1)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reducedMotion = useHydratedReducedMotion()
  const active = audiences[activeIndex]

  return (
    <LandingSectionFrame id="para-quem" band="soft" className="scroll-mt-24 py-20 sm:py-24">
      <RevealOnScroll className="mx-auto max-w-6xl">
        <LandingSectionHeader
          badge="Feito para evoluir com você"
          title="Seu momento muda. A prática acompanha."
          titleClassName="max-w-4xl"
          description="Escolha onde você está agora e veja como o Kivora organiza o próximo passo."
        />

        <div className={`mt-10 overflow-hidden ${landingRadiusLg} border border-brand-dark/25 bg-bg-card shadow-[0_18px_55px_rgba(28,25,21,0.06)]`}>
          <div role="tablist" aria-label="Momento no aprendizado" className="grid border-b border-brand-dark/20 md:grid-cols-3">
            {audiences.map((audience, index) => {
              const selected = index === activeIndex
              return (
                <button
                  key={audience.id}
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  id={`audience-tab-${audience.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  aria-controls="audience-panel"
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => {
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                    event.preventDefault()
                    const nextIndex =
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? audiences.length - 1
                          : event.key === 'ArrowRight'
                            ? (index + 1) % audiences.length
                            : (index - 1 + audiences.length) % audiences.length
                    setActiveIndex(nextIndex)
                    tabRefs.current[nextIndex]?.focus()
                  }}
                  className={`relative min-h-14 overflow-hidden border-b border-brand-dark/15 px-4 py-4 text-left font-heading text-sm font-bold transition-colors last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${selected ? 'text-white' : 'text-brand-secondary hover:bg-bg-primary hover:text-brand-dark'}`}
                >
                  {selected ? (
                    <m.span
                      layoutId="audience-active-tab"
                      className="absolute inset-0 bg-brand-dark"
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative z-10 flex items-center justify-between gap-3">
                    {audience.label}
                    <span className={`h-2 w-2 rounded-full border ${selected ? 'border-white bg-brand-accent' : 'border-brand-dark/30'}`} />
                  </span>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={active.id}
              id="audience-panel"
              role="tabpanel"
              aria-labelledby={`audience-tab-${active.id}`}
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
              className="grid lg:grid-cols-[0.82fr_1.18fr]"
            >
              <div className="flex min-h-[270px] flex-col justify-between border-b border-brand-dark/20 bg-bg-primary/60 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div>
                  <span className="inline-flex rounded-full border border-brand-dark/20 bg-bg-card px-3 py-1 font-heading text-2xs font-bold uppercase tracking-wider text-brand-secondary">
                    {active.eyebrow}
                  </span>
                  <p className="mt-6 max-w-lg font-section text-3xl font-semibold leading-tight text-brand-dark sm:text-4xl">
                    {active.pitch}
                  </p>
                </div>
                <a href="/register" className="mt-8 inline-flex w-fit items-center gap-2 font-heading text-sm font-bold text-brand-dark underline decoration-brand-accent decoration-4 underline-offset-4">
                  Montar minha rotina →
                </a>
              </div>
              <div className="grid sm:grid-cols-3">
                {active.benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <m.div
                      key={benefit.title}
                      initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reducedMotion ? 0 : index * 0.05, duration: 0.25 }}
                      className="group border-b border-brand-dark/15 p-6 last:border-b-0 hover:bg-bg-primary/65 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-7"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-brand-dark/25 bg-bg-primary transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-brand-dark">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-7 font-heading text-lg font-bold text-brand-dark">{benefit.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-brand-secondary">{benefit.description}</p>
                    </m.div>
                  )
                })}
              </div>
            </m.div>
          </AnimatePresence>
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
