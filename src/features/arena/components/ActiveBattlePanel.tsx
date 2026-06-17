import { m } from 'framer-motion'
import { Swords, Flame } from 'lucide-react'
import Image from 'next/image'

interface PlayerStats {
  username: string
  score: number
  progress: number
  wrong: number
  percent: number
}

interface ActiveBattlePanelProps {
  packName: string
  remainingTime: number
  timePercent: number
  isFinalMinute: boolean
  currentRoundLabel: string
  currentRoundValue: number
  totalCards: number
  scoreDelta: number
  me: PlayerStats
  opponent: PlayerStats
  gameType: string
  remainingCards: number
  formatTime: (seconds: number) => string
}

export default function ActiveBattlePanel({
  packName,
  remainingTime,
  timePercent,
  isFinalMinute,
  currentRoundLabel,
  currentRoundValue,
  totalCards,
  scoreDelta,
  me,
  opponent,
  gameType,
  remainingCards,
  formatTime,
}: ActiveBattlePanelProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 overflow-hidden rounded-[1.35rem] border border-red-950/25 bg-[linear-gradient(145deg,rgba(69,10,10,0.98),rgba(24,24,27,0.96)_48%,rgba(127,29,29,0.94))] shadow-[0_22px_70px_rgba(127,29,29,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] sm:mb-6 sm:rounded-[1.75rem]"
    >
      <div className="relative p-3 text-white sm:p-5 lg:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(252,211,77,0.85),rgba(248,113,113,0.9),transparent)]" />
        <div className="absolute left-0 top-0 h-full w-20 bg-[linear-gradient(90deg,rgba(248,113,113,0.16),transparent)]" />
        <div className="absolute right-0 top-0 h-full w-20 bg-[linear-gradient(270deg,rgba(245,158,11,0.12),transparent)]" />
        
        {/* Top Info Bar */}
        <div className="relative z-10 mb-4 grid gap-3 sm:mb-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border border-red-300/15 bg-red-500/15 text-red-100 shadow-[0_0_24px_rgba(248,113,113,0.22)]">
              <Flame className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-200/70">Arena ao vivo</p>
              <p className="truncate text-xs font-black uppercase tracking-[0.08em] text-red-50 sm:text-sm">
                {packName}
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[260px] rounded-[1rem] border border-white/10 bg-black/24 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:w-[260px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-red-100/58">Tempo</span>
              <span className={`text-lg font-black tabular-nums leading-none ${isFinalMinute ? 'text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,0.45)]' : 'text-white'}`}>
                {formatTime(remainingTime)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <m.div
                className={`h-full rounded-full ${isFinalMinute ? 'bg-[linear-gradient(90deg,#f97316,#facc15)]' : 'bg-[linear-gradient(90deg,#ef4444,#f59e0b)]'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${timePercent}%` }}
                transition={{ duration: 0.25, ease: 'linear' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <span className="rounded-[0.8rem] border border-white/10 bg-white/8 px-3 py-2 text-center">
              <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/48">{currentRoundLabel}</span>
              <span className="text-sm font-black tabular-nums text-white">{currentRoundValue}/{totalCards}</span>
            </span>
            <span className={`rounded-[0.8rem] border px-3 py-2 text-center ${scoreDelta >= 0 ? 'border-primary/20 bg-primary-light text-primary dark:border-primary/20 dark:bg-primary/10' : 'border-amber-300/20 bg-amber-400/10 text-amber-100'}`}>
              <span className="block text-[9px] font-black uppercase tracking-[0.18em] opacity-70">Saldo</span>
              <span className="text-sm font-black tabular-nums">{scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}</span>
            </span>
          </div>
        </div>

        {/* Players Duel Panel - Refactored for Mobile & Visuals */}
        <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-stretch gap-1.5 sm:gap-4 lg:gap-6">
          
          {/* Player 1 (Me) */}
          <div className="relative min-w-0 overflow-hidden rounded-[1rem] border border-red-200/12 bg-[linear-gradient(145deg,rgba(248,113,113,0.18),rgba(255,255,255,0.06))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:rounded-[1.35rem] sm:p-4">
            <Image 
              src="/images/arena/undraw-ninja.svg" 
              alt="Ninja" 
              width={100} 
              height={100} 
              className="absolute -bottom-6 -right-6 opacity-[0.15] mix-blend-plus-lighter"
            />
            <div className="relative z-10">
              <div className="mb-2 flex items-start justify-between gap-1.5 sm:mb-3 sm:gap-2">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] border border-red-200/20 bg-red-500/20 text-xs font-black text-red-50 shadow-[0_0_18px_rgba(248,113,113,0.22)] sm:h-12 sm:w-12 sm:rounded-[0.9rem] sm:text-sm">
                    {me.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-red-100/58 sm:text-[9px]">Você</p>
                    <p className="truncate text-xs font-black text-white sm:text-base">{me.username}</p>
                  </div>
                </div>
                <span className="text-2xl font-black leading-none tabular-nums text-red-100 drop-shadow-[0_0_14px_rgba(248,113,113,0.28)] sm:text-4xl">
                  {me.score}
                </span>
              </div>
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.14em] text-red-100/58 sm:text-[10px]">
                <span>Avanço</span>
                <span>{me.progress}/{totalCards}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border border-red-200/10 bg-black/22 sm:mt-2 sm:h-3">
                <m.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#b91c1c,#ef4444,#f97316)] shadow-[0_0_18px_rgba(248,113,113,0.65)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${me.percent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-red-50/58 sm:mt-3 sm:text-[10px]">
                <span>Erros: {me.wrong}</span>
                <span>{Math.round(me.percent)}%</span>
              </div>
            </div>
          </div>

          {/* VS Center */}
          <m.div
            className="relative flex w-8 shrink-0 items-center justify-center sm:w-16"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute h-full w-px bg-[linear-gradient(180deg,transparent,rgba(252,211,77,0.7),transparent)]" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-[0.8rem] border border-amber-200/22 bg-black/35 text-amber-100 shadow-[0_0_26px_rgba(245,158,11,0.22)] sm:h-14 sm:w-14 sm:rounded-[1rem]">
              <div className="absolute inset-1 rounded-[0.8rem] bg-red-500/14 blur-sm" />
              <Swords className="relative h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </m.div>

          {/* Player 2 (Opponent) */}
          <div className="relative min-w-0 overflow-hidden rounded-[1rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(39,39,42,0.42))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:rounded-[1.35rem] sm:p-4">
            <Image 
              src="/images/arena/undraw-game-world.svg" 
              alt="Game World" 
              width={110} 
              height={110} 
              className="absolute -bottom-5 -left-8 opacity-[0.12] mix-blend-plus-lighter"
            />
            <div className="relative z-10">
              <div className="mb-2 flex items-start justify-between gap-1.5 sm:mb-3 sm:gap-2">
                <span className="text-2xl font-black leading-none tabular-nums text-white/74 sm:text-4xl">
                  {opponent.score}
                </span>
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/42 sm:text-[9px]">Oponente</p>
                    <p className="truncate text-xs font-black text-white sm:text-base">{opponent.username}</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] border border-white/12 bg-white/8 text-xs font-black text-white/76 sm:h-12 sm:w-12 sm:rounded-[0.9rem] sm:text-sm">
                    {opponent.username.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.14em] text-white/42 sm:text-[10px]">
                <span>{opponent.progress}/{totalCards}</span>
                <span>Avanço</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/22 sm:mt-2 sm:h-3">
                <m.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.62),rgba(252,211,77,0.58))]"
                  initial={{ width: 0 }}
                  animate={{ width: `${opponent.percent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-white/45 sm:mt-3 sm:text-[10px]">
                <span>{Math.round(opponent.percent)}%</span>
                <span>Erros: {opponent.wrong}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 text-center sm:mt-5">
          <div className="rounded-[0.8rem] border border-white/10 bg-black/20 px-2 py-1.5 sm:rounded-[0.95rem] sm:px-3 sm:py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/42 sm:text-[9px]">Modo</p>
            <p className="mt-0.5 truncate text-[10px] font-black capitalize text-white/82 sm:text-xs">{gameType}</p>
          </div>
          <div className="rounded-[0.8rem] border border-red-200/12 bg-red-500/10 px-2 py-1.5 sm:rounded-[0.95rem] sm:px-3 sm:py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-red-100/52 sm:text-[9px]">Pressão</p>
            <p className="mt-0.5 text-[10px] font-black text-red-50 sm:text-xs">{isFinalMinute ? 'Máxima' : 'Estável'}</p>
          </div>
          <div className="rounded-[0.8rem] border border-amber-200/14 bg-amber-400/10 px-2 py-1.5 sm:rounded-[0.95rem] sm:px-3 sm:py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-100/52 sm:text-[9px]">Alvo</p>
            <p className="mt-0.5 text-[10px] font-black text-amber-50 sm:text-xs">{remainingCards} restam</p>
          </div>
        </div>
      </div>
    </m.div>
  )
}
