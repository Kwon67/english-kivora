'use client'

import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { ArrowRight, Flame, Trophy, Target, Play } from 'lucide-react'
import { DecoStar } from '@/components/ui/DecorativeSvgs'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { LeaderboardEntry } from '@/features/leaderboard/lib/leaderboard'
import { getLeaderboardTier } from '@/features/leaderboard/lib/leaderboard'

interface RankingWidgetProps {
  topLeaderboard: LeaderboardEntry[]
}

function getTierBadgeStyles(tier: string) {
  switch (tier) {
    case 'Elite':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'Diamante':
      return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    case 'Ouro':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    case 'Prata':
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    default:
      return 'bg-orange-700/10 text-orange-700 border-orange-700/20'
  }
}

function getRankStyles(rank: number) {
  switch (rank) {
    case 1:
      return {
        cardBorder: 'border-amber-400/40 hover:border-amber-400 bg-gradient-to-r from-amber-500/[0.08] via-transparent to-transparent',
        avatarRing: 'ring-4 ring-amber-400/50 shadow-md shadow-amber-400/20',
        scoreBadge: 'bg-amber-400/15 text-amber-500 border border-amber-400/30',
        rankBg: 'bg-amber-400 text-amber-950',
        shadowGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.06)]'
      }
    case 2:
      return {
        cardBorder: 'border-slate-400/40 hover:border-slate-400 bg-gradient-to-r from-slate-500/[0.08] via-transparent to-transparent',
        avatarRing: 'ring-4 ring-slate-400/40 shadow-md shadow-slate-400/15',
        scoreBadge: 'bg-slate-400/15 text-slate-600 border border-slate-400/30',
        rankBg: 'bg-slate-400 text-slate-950',
        shadowGlow: ''
      }
    case 3:
      return {
        cardBorder: 'border-amber-700/40 hover:border-amber-700 bg-gradient-to-r from-amber-700/[0.08] via-transparent to-transparent',
        avatarRing: 'ring-4 ring-amber-700/40 shadow-md shadow-amber-700/15',
        scoreBadge: 'bg-amber-700/15 text-amber-700 border border-amber-700/30',
        rankBg: 'bg-amber-700 text-amber-50',
        shadowGlow: ''
      }
    default:
      return {
        cardBorder: 'border-[var(--color-border)] bg-[var(--color-surface-container-low)]',
        avatarRing: 'ring-2 ring-[var(--color-border)]',
        scoreBadge: 'bg-[var(--color-surface-container-highest)] text-[var(--color-text-subtle)] border border-[var(--color-border)]',
        rankBg: 'bg-[var(--color-surface-container-highest)] text-[var(--color-text)]',
        shadowGlow: ''
      }
  }
}

export default function RankingWidget({ topLeaderboard }: RankingWidgetProps) {
  if (topLeaderboard.length === 0) {
    return (
      <article className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 p-6 shadow-[var(--shadow-xl)] backdrop-blur-md sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35" />
        <m.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex w-full flex-col items-center gap-4 py-8 text-center text-zinc-500"
        >
          <Trophy className="w-16 h-16 opacity-10" />
          <p className="text-sm font-medium">Inicie uma partida na Arena para entrar no ranking!</p>
        </m.div>
      </article>
    )
  }

  const top3 = topLeaderboard.slice(0, 3)

  const listContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  }

  const listItem = {
    hidden: { opacity: 0, x: 15 },
    show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 14 } }
  }

  return (
    <article className="group relative flex min-h-[460px] flex-col overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 p-6 shadow-[var(--shadow-xl)] backdrop-blur-md sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35" />
      {/* Premium Background Decorative Lights */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <DecoStar className="absolute bottom-6 right-6 w-8 h-8 opacity-20 group-hover:rotate-12 transition-transform duration-700" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-8">
        <div>
          <m.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800"
          >
            <Trophy className="h-3 w-3" strokeWidth={3} /> Arena Semanal
          </m.p>
          <m.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 font-montserrat text-3xl font-bold leading-tight tracking-tight text-zinc-900"
          >
            Elite da Semana
          </m.h2>
        </div>
        
        <m.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="rounded-full border border-emerald-900/10 bg-emerald-50/75 p-2.5"
        >
          <Flame className="h-6 w-6 text-amber-500 animate-pulse" strokeWidth={2.5} />
        </m.div>
      </div>

      {/* Main Grid: Illustration & Top 3 List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* Left Side: SVGs Illustration */}
        <div className="col-span-1 lg:col-span-5 flex flex-col items-center text-center justify-center">
          <m.div
            animate={{ y: [0, -6, 0] }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: 'easeInOut'
            }}
            className="relative w-48 h-48 sm:w-56 sm:h-56 filter drop-shadow-md"
          >
            <Image 
              src="/images/home/undraw-winners.svg" 
              alt="Pessoas comemorando vitória" 
              width={220} 
              height={220} 
              className="w-full h-full object-contain"
              priority
            />
          </m.div>
          <p className="mt-4 text-xs font-semibold text-[var(--color-text-subtle)] max-w-[200px] leading-relaxed">
            A disputa semanal está a todo vapor! Continue praticando para liderar a elite.
          </p>
        </div>

        {/* Right Side: Elite Rankings with detailed metrics */}
        <m.div 
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="col-span-1 lg:col-span-7 flex flex-col gap-3.5 w-full"
        >
          {top3.map((entry, index) => {
            const rank = index + 1
            const styles = getRankStyles(rank)
            const tier = getLeaderboardTier(entry.score)
            
            return (
              <m.div
                key={entry.userId}
                variants={listItem}
                className={`
                  relative flex flex-col rounded-[24px] border bg-white/35 p-4 backdrop-blur-sm transition-all duration-300
                  ${styles.cardBorder} ${styles.shadowGlow} group/row hover:scale-[1.01] hover:shadow-md
                `}
              >
                {/* Main Row Info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge / Icon */}
                    <div className={`
                      w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-inner border-2 border-[var(--color-card)]
                      ${styles.rankBg}
                    `}>
                      {rank === 1 ? <Trophy className="w-3.5 h-3.5" /> : rank}
                    </div>

                    {/* Avatar */}
                    <Link href={`/profile/${entry.username}`} className="relative block shrink-0">
                      <div className={`
                        w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-[var(--color-surface-container)] p-0.5
                        ${styles.avatarRing} transition-transform group-hover/row:scale-105 duration-300
                      `}>
                        {entry.avatarUrl ? (
                          <Image 
                            src={entry.avatarUrl} 
                            alt={entry.username} 
                            width={48} 
                            height={48} 
                            className="h-full w-full object-cover rounded-full" 
                          />
                        ) : (
                          <div className={`h-full w-full flex items-center justify-center rounded-full text-sm font-black text-[var(--color-text-subtle)]`}>
                            {entry.username[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* User Info */}
                    <div>
                      <p className="text-sm font-black text-[var(--color-text)] truncate max-w-[110px] sm:max-w-[150px]">
                        {entry.username}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getTierBadgeStyles(tier)}`}>
                          {tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score Tag */}
                  <div className="text-right">
                    <span className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black inline-block tracking-tight ${styles.scoreBadge}`}>
                      {entry.score} <span className="text-[9px] sm:text-[10px] opacity-75 font-semibold uppercase tracking-tighter ml-0.5">pts</span>
                    </span>
                  </div>
                </div>

                {/* Sub row: Rich Stats */}
                <div className="mt-3 pt-2.5 border-t border-[var(--color-border)]/40 flex items-center justify-between text-[11px] text-[var(--color-text-subtle)] font-semibold">
                  <div className="flex items-center gap-1.5" title="Precisão geral nas respostas">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Precisão: <strong className="text-[var(--color-text)] font-black">{entry.accuracy}%</strong></span>
                  </div>
                  
                  <div className="flex items-center gap-1.5" title="Partidas jogadas esta semana">
                    <Play className="w-3.5 h-3.5 text-sky-500 fill-sky-500/10" />
                    <span>Partidas: <strong className="text-[var(--color-text)] font-black">{entry.sessions}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5" title="Maior sequência de acertos">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Streak Max: <strong className="text-[var(--color-text)] font-black">{entry.bestStreak}</strong></span>
                  </div>
                </div>
              </m.div>
            )
          })}
        </m.div>
      </div>

      {/* Footer link to view full ranking */}
      <m.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex justify-center border-t border-zinc-200/60 pt-4"
      >
        <Link 
          href="/ranking" 
          transitionTypes={navForwardTransitionTypes} 
          className="group/link inline-flex h-10 w-full items-center justify-center gap-2 rounded-[32px] border border-zinc-200/70 bg-white/45 px-6 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-emerald-700 sm:w-auto"
        >
          Ver ranking completo 
          <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </m.div>
    </article>
  )
}
