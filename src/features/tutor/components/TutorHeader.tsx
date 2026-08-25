'use client'

import Image from 'next/image'
import { m } from 'motion/react'
import { Mic, Volume2, Sparkles } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingRadius } from '@/lib/landingStyles'
import { homeIconBox } from '@/lib/homeStyles'
import {
  tutorFrostedSubtle,
  tutorHeroCard,
  tutorNestedCard,
} from '@/features/tutor/lib/tutorPageUi'

export default function TutorHeader() {
  const waveDelays = [0.2, 0.5, 0.3, 0.7, 0.4]

  return (
    <section className={tutorHeroCard}>
      <div className="flex items-center justify-between gap-3 border-b border-brand-dark px-5 py-3">
        <MacTrafficLights />
        <MacWindowControlButtons />
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
        <div>
          <SectionBadge label="Conversação guiada · B2" />
          <h1 className="mt-6 max-w-3xl font-heading text-4xl font-bold leading-[1.1] text-brand-dark sm:text-5xl">
            Tutor de Voz IA
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-brand-secondary sm:text-lg">
            Pratique inglês em cenas curtas com voz ou texto, correção contextual e cenários B2 para o trabalho.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Mic, title: 'Voz ativa', description: 'Reconhecimento em inglês' },
              { icon: Volume2, title: 'Resposta falada', description: 'Áudio natural por turno' },
              { icon: Sparkles, title: 'Dicas rápidas', description: 'Correções sem interromper' },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <m.div
                  key={feature.title}
                  whileHover={{ y: -2 }}
                  className={`${tutorNestedCard} p-4`}
                >
                  <div className={`h-9 w-9 ${homeIconBox}`}>
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <p className="mt-3 font-body text-sm font-semibold text-brand-dark">{feature.title}</p>
                  <p className="mt-1 font-body text-xs leading-relaxed text-brand-secondary">{feature.description}</p>
                </m.div>
              )
            })}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-xs items-center justify-center">
          <m.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, 0.5, -0.5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: 'easeInOut',
            }}
            className="relative z-10 w-full"
          >
            <div className={`overflow-hidden ${tutorNestedCard} bg-bg-primary p-3`}>
              <Image
                src="/images/home/undraw-voice-control.svg"
                alt="Ilustração unDraw de controle de voz e tutor de inteligência artificial"
                width={692}
                height={500}
                unoptimized
                className="max-h-48 w-full object-contain select-none"
              />
            </div>

            <m.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className={`absolute -bottom-3 -right-3 flex h-12 w-20 items-end justify-center gap-1 ${landingRadius} border border-brand-dark bg-bg-card px-3 py-2.5 ${tutorFrostedSubtle}`}
            >
              {waveDelays.map((delay, i) => (
                <m.div
                  key={i}
                  animate={{ scaleY: [0.25, 1, 0.25] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.1,
                    delay,
                    ease: 'easeInOut',
                  }}
                  className="h-7 w-1.5 origin-bottom rounded-full bg-brand-dark"
                />
              ))}
            </m.div>
          </m.div>
        </div>
      </div>
    </section>
  )
}
