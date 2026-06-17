'use client'

import Image from 'next/image'
import { m } from 'framer-motion'
import { Mic, Volume2, Sparkles } from 'lucide-react'

export default function TutorHeader() {
  const waveDelays = [0.2, 0.5, 0.3, 0.7, 0.4]

  return (
    <div className="relative rounded-[22px]">
      <header className="home-glass-panel render-contained group relative isolate overflow-hidden rounded-[22px] border border-border-muted/20 bg-card px-6 py-6 shadow-[0_18px_48px_rgba(31,43,18,0.14)] transition-colors duration-300 sm:px-8 sm:py-8 lg:py-8 dark:border-border-accent/20 dark:bg-card dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]">
      {/* Background sheen */}
      <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
      
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/10 dark:border-primary/10 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Beta
            </span>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/10 dark:border-primary/10 bg-primary/5 px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-primary">Conversação guiada</p>
          </div>
          <h1 className="max-w-3xl font-montserrat text-4xl font-bold tracking-tight text-text dark:text-text sm:text-5xl">
            Tutor de Voz IA
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted dark:text-text-muted sm:text-lg">
            Pratique inglês em cenas curtas com resposta por voz, correção contextual e ritmo de conversa real.
          </p>
 
          {/* Core Feature Badges with micro-interactions */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <m.div 
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-3 shadow-[0_12px_34px_rgba(31,43,18,0.08)] transition-all duration-300 hover:border-primary/30 hover:shadow-[0_16px_42px_rgba(24,59,22,0.08)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] dark:hover:border-primary/30"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <Mic className="h-4.5 w-4.5" />
              </div>
              <p className="mt-2 text-sm font-bold text-text dark:text-text">Voz ativa</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted dark:text-text-muted">Reconhecimento em inglês</p>
            </m.div>
 
            <m.div 
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-3 shadow-[0_12px_34px_rgba(31,43,18,0.08)] transition-all duration-300 hover:border-primary/30 hover:shadow-[0_16px_42px_rgba(24,59,22,0.08)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] dark:hover:border-primary/30"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <Volume2 className="h-4.5 w-4.5" />
              </div>
              <p className="mt-2 text-sm font-bold text-text dark:text-text">Resposta falada</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted dark:text-text-muted">Áudio natural por turno</p>
            </m.div>
 
            <m.div 
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-3 shadow-[0_12px_34px_rgba(31,43,18,0.08)] transition-all duration-300 hover:border-primary/30 hover:shadow-[0_16px_42px_rgba(24,59,22,0.08)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] dark:hover:border-primary/30"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <p className="mt-2 text-sm font-bold text-text dark:text-text">Dicas rápidas</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted dark:text-text-muted">Correções sem interromper</p>
            </m.div>
          </div>
        </div>
 
        {/* Right Side: Animated unDraw Illustration */}
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
            className="relative z-10 w-full rounded-[20px]"
          >
            <div className="overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-3 shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
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
              className="absolute -bottom-3 -right-3 flex h-12 w-20 items-end justify-center gap-1 rounded-[20px] border border-dashed border-border-muted/22 bg-card px-3 py-2.5 shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]"
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
                  className="h-7 w-1.5 origin-bottom rounded-full bg-primary"
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
