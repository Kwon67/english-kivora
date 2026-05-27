'use client'

import Image from 'next/image'
import { m } from 'framer-motion'
import { Mic, Volume2, Sparkles } from 'lucide-react'

export default function TutorHeader() {
  const waveDelays = [0.2, 0.5, 0.3, 0.7, 0.4]

  return (
    <header className="premium-card relative overflow-hidden p-6 sm:p-8 lg:p-10 group">
      {/* Background Decorative Mesh & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-light)/0.3,transparent_60%)] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[var(--color-primary)]/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[var(--color-secondary)]/[0.03] rounded-full blur-3xl pointer-events-none" />
      
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center relative z-10">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="stitch-pill bg-[var(--color-primary-container)] text-[var(--color-primary)] font-black text-[10px] tracking-widest uppercase">
              Beta
            </span>
            <p className="section-kicker">Conversação guiada</p>
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl">
            Tutor de Voz IA
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
            Pratique inglês em cenas curtas com resposta por voz, correção contextual e ritmo de conversa real.
          </p>

          {/* Core Feature Badges with micro-interactions */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <m.div 
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[var(--color-surface-container-low)] border border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/20 p-4 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm">
                <Mic className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-sm font-black text-[var(--color-text)]">Voz ativa</p>
              <p className="mt-1 text-xs text-[var(--color-text-subtle)] leading-relaxed">Reconhecimento em inglês</p>
            </m.div>

            <m.div 
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[var(--color-surface-container-low)] border border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/20 p-4 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm">
                <Volume2 className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-sm font-black text-[var(--color-text)]">Resposta falada</p>
              <p className="mt-1 text-xs text-[var(--color-text-subtle)] leading-relaxed">Áudio natural por turno</p>
            </m.div>

            <m.div 
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-[var(--color-surface-container-low)] border border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/20 p-4 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-sm font-black text-[var(--color-text)]">Dicas rápidas</p>
              <p className="mt-1 text-xs text-[var(--color-text-subtle)] leading-relaxed">Correções sem interromper</p>
            </m.div>
          </div>
        </div>

        {/* Right Side: Animated unDraw Illustration */}
        <div className="relative mx-auto flex w-full max-w-sm items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary-light)]/20 to-[var(--color-secondary-light)]/10 rounded-[2rem] blur-xl pointer-events-none" />
          
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
            className="relative z-10 w-full rounded-[1.75rem] bg-[var(--color-surface-container-low)] border border-[var(--color-border)]/40 p-5 shadow-lg"
          >
            <Image
              src="/images/home/undraw-voice-control.svg"
              alt="Ilustração unDraw de controle de voz e tutor de inteligência artificial"
              width={692}
              height={500}
              unoptimized
              className="h-auto w-full object-contain filter drop-shadow-sm select-none"
            />

            {/* Floating Audio Waves Medallion */}
            <m.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -right-3 -bottom-3 flex items-end gap-1 px-4 py-3 bg-[var(--color-card)]/80 backdrop-blur-md rounded-2xl border border-[var(--color-border)] shadow-lg shadow-black/5 justify-center h-14 w-24"
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
                  className="w-1.5 h-8 bg-[var(--color-primary)] rounded-full origin-bottom"
                />
              ))}
            </m.div>
          </m.div>
        </div>
      </div>
    </header>
  )
}
