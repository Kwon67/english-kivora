'use client'

import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { ArrowRight, Flame, Play, Target, Trophy } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { LeaderboardEntry } from '@/features/leaderboard/lib/leaderboard'
import { getLeaderboardTier } from '@/features/leaderboard/lib/leaderboard'

interface RankingWidgetProps {
  topLeaderboard: LeaderboardEntry[]
}

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || 'K'
}

function getTierBadgeStyles(tier: string) {
  switch (tier) {
    case 'Elite':
      return 'border-red-300/50 bg-red-50/80 text-red-700 dark:border-red-400/30 dark:bg-red-950/30 dark:text-red-200'
    case 'Diamante':
      return 'border-sky-300/50 bg-sky-50/80 text-sky-700 dark:border-sky-400/30 dark:bg-sky-950/30 dark:text-sky-200'
    case 'Ouro':
      return 'border-amber-300/60 bg-amber-50/80 text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200'
    case 'Prata':
      return 'border-[#172113]/18 bg-[#eef3d6] text-[#5a664e] dark:border-[#d5e6a9]/18 dark:bg-[#1a2513] dark:text-[#9ea98b]'
    default:
      return 'border-orange-300/50 bg-orange-50/80 text-orange-700 dark:border-orange-400/30 dark:bg-orange-950/30 dark:text-orange-200'
  }
}

function getRankStyles(rank: number) {
  switch (rank) {
    case 1:
      return {
        row: 'border-amber-300/60 bg-[linear-gradient(135deg,rgba(255,247,210,0.96),rgba(247,248,239,0.72))] dark:border-amber-400/24 dark:bg-[linear-gradient(135deg,rgba(84,55,8,0.42),rgba(17,22,14,0.92))]',
        accent: 'bg-amber-400',
        avatar: 'ring-2 ring-amber-300/80',
        rank: 'bg-amber-400 text-amber-950',
        score: 'border-amber-300/60 bg-amber-50/85 text-amber-700 dark:border-amber-400/28 dark:bg-amber-950/35 dark:text-amber-100',
      }
    case 2:
      return {
        row: 'border-[#172113]/20 bg-[linear-gradient(135deg,rgba(238,243,214,0.92),rgba(247,248,239,0.68))] dark:border-[#d5e6a9]/18 dark:bg-[linear-gradient(135deg,rgba(29,43,20,0.72),rgba(17,22,14,0.92))]',
        accent: 'bg-[#8d9e69]',
        avatar: 'ring-2 ring-[#8d9e69]/70',
        rank: 'bg-[#8d9e69] text-[#10130f]',
        score: 'border-[#172113]/20 bg-[#eef3d6] text-[#425039] dark:border-[#d5e6a9]/18 dark:bg-[#1a2513] dark:text-[#d5e6a9]',
      }
    case 3:
      return {
        row: 'border-orange-300/50 bg-[linear-gradient(135deg,rgba(255,241,219,0.9),rgba(247,248,239,0.68))] dark:border-orange-400/24 dark:bg-[linear-gradient(135deg,rgba(68,35,11,0.42),rgba(17,22,14,0.92))]',
        accent: 'bg-orange-500',
        avatar: 'ring-2 ring-orange-300/70',
        rank: 'bg-orange-500 text-white',
        score: 'border-orange-300/50 bg-orange-50/85 text-orange-700 dark:border-orange-400/28 dark:bg-orange-950/35 dark:text-orange-100',
      }
    default:
      return {
        row: 'border-[#172113]/20 bg-[#f7f8ef] dark:border-[#d5e6a9]/18 dark:bg-[#11160e]',
        accent: 'bg-[#183b16] dark:bg-[#b8ff5c]',
        avatar: 'ring-2 ring-[#172113]/18 dark:ring-[#d5e6a9]/20',
        rank: 'bg-[#eef3d6] text-[#425039] dark:bg-[#1a2513] dark:text-[#d5e6a9]',
        score: 'border-[#172113]/18 bg-[#eef3d6] text-[#425039] dark:border-[#d5e6a9]/18 dark:bg-[#1a2513] dark:text-[#d5e6a9]',
      }
  }
}

export default function RankingWidget({ topLeaderboard }: RankingWidgetProps) {
  const top3 = topLeaderboard.slice(0, 3)
  const leader = top3[0]
  const bestAccuracy = top3.length ? Math.max(...top3.map((entry) => entry.accuracy)) : 0

  if (topLeaderboard.length === 0) {
    return (
      <article className="render-contained relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] p-6 shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.65),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-1 flex-col items-center justify-center text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c]">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.6} />
            Arena semanal
          </p>
          <h2 className="mt-3 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">
            Ranking em formação
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
            Os primeiros resultados da Arena aparecem aqui assim que a semana ganhar movimento.
          </p>
          <Link
            href="/arena"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#183b16] px-5 py-3 text-sm font-bold text-[#f7f8ef] shadow-[0_10px_22px_rgba(24,59,22,0.22)] transition-colors hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]"
          >
            Abrir Arena
            <ArrowRight className="h-4 w-4" />
          </Link>
        </m.div>
      </article>
    )
  }

  const listContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  }

  const listItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 95, damping: 16 } },
  }

  return (
    <article className="render-contained group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] p-6 shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.65),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

      <div className="relative z-10 mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <m.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c]"
          >
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.6} />
            Arena semanal
          </m.p>
          <m.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 font-montserrat text-3xl font-bold leading-tight text-[#10130f] dark:text-[#f4f7e9]"
          >
            Elite da Semana
          </m.h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
            Top 3 por pontuação, precisão e sequência máxima nos últimos dias.
          </p>
        </div>

        <m.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.16 }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] shadow-sm ring-1 ring-[#172113]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c] dark:ring-[#d5e6a9]/18"
        >
          <Flame className="h-6 w-6" strokeWidth={2.5} />
        </m.div>
      </div>

      <div className="relative z-10 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="flex flex-col overflow-hidden rounded-[18px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] p-4 shadow-[0_12px_30px_rgba(31,43,18,0.08)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-[#5a664e] dark:text-[#9ea98b]">
                Pódio atual
              </p>
              <p className="mt-2 max-w-[12rem] truncate text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">
                {leader ? `#1 ${leader.username}` : 'Sem líder'}
              </p>
            </div>
            <span className="rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c]">
              {top3.length}/3
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border border-[#172113]/18 bg-[#eef3d6] p-3 dark:border-[#d5e6a9]/18 dark:bg-[#1a2513]">
              <p className="text-[0.64rem] font-black uppercase tracking-[0.1em] text-[#5a664e] dark:text-[#9ea98b]">Pontuação</p>
              <p className="mt-2 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">
                {leader?.score ?? 0}
              </p>
            </div>
            <div className="rounded-[16px] border border-[#172113]/18 bg-[#eef3d6] p-3 dark:border-[#d5e6a9]/18 dark:bg-[#1a2513]">
              <p className="text-[0.64rem] font-black uppercase tracking-[0.1em] text-[#5a664e] dark:text-[#9ea98b]">Melhor precisão</p>
              <p className="mt-2 font-montserrat text-2xl font-bold text-[#183b16] dark:text-[#b8ff5c]">
                {bestAccuracy}%
              </p>
            </div>
          </div>
        </div>

        <m.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="flex min-w-0 flex-col gap-3"
        >
          {top3.map((entry, index) => {
            const rank = index + 1
            const styles = getRankStyles(rank)
            const tier = getLeaderboardTier(entry.score)

            return (
              <m.div
                key={entry.userId}
                variants={listItem}
                className={`group/row relative overflow-hidden rounded-[18px] border p-4 shadow-[0_12px_30px_rgba(31,43,18,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(31,43,18,0.13)] dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.45)] ${styles.row}`}
              >
                <div className={`absolute inset-y-4 left-0 w-1 rounded-r-full ${styles.accent}`} />

                <div className="flex items-center justify-between gap-3 pl-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm ${styles.rank}`}>
                      {rank === 1 ? <Trophy className="h-4 w-4" /> : rank}
                    </div>

                    <Link href={`/profile/${entry.username}`} className="relative block shrink-0">
                      <div className={`h-12 w-12 overflow-hidden rounded-full bg-[#fbfcf2] p-0.5 ${styles.avatar} transition-transform duration-300 group-hover/row:scale-105 dark:bg-[#0b1308]`}>
                        {entry.avatarUrl ? (
                          <Image
                            src={entry.avatarUrl}
                            alt={entry.username}
                            width={48}
                            height={48}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full text-sm font-black text-[#183b16] dark:text-[#b8ff5c]">
                            {getInitial(entry.username)}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="min-w-0">
                      <Link
                        href={`/profile/${entry.username}`}
                        className="block truncate text-sm font-black text-[#10130f] transition-colors hover:text-[#183b16] dark:text-[#f4f7e9] dark:hover:text-[#b8ff5c]"
                      >
                        {entry.username}
                      </Link>
                      <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.08em] ${getTierBadgeStyles(tier)}`}>
                        {tier}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-baseline rounded-[18px] border px-3 py-1.5 text-sm font-black ${styles.score}`}>
                      {entry.score}
                      <span className="ml-1 text-[0.58rem] font-black uppercase opacity-70">pts</span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#172113]/16 pt-3 text-[0.68rem] font-semibold text-[#5a664e] dark:border-[#d5e6a9]/16 dark:text-[#9ea98b]">
                  <div className="flex min-w-0 items-center gap-1.5" title="Precisão geral nas respostas">
                    <Target className="h-3.5 w-3.5 shrink-0 text-[#183b16] dark:text-[#b8ff5c]" />
                    <span className="truncate">
                      Precisão <strong className="font-black text-[#10130f] dark:text-[#f4f7e9]">{entry.accuracy}%</strong>
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5" title="Partidas jogadas esta semana">
                    <Play className="h-3.5 w-3.5 shrink-0 text-[#5a664e] dark:text-[#b9c3a4]" />
                    <span className="truncate">
                      Partidas <strong className="font-black text-[#10130f] dark:text-[#f4f7e9]">{entry.sessions}</strong>
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5" title="Maior sequência de acertos">
                    <Flame className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <span className="truncate">
                      Sequência <strong className="font-black text-[#10130f] dark:text-[#f4f7e9]">{entry.bestStreak}</strong>
                    </span>
                  </div>
                </div>
              </m.div>
            )
          })}
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mt-auto flex justify-center border-t border-dashed border-[#172113]/20 pt-4 dark:border-[#d5e6a9]/18"
      >
        <Link
          href="/ranking"
          transitionTypes={navForwardTransitionTypes}
          prefetch={false}
          className="group/link inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#172113]/20 bg-[#eef3d6] px-6 text-xs font-bold text-[#183b16] shadow-sm transition-colors hover:bg-[#dfe9bd] sm:w-auto dark:border-[#d5e6a9]/20 dark:bg-[#1a2513] dark:text-[#b8ff5c] dark:hover:bg-[#243318]"
        >
          Ver ranking completo
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </m.div>
    </article>
  )
}
