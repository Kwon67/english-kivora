'use client'

import Image from 'next/image'
import { m } from 'framer-motion'
import { Mic, Volume2, Sparkles } from 'lucide-react'

export default function TutorHeader() {
  const waveDelays = [0.2, 0.5, 0.3, 0.7, 0.4]

  return (
    <div className="overflow-hidden rounded-[32px] shadow-[0_24px_70px_rgba(31,43,18,0.10)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
      <header className="render-contained group relative isolate overflow-hidden rounded-[inherit] border border-[#172113]/20 dark:border-[#d5e6a9]/20 bg-[#fbfcf2]/65 dark:bg-[#11160e]/65 px-6 py-6 backdrop-blur-md sm:px-8 sm:py-8 lg:py-8 transition-colors duration-300">
      {/* Background Decorative Mesh & Glows */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-[#fbfcf2]/40 via-transparent to-[#183b16]/5 dark:to-[#b8ff5c]/5" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 blur-3xl" />
      
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#183b16]/10 dark:border-[#b8ff5c]/10 bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#183b16] dark:text-[#b8ff5c]">
              Beta
            </span>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#183b16]/10 dark:border-[#b8ff5c]/10 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#183b16] dark:text-[#b8ff5c]">Conversação guiada</p>
          </div>
          <h1 className="max-w-3xl font-montserrat text-4xl font-bold tracking-tight text-[#10130f] dark:text-[#f4f7e9] sm:text-5xl">
            Tutor de Voz IA
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#425039] dark:text-[#b9c3a4] sm:text-lg">
            Pratique inglês em cenas curtas com resposta por voz, correção contextual e ritmo de conversa real.
          </p>

          {/* Core Feature Badges with micro-interactions */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <m.div 
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-[24px] border border-[#172113]/15 dark:border-[#d5e6a9]/15 bg-[#fbfcf2]/50 dark:bg-[#11160e]/50 p-3 shadow-[0_12px_34px_rgba(31,43,18,0.06)] dark:shadow-[0_12px_34px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300 hover:border-[#183b16]/30 dark:hover:border-[#b8ff5c]/30 hover:shadow-[0_16px_42px_rgba(24,59,22,0.08)] dark:hover:shadow-[0_16px_42px_rgba(0,0,0,0.3)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c] shadow-sm">
                <Mic className="h-4.5 w-4.5" />
              </div>
              <p className="mt-2 text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">Voz ativa</p>
              <p className="mt-1 text-xs leading-relaxed text-[#425039] dark:text-[#b9c3a4]">Reconhecimento em inglês</p>
            </m.div>

            <m.div 
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-[24px] border border-[#172113]/15 dark:border-[#d5e6a9]/15 bg-[#fbfcf2]/50 dark:bg-[#11160e]/50 p-3 shadow-[0_12px_34px_rgba(31,43,18,0.06)] dark:shadow-[0_12px_34px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300 hover:border-[#183b16]/30 dark:hover:border-[#b8ff5c]/30 hover:shadow-[0_16px_42px_rgba(24,59,22,0.08)] dark:hover:shadow-[0_16px_42px_rgba(0,0,0,0.3)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c] shadow-sm">
                <Volume2 className="h-4.5 w-4.5" />
              </div>
              <p className="mt-2 text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">Resposta falada</p>
              <p className="mt-1 text-xs leading-relaxed text-[#425039] dark:text-[#b9c3a4]">Áudio natural por turno</p>
            </m.div>

            <m.div 
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-[24px] border border-[#172113]/15 dark:border-[#d5e6a9]/15 bg-[#fbfcf2]/50 dark:bg-[#11160e]/50 p-3 shadow-[0_12px_34px_rgba(31,43,18,0.06)] dark:shadow-[0_12px_34px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-300 hover:border-[#183b16]/30 dark:hover:border-[#b8ff5c]/30 hover:shadow-[0_16px_42px_rgba(24,59,22,0.08)] dark:hover:shadow-[0_16px_42px_rgba(0,0,0,0.3)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c] shadow-sm">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <p className="mt-2 text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">Dicas rápidas</p>
              <p className="mt-1 text-xs leading-relaxed text-[#425039] dark:text-[#b9c3a4]">Correções sem interromper</p>
            </m.div>
          </div>
        </div>

        {/* Right Side: Animated unDraw Illustration */}
        <div className="relative mx-auto flex w-full max-w-xs items-center justify-center">
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-[#183b16]/10 to-transparent blur-xl" />
          
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
            className="relative z-10 w-full overflow-hidden rounded-[28px] border border-[#172113]/15 dark:border-[#d5e6a9]/15 bg-[#fbfcf2]/50 dark:bg-[#11160e]/50 p-3 shadow-[0_22px_64px_rgba(31,43,18,0.08)] dark:shadow-[0_22px_64px_rgba(0,0,0,0.3)] backdrop-blur-sm"
          >
            <Image
              src="/images/home/undraw-voice-control.svg"
              alt="Ilustração unDraw de controle de voz e tutor de inteligência artificial"
              width={692}
              height={500}
              unoptimized
              className="max-h-48 w-full object-contain filter drop-shadow-sm select-none"
            />

            {/* Floating Audio Waves Medallion */}
            <m.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -bottom-3 -right-3 flex h-12 w-20 items-end justify-center gap-1 rounded-[24px] border border-[#172113]/15 dark:border-[#d5e6a9]/15 bg-[#fbfcf2]/80 dark:bg-[#11160e]/80 px-3 py-2.5 shadow-[0_16px_42px_rgba(31,43,18,0.08)] dark:shadow-[0_16px_42px_rgba(0,0,0,0.3)] backdrop-blur-md"
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
                  className="h-7 w-1.5 origin-bottom rounded-full bg-[#183b16] dark:bg-[#b8ff5c]"
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
