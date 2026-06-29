'use client'

import Image from 'next/image'
import { m } from 'framer-motion'
import { Mic, Volume2, Sparkles } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'

const featureCardClass =
  'overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-card p-4 shadow-[4px_4px_0_var(--color-brand-dark)]'

export default function TutorHeader() {
  const waveDelays = [0.2, 0.5, 0.3, 0.7, 0.4]

  return (
    <div className="relative rounded-2xl">
      <header className="relative isolate overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card px-6 py-6 shadow-[8px_8px_0_var(--color-brand-dark)] sm:px-8 sm:py-8">
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
        <div>
          <SectionBadge label="Conversação guiada · B2" />
          <h1 className="mt-6 max-w-3xl font-heading text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
            Tutor de Voz IA
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-brand-secondary sm:text-lg">
            Pratique inglês em cenas curtas com voz ou texto, correção contextual e cenários B2 para o trabalho.
          </p>
 
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <m.div 
              whileHover={{ y: -4 }}
              className={featureCardClass}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-accent text-brand-dark">
                <Mic className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 font-body text-sm font-semibold text-brand-dark">Voz ativa</p>
              <p className="mt-1 font-body text-xs leading-relaxed text-brand-secondary">Reconhecimento em inglês</p>
            </m.div>
 
            <m.div 
              whileHover={{ y: -4 }}
              className={featureCardClass}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-accent text-brand-dark">
                <Volume2 className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 font-body text-sm font-semibold text-brand-dark">Resposta falada</p>
              <p className="mt-1 font-body text-xs leading-relaxed text-brand-secondary">Áudio natural por turno</p>
            </m.div>
 
            <m.div 
              whileHover={{ y: -4 }}
              className={featureCardClass}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-accent text-brand-dark">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 font-body text-sm font-semibold text-brand-dark">Dicas rápidas</p>
              <p className="mt-1 font-body text-xs leading-relaxed text-brand-secondary">Correções sem interromper</p>
            </m.div>
          </div>
        </div>
 
        <div className="relative mx-auto flex w-full max-w-xs items-center justify-center">
          <m.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 0.5, -0.5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: 'easeInOut'
            }}
            className="relative z-10 w-full rounded-xl"
          >
            <div className="overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-primary p-3 shadow-[5px_5px_0_var(--color-brand-dark)]">
              <Image
                src="/images/home/undraw-voice-control.svg"
                alt="Ilustração unDraw de controle de voz e tutor de inteligência artificial"
                width={692}
                height={500}
                unoptimized
                className="max-h-48 w-full object-contain filter drop-shadow-sm select-none"
              />
            </div>
 
            {/* Floating Audio Waves Medallion */}
            <m.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -bottom-3 -right-3 flex h-12 w-20 items-end justify-center gap-1 rounded-xl border-2 border-brand-dark bg-bg-card px-3 py-2.5 shadow-[4px_4px_0_var(--color-brand-dark)]"
            >
              {waveDelays.map((delay, i) => (
                <m.div
                  key={i}
                  animate={{ scaleY: [0.25, 1, 0.25] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.1,
                    delay: delay,
                    ease: 'easeInOut'
                  }}
                  className="h-7 w-1.5 origin-bottom rounded-full bg-brand-dark"
                />
              ))}
            </m.div>
          </m.div>
        </div>
      </div>
      </header>
    </div>
  )
}
