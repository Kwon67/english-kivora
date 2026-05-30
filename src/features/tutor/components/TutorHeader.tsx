'use client'

import Image from 'next/image'
import { m } from 'framer-motion'
import { Mic, Volume2, Sparkles } from 'lucide-react'

export default function TutorHeader() {
  const waveDelays = [0.2, 0.5, 0.3, 0.7, 0.4]

  return (
    <header className="group relative overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 p-6 shadow-[var(--shadow-xl)] backdrop-blur-md sm:p-8 lg:p-10">
      {/* Background Decorative Mesh & Glows */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center relative z-10">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-900/10 bg-emerald-50/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-800">
              Beta
            </span>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800">Conversação guiada</p>
          </div>
          <h1 className="max-w-3xl font-montserrat text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Tutor de Voz IA
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Pratique inglês em cenas curtas com resposta por voz, correção contextual e ritmo de conversa real.
          </p>

          {/* Core Feature Badges with micro-interactions */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <m.div 
              whileHover={{ y: -4 }}
              className="rounded-[24px] border border-zinc-200/55 bg-white/35 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-emerald-800/20 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 shadow-sm">
                <Mic className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-sm font-black text-zinc-900">Voz ativa</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">Reconhecimento em inglês</p>
            </m.div>

            <m.div 
              whileHover={{ y: -4 }}
              className="rounded-[24px] border border-zinc-200/55 bg-white/35 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-emerald-800/20 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 shadow-sm">
                <Volume2 className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-sm font-black text-zinc-900">Resposta falada</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">Áudio natural por turno</p>
            </m.div>

            <m.div 
              whileHover={{ y: -4 }}
              className="rounded-[24px] border border-zinc-200/55 bg-white/35 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-emerald-800/20 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 shadow-sm">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-sm font-black text-zinc-900">Dicas rápidas</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">Correções sem interromper</p>
            </m.div>
          </div>
        </div>

        {/* Right Side: Animated unDraw Illustration */}
        <div className="relative mx-auto flex w-full max-w-sm items-center justify-center">
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-emerald-50/45 to-sky-50/30 blur-xl" />
          
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
            className="relative z-10 w-full rounded-[32px] border border-zinc-200/55 bg-white/35 p-5 shadow-lg backdrop-blur-sm"
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
              className="absolute -bottom-3 -right-3 flex h-14 w-24 items-end justify-center gap-1 rounded-[24px] border border-zinc-200/60 bg-white/70 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-md"
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
                  className="h-8 w-1.5 origin-bottom rounded-full bg-emerald-800"
                />
              ))}
            </m.div>
          </m.div>
        </div>
      </div>
    </header>
  )
}
