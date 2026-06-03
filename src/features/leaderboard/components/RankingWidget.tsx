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
      return 'border-red-200/70 bg-red-50/80 text-red-700'
    case 'Diamante':
      return 'border-sky-200/70 bg-sky-50/80 text-sky-700'
    case 'Ouro':
      return 'border-amber-200/80 bg-amber-50/80 text-amber-700'
    case 'Prata':
      return 'border-zinc-200/80 bg-zinc-100/80 text-zinc-600'
    default:
      return 'border-orange-200/80 bg-orange-50/80 text-orange-700'
  }
}

function getRankStyles(rank: number) {
  switch (rank) {
    case 1:
      return {
        row: 'border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.92),rgba(255,255,255,0.42))]',
        accent: 'bg-amber-400',
        avatar: 'ring-2 ring-amber-300/80',
        rank: 'bg-amber-400 text-amber-950',
        score: 'border-amber-200/80 bg-amber-50/85 text-amber-700',
      }
    case 2:
      return {
        row: 'border-zinc-200/80 bg-[linear-gradient(135deg,rgba(244,244,245,0.84),rgba(255,255,255,0.38))]',
        accent: 'bg-zinc-400',
        avatar: 'ring-2 ring-zinc-300/80',
        rank: 'bg-zinc-400 text-zinc-950',
        score: 'border-zinc-200/80 bg-zinc-100/80 text-zinc-700',
      }
    case 3:
      return {
        row: 'border-orange-200/80 bg-[linear-gradient(135deg,rgba(255,247,237,0.86),rgba(255,255,255,0.38))]',
        accent: 'bg-orange-500',
        avatar: 'ring-2 ring-orange-300/70',
        rank: 'bg-orange-500 text-white',
        score: 'border-orange-200/80 bg-orange-50/85 text-orange-700',
      }
    default:
      return {
        row: 'border-zinc-200/55 bg-white/35',
        accent: 'bg-emerald-800',
        avatar: 'ring-2 ring-zinc-200/70',
        rank: 'bg-zinc-100 text-zinc-700',
        score: 'border-zinc-200/70 bg-white/55 text-zinc-700',
      }
  }
}

export default function RankingWidget({ topLeaderboard }: RankingWidgetProps) {
  const top3 = topLeaderboard.slice(0, 3)
  const leader = top3[0]
  const bestAccuracy = top3.length ? Math.max(...top3.map((entry) => entry.accuracy)) : 0

  if (topLeaderboard.length === 0) {
    return (
      <article className="render-contained relative flex min-h-[360px] flex-col overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 p-6 shadow-[0_24px_70px_rgba(24,32,29,0.12)] backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35" />
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-1 flex-col items-center justify-center text-center"
        >
          <div className="rounded-[28px] border border-zinc-200/55 bg-white/35 p-5 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm">
            <Image
              src="/images/home/undraw-winners.svg"
              alt="Pessoas comemorando vitória"
              width={220}
              height={220}
              priority
              className="h-36 w-36 object-contain sm:h-40 sm:w-40"
            />
          </div>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.6} />
            Arena semanal
          </p>
          <h2 className="mt-3 font-montserrat text-2xl font-bold text-zinc-900">
            Ranking em formação
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600">
            Os primeiros resultados da Arena aparecem aqui assim que a semana ganhar movimento.
          </p>
          <Link
            href="/arena"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-[32px] bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-[0px_8px_15px_0px_rgba(0,0,0,0.10)] transition-colors hover:bg-emerald-700"
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
    <article className="render-contained group relative flex min-h-[460px] flex-col overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 p-6 shadow-[0_24px_70px_rgba(24,32,29,0.12)] backdrop-blur-md sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35" />

      <div className="relative z-10 mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <m.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800"
          >
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.6} />
            Arena semanal
          </m.p>
          <m.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 font-montserrat text-3xl font-bold leading-tight text-zinc-900"
          >
            Elite da Semana
          </m.h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
            Top 3 por pontuação, precisão e sequência máxima nos últimos dias.
          </p>
        </div>

        <m.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.16 }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50/80 text-amber-700 shadow-sm ring-1 ring-amber-900/10"
        >
          <Flame className="h-6 w-6" strokeWidth={2.5} />
        </m.div>
      </div>

      <div className="relative z-10 grid flex-1 grid-cols-1 items-stretch gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="flex min-h-[260px] flex-col overflow-hidden rounded-[28px] border border-zinc-200/55 bg-white/35 p-5 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-zinc-500">
                Pódio atual
              </p>
              <p className="mt-2 max-w-[12rem] truncate text-sm font-bold text-zinc-900">
                {leader ? `#1 ${leader.username}` : 'Sem líder'}
              </p>
            </div>
            <span className="rounded-full border border-emerald-900/10 bg-emerald-50/70 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-emerald-800">
              {top3.length}/3
            </span>
          </div>

          <m.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4.6, ease: 'easeInOut' }}
            className="mx-auto mt-5 flex flex-1 items-center justify-center"
          >
            <Image
              src="/images/home/undraw-winners.svg"
              alt="Pessoas comemorando vitória"
              width={240}
              height={240}
              className="h-44 w-44 object-contain sm:h-52 sm:w-52"
              priority
            />
          </m.div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-zinc-200/55 bg-white/45 p-3">
              <p className="text-[0.64rem] font-black uppercase tracking-[0.1em] text-zinc-500">Pontuação</p>
              <p className="mt-2 font-montserrat text-2xl font-bold text-zinc-900">
                {leader?.score ?? 0}
              </p>
            </div>
            <div className="rounded-[22px] border border-zinc-200/55 bg-white/45 p-3">
              <p className="text-[0.64rem] font-black uppercase tracking-[0.1em] text-zinc-500">Melhor precisão</p>
              <p className="mt-2 font-montserrat text-2xl font-bold text-emerald-800">
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
                className={`group/row relative overflow-hidden rounded-[28px] border p-4 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(24,32,29,0.10)] ${styles.row}`}
              >
                <div className={`absolute inset-y-4 left-0 w-1 rounded-r-full ${styles.accent}`} />

                <div className="flex items-center justify-between gap-3 pl-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm ${styles.rank}`}>
                      {rank === 1 ? <Trophy className="h-4 w-4" /> : rank}
                    </div>

                    <Link href={`/profile/${entry.username}`} className="relative block shrink-0">
                      <div className={`h-12 w-12 overflow-hidden rounded-full bg-white/65 p-0.5 ${styles.avatar} transition-transform duration-300 group-hover/row:scale-105`}>
                        {entry.avatarUrl ? (
                          <Image
                            src={entry.avatarUrl}
                            alt={entry.username}
                            width={48}
                            height={48}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full text-sm font-black text-emerald-800">
                            {getInitial(entry.username)}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="min-w-0">
                      <Link
                        href={`/profile/${entry.username}`}
                        className="block truncate text-sm font-black text-zinc-900 transition-colors hover:text-emerald-800"
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

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-200/55 pt-3 text-[0.68rem] font-semibold text-zinc-500">
                  <div className="flex min-w-0 items-center gap-1.5" title="Precisão geral nas respostas">
                    <Target className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                    <span className="truncate">
                      Precisão <strong className="font-black text-zinc-900">{entry.accuracy}%</strong>
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5" title="Partidas jogadas esta semana">
                    <Play className="h-3.5 w-3.5 shrink-0 text-sky-700" />
                    <span className="truncate">
                      Partidas <strong className="font-black text-zinc-900">{entry.sessions}</strong>
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5" title="Maior sequência de acertos">
                    <Flame className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <span className="truncate">
                      Sequência <strong className="font-black text-zinc-900">{entry.bestStreak}</strong>
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
        className="relative z-10 mt-6 flex justify-center border-t border-zinc-200/60 pt-4"
      >
        <Link
          href="/ranking"
          transitionTypes={navForwardTransitionTypes}
          prefetch={false}
          className="group/link inline-flex h-10 w-full items-center justify-center gap-2 rounded-[32px] border border-zinc-200/70 bg-white/45 px-6 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-emerald-700 sm:w-auto"
        >
          Ver ranking completo
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </m.div>
    </article>
  )
}
