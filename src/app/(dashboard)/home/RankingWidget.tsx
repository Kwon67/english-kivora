'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Flame, Trophy } from 'lucide-react'
import { DecoStar } from '@/components/shared/DecorativeSvgs'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { LeaderboardEntry } from '@/lib/leaderboard'

interface RankingWidgetProps {
  topLeaderboard: LeaderboardEntry[]
}

export default function RankingWidget({ topLeaderboard }: RankingWidgetProps) {
  if (topLeaderboard.length === 0) {
    return (
      <article className="premium-card relative flex flex-col p-6 sm:p-7 overflow-hidden min-h-[340px] justify-center items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[var(--color-surface-container-low)]/30 to-transparent pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-8 text-center text-[var(--color-text-muted)] w-full"
        >
          <Trophy className="w-16 h-16 opacity-10" />
          <p className="text-sm font-medium">Inicie uma partida na Arena para entrar no ranking!</p>
        </motion.div>
      </article>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  }

  const podiumOrder = [
    { entry: topLeaderboard[1], place: 2, height: 'h-24 sm:h-28', color: 'from-slate-400/20 to-slate-500/10', borderColor: 'border-slate-400/30', textColor: 'text-slate-500' },
    { entry: topLeaderboard[0], place: 1, height: 'h-32 sm:h-40', color: 'from-[var(--color-primary)]/25 to-[var(--color-primary)]/10', borderColor: 'border-[var(--color-primary)]/40', textColor: 'text-[var(--color-primary)]' },
    { entry: topLeaderboard[2], place: 3, height: 'h-20 sm:h-24', color: 'from-amber-600/20 to-amber-700/10', borderColor: 'border-amber-600/30', textColor: 'text-amber-700' }
  ].filter(p => p.entry)

  return (
    <article className="premium-card relative flex flex-col p-6 sm:p-8 overflow-hidden group">
      {/* Premium Background Decorations */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[var(--color-secondary)]/5 rounded-full blur-3xl pointer-events-none" />
      <DecoStar className="absolute bottom-6 right-6 w-8 h-8 opacity-20 group-hover:rotate-12 transition-transform duration-700" />
      
      <div className="relative z-10 flex items-center justify-between gap-3 mb-10">
        <div>
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="section-kicker flex items-center gap-2 px-3 py-1 bg-[var(--color-surface-container-high)] border border-[var(--color-border)]"
          >
            <Trophy className="h-3 w-3" strokeWidth={3} /> Arena Semanal
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-black text-[var(--color-text)] tracking-tight leading-tight"
          >
            Elite da Semana
          </motion.h2>
        </div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="hidden sm:flex bg-[var(--color-surface-container-high)] p-3 rounded-2xl shadow-inner border border-[var(--color-border)]"
        >
          <div className="relative">
            <Flame className="h-7 w-7 text-amber-500 animate-pulse" strokeWidth={2.5} />
            <div className="absolute inset-0 bg-amber-500/20 blur-lg rounded-full" />
          </div>
        </motion.div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex items-end justify-center gap-3 sm:gap-6 flex-1 px-2"
      >
        {podiumOrder.map((podium) => (
          <motion.div 
            key={podium.entry.userId}
            variants={item}
            className={`flex flex-col items-center gap-3 w-full max-w-[100px] sm:max-w-[140px]`}
          >
            {/* Avatar Section */}
            <Link 
              href={`/profile/${podium.entry.username}`} 
              className="relative group/avatar"
            >
              <div className={`
                relative h-14 w-14 sm:h-20 sm:w-20 rounded-full p-1 transition-all duration-500 
                ${podium.place === 1 
                  ? 'border-4 border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20 scale-110' 
                  : 'border-2 border-[var(--color-border)] shadow-md'
                }
                group-hover/avatar:scale-110 group-hover/avatar:rotate-3 overflow-hidden bg-[var(--color-surface-container)]
              `}>
                {podium.entry.avatarUrl ? (
                  <Image 
                    src={podium.entry.avatarUrl} 
                    alt={podium.entry.username} 
                    width={80} 
                    height={80} 
                    className="h-full w-full object-cover rounded-full" 
                  />
                ) : (
                  <div className={`h-full w-full flex items-center justify-center rounded-full text-lg font-black ${podium.place === 1 ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'}`}>
                    {podium.entry.username[0]?.toUpperCase()}
                  </div>
                )}
                
                {podium.place === 1 && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                )}
              </div>

              {/* Rank Badge */}
              <div className={`
                absolute -top-2 -right-2 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-black border-2 border-[var(--color-card)] shadow-lg
                ${podium.place === 1 ? 'bg-amber-400 text-amber-950 scale-110' : 'bg-[var(--color-surface-container-highest)] text-[var(--color-text)]'}
              `}>
                {podium.place === 1 ? (
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" />
                ) : (
                  podium.place
                )}
              </div>
            </Link>

            {/* Podium Bar */}
            <div className={`
              relative w-full rounded-t-3xl ${podium.height} flex flex-col items-center justify-end p-3 sm:p-4
              bg-gradient-to-t ${podium.color} border-x border-t ${podium.borderColor}
              backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden
            `}>
              {podium.place === 1 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />
              )}
              
              <div className="relative z-10 w-full text-center">
                <p className="text-[11px] sm:text-sm font-black truncate text-[var(--color-text)] mb-0.5 group-hover:scale-105 transition-transform">
                  {podium.entry.username}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <span className={`text-[10px] sm:text-xs font-bold ${podium.textColor}`}>
                    {podium.entry.score}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[var(--color-text-subtle)] font-medium uppercase tracking-tighter">pts</span>
                </div>
              </div>

              {/* Extra visual polish for the bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 flex justify-center border-t border-[var(--color-border)] pt-5"
      >
        <Link 
          href="/ranking" 
          transitionTypes={navForwardTransitionTypes} 
          className="btn-ghost w-full sm:w-auto px-6 h-10 text-xs font-bold group/link"
        >
          Ver ranking completo 
          <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(15deg); }
          50% { transform: translateX(100%) rotate(15deg); }
          100% { transform: translateX(100%) rotate(15deg); }
        }
      `}</style>
    </article>
  )
}
