'use client'

import Image from 'next/image'
import { Activity, Radio, Trophy } from 'lucide-react'
import { m } from 'framer-motion'

type ArenaHeroVisualProps = {
  status: 'active' | 'pending' | 'idle'
  onlineCount: number
  pendingCount: number
  energy: number
  rankLabel: string
}

const statusCopy: Record<ArenaHeroVisualProps['status'], string> = {
  active: 'Duelo ativo',
  pending: 'Pareamento aberto',
  idle: 'Pronto para duelo',
}

export default function ArenaHeroVisual({
  status,
  onlineCount,
  pendingCount,
  energy,
  rankLabel,
}: ArenaHeroVisualProps) {
  return (
    <div className="relative mx-auto min-h-[19rem] w-full max-w-[30rem] overflow-hidden rounded-[22px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] p-4 shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] sm:min-h-[22rem]">
      <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
      <svg
        aria-hidden="true"
        viewBox="0 0 420 320"
        className="absolute inset-0 h-full w-full opacity-50"
      >
        <defs>
          <pattern id="arena-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0v28" fill="none" stroke="rgba(39,99,86,0.15)" strokeWidth="1" />
          </pattern>
          <linearGradient id="arena-sweep" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="rgba(39,99,86,0.18)" />
            <stop offset="1" stopColor="rgba(49,90,134,0.18)" />
          </linearGradient>
        </defs>
        <rect width="420" height="320" fill="url(#arena-grid)" />
        <path d="M50 257C118 130 204 84 364 62" fill="none" stroke="url(#arena-sweep)" strokeLinecap="round" strokeWidth="42" />
      </svg>

      <m.div
        animate={{ y: [0, -8, 0], rotate: [0, 0.8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
        className="relative z-10 mx-auto mt-5 w-[88%]"
      >
        <Image
          src="/images/arena/arena-command.svg"
          alt="Painel visual da arena com rotas de duelo e marcadores de jogadores"
          width={760}
          height={560}
          loading="eager"
          fetchPriority="high"
          unoptimized
          className="h-auto w-full"
        />
      </m.div>

      <m.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
        className="absolute left-4 top-4 z-20 rounded-[0.8rem] border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#f7f8ef] dark:bg-[#11160e] px-3 py-2 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#183b16] opacity-40 dark:bg-[#b8ff5c]" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#183b16] dark:bg-[#b8ff5c]" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#425039] dark:text-[#b9c3a4]">
            {statusCopy[status]}
          </span>
        </div>
      </m.div>

      <m.div
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
        className="absolute right-4 top-10 z-20 rounded-[0.8rem] border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#f7f8ef] dark:bg-[#11160e] px-3 py-2 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-[#183b16] dark:text-[#b8ff5c]" strokeWidth={2.4} />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#425039] dark:text-[#b9c3a4]">
            {onlineCount} online
          </span>
        </div>
      </m.div>

      <div className="absolute inset-x-4 bottom-4 z-20 grid grid-cols-3 gap-2">
        <div className="rounded-[18px] border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#f7f8ef] dark:bg-[#11160e] px-3 py-2 shadow-sm">
          <Activity className="h-4 w-4 text-[#183b16] dark:text-[#b8ff5c]" strokeWidth={2.4} />
          <p className="mt-1 text-sm font-black text-[#10130f] dark:text-[#f4f7e9]">{energy}%</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#425039]/60 dark:text-[#b9c3a4]/60">foco</p>
        </div>
        <div className="rounded-[18px] border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#f7f8ef] dark:bg-[#11160e] px-3 py-2 shadow-sm">
          <Trophy className="h-4 w-4 text-[#183b16] dark:text-[#b8ff5c]" strokeWidth={2.4} />
          <p className="mt-1 text-sm font-black text-[#10130f] dark:text-[#f4f7e9]">{rankLabel}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#425039]/60 dark:text-[#b9c3a4]/60">ranking</p>
        </div>
        <div className="rounded-[18px] border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#f7f8ef] dark:bg-[#11160e] px-3 py-2 shadow-sm">
          <span className="block h-4 w-4 rounded-full border-2 border-[#183b16] dark:border-[#b8ff5c]" />
          <p className="mt-1 text-sm font-black text-[#10130f] dark:text-[#f4f7e9]">{pendingCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#425039]/60 dark:text-[#b9c3a4]/60">fila</p>
        </div>
      </div>
    </div>
  )
}
