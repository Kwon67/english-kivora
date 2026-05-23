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
    <div className="relative mx-auto min-h-[19rem] w-full max-w-[30rem] overflow-hidden rounded-[1rem] border border-white/50 bg-white/42 p-4 shadow-[0_24px_70px_rgba(24,32,29,0.12)] backdrop-blur sm:min-h-[22rem]">
      <svg
        aria-hidden="true"
        viewBox="0 0 420 320"
        className="absolute inset-0 h-full w-full opacity-70"
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
        className="absolute left-4 top-4 z-20 rounded-[0.8rem] border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-card)]/86 px-3 py-2 shadow-[var(--shadow-sm)] backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {statusCopy[status]}
          </span>
        </div>
      </m.div>

      <m.div
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
        className="absolute right-4 top-10 z-20 rounded-[0.8rem] border border-[color-mix(in_srgb,var(--color-secondary)_18%,transparent)] bg-[var(--color-card)]/88 px-3 py-2 shadow-[var(--shadow-sm)] backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-[var(--color-secondary)]" strokeWidth={2.4} />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {onlineCount} online
          </span>
        </div>
      </m.div>

      <div className="absolute inset-x-4 bottom-4 z-20 grid grid-cols-3 gap-2">
        <div className="rounded-[0.8rem] bg-[var(--color-card)]/88 px-3 py-2 shadow-[var(--shadow-sm)] backdrop-blur">
          <Activity className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.4} />
          <p className="mt-1 text-sm font-black text-[var(--color-text)]">{energy}%</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-subtle)]">foco</p>
        </div>
        <div className="rounded-[0.8rem] bg-[var(--color-card)]/88 px-3 py-2 shadow-[var(--shadow-sm)] backdrop-blur">
          <Trophy className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={2.4} />
          <p className="mt-1 text-sm font-black text-[var(--color-text)]">{rankLabel}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-subtle)]">ranking</p>
        </div>
        <div className="rounded-[0.8rem] bg-[var(--color-card)]/88 px-3 py-2 shadow-[var(--shadow-sm)] backdrop-blur">
          <span className="block h-4 w-4 rounded-full border-2 border-[var(--color-secondary)]" />
          <p className="mt-1 text-sm font-black text-[var(--color-text)]">{pendingCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-subtle)]">fila</p>
        </div>
      </div>
    </div>
  )
}
