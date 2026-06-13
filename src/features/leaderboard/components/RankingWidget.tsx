'use client'

import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { ArrowRight, Flame, Target, Trophy } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { LeaderboardEntry } from '@/features/leaderboard/lib/leaderboard'

interface RankingWidgetProps {
  topLeaderboard: LeaderboardEntry[]
}

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || 'K'
}

function getPodiumMeta(rank: number) {
  switch (rank) {
    case 1:
      return {
        pedestal: 'h-16 sm:h-20',
        avatar: 'h-14 w-14 sm:h-16 sm:w-16',
        ring: 'ring-amber-300/80 dark:ring-amber-400/40',
        pedestalBg: 'bg-gradient-to-t from-amber-400/80 to-amber-300/35 dark:from-amber-500/35 dark:to-amber-400/10',
        badge: 'bg-amber-400 text-amber-950',
        score: 'text-amber-700 dark:text-amber-200',
      }
    case 2:
      return {
        pedestal: 'h-12 sm:h-14',
        avatar: 'h-12 w-12 sm:h-14 sm:w-14',
        ring: 'ring-[#8d9e69]/70 dark:ring-[#9ea98b]/50',
        pedestalBg: 'bg-gradient-to-t from-[#8d9e69]/70 to-[#eef3d6] dark:from-[#3d4a2c]/80 dark:to-[#1a2114]',
        badge: 'bg-[#8d9e69] text-[#10130f]',
        score: 'text-[#425039] dark:text-[#d5e6a9]',
      }
    default:
      return {
        pedestal: 'h-10 sm:h-12',
        avatar: 'h-11 w-11 sm:h-12 sm:w-12',
        ring: 'ring-orange-300/70 dark:ring-orange-400/35',
        pedestalBg: 'bg-gradient-to-t from-orange-400/55 to-orange-200/25 dark:from-orange-500/30 dark:to-orange-400/8',
        badge: 'bg-orange-500 text-white',
        score: 'text-orange-700 dark:text-orange-200',
      }
  }
}

function PodiumAvatar({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const meta = getPodiumMeta(rank)

  return (
    <Link href={`/profile/${entry.username}`} className="relative block shrink-0">
      <div
        className={`overflow-hidden rounded-full bg-[#fbfcf2] p-0.5 ring-2 transition-transform hover:scale-105 dark:bg-[#0b1308] ${meta.avatar} ${meta.ring}`}
      >
        {entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt={entry.username}
            width={64}
            height={64}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full text-sm font-black text-[#183b16] dark:text-[#b8ff5c]">
            {getInitial(entry.username)}
          </div>
        )}
      </div>
      <span
        className={`absolute -bottom-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-black shadow-sm ${meta.badge}`}
      >
        {rank === 1 ? <Trophy className="h-3 w-3" /> : rank}
      </span>
    </Link>
  )
}

function PodiumSlot({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const meta = getPodiumMeta(rank)

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.05 : rank === 2 ? 0.12 : 0.18 }}
      className={`flex min-w-0 flex-1 flex-col items-center ${rank === 1 ? 'z-10 -mt-2 sm:-mt-3' : ''}`}
    >
      <PodiumAvatar entry={entry} rank={rank} />
      <Link
        href={`/profile/${entry.username}`}
        className="mt-3 max-w-[7.5rem] truncate text-center text-xs font-black text-[#10130f] transition-colors hover:text-[#183b16] sm:max-w-[9rem] sm:text-sm dark:text-[#f4f7e9] dark:hover:text-[#b8ff5c]"
      >
        {entry.username}
      </Link>
      <p className={`mt-1 font-montserrat text-lg font-bold sm:text-xl ${meta.score}`}>
        {entry.score}
        <span className="ml-1 text-[10px] font-black uppercase opacity-70">pts</span>
      </p>
      <div
        className={`mt-3 w-full rounded-t-[14px] border border-b-0 border-[#172113]/14 dark:border-[#d5e6a9]/14 ${meta.pedestal} ${meta.pedestalBg}`}
      />
    </m.div>
  )
}

function WeeklyHighlight({
  icon: Icon,
  label,
  entry,
  value,
}: {
  icon: typeof Target
  label: string
  entry: LeaderboardEntry
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-[14px] border border-[#172113]/14 bg-[#f7f8ef] px-3 py-2.5 dark:border-[#d5e6a9]/14 dark:bg-[#0d110b]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef3d6] text-[#183b16] dark:bg-[#b8ff5c]/10 dark:text-[#b8ff5c]">
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#5a664e] dark:text-[#9ea98b]">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">
          <Link
            href={`/profile/${entry.username}`}
            className="transition-colors hover:text-[#183b16] dark:hover:text-[#b8ff5c]"
          >
            {entry.username}
          </Link>
          <span className="ml-1.5 font-semibold text-[#5a664e] dark:text-[#9ea98b]">{value}</span>
        </p>
      </div>
    </div>
  )
}

export default function RankingWidget({ topLeaderboard }: RankingWidgetProps) {
  const top3 = topLeaderboard.slice(0, 3)
  const leader = top3[0]
  const accuracyLeader = top3.length
    ? [...top3].sort((left, right) => right.accuracy - left.accuracy)[0]
    : null
  const streakLeader = top3.length
    ? [...top3].sort((left, right) => right.bestStreak - left.bestStreak)[0]
    : null
  const showAccuracyHighlight =
    accuracyLeader !== null && accuracyLeader.userId !== leader?.userId
  const showStreakHighlight =
    streakLeader !== null && streakLeader.userId !== leader?.userId

  if (topLeaderboard.length === 0) {
    return (
      <article className="render-contained relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] p-6 shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.65),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-1 flex-col items-center justify-center text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
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

  const podiumSlots = [
    top3[1] ? { entry: top3[1], rank: 2 as const } : null,
    top3[0] ? { entry: top3[0], rank: 1 as const } : null,
    top3[2] ? { entry: top3[2], rank: 3 as const } : null,
  ].filter((slot): slot is { entry: LeaderboardEntry; rank: 1 | 2 | 3 } => slot !== null)

  return (
    <article className="render-contained group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] p-5 shadow-[0_18px_48px_rgba(31,43,18,0.14)] sm:p-6 dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.65),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.6} />
            Arena semanal
          </p>
          <h2 className="mt-3 font-montserrat text-2xl font-bold leading-tight text-[#10130f] sm:text-3xl dark:text-[#f4f7e9]">
            Elite da Semana
          </h2>
          <p className="mt-1.5 text-sm text-[#5a664e] dark:text-[#9ea98b]">
            Top 3 por pontuação nos últimos 7 dias.
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-end justify-center gap-2 px-1 sm:mt-6 sm:gap-4">
        {podiumSlots.map(({ entry, rank }) => (
          <PodiumSlot key={entry.userId} entry={entry} rank={rank} />
        ))}
      </div>

      {(showAccuracyHighlight || showStreakHighlight) && (
        <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-2">
          {showAccuracyHighlight && accuracyLeader && (
            <WeeklyHighlight
              icon={Target}
              label="Melhor precisão"
              entry={accuracyLeader}
              value={`${accuracyLeader.accuracy}%`}
            />
          )}
          {showStreakHighlight && streakLeader && (
            <WeeklyHighlight
              icon={Flame}
              label="Maior sequência"
              entry={streakLeader}
              value={`${streakLeader.bestStreak}x`}
            />
          )}
        </div>
      )}

      <div className="relative z-10 mt-auto border-t border-dashed border-[#172113]/20 pt-4 dark:border-[#d5e6a9]/18">
        <Link
          href="/ranking"
          transitionTypes={navForwardTransitionTypes}
          prefetch={false}
          className="group/link inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#172113]/20 bg-[#eef3d6] px-6 text-xs font-bold text-[#183b16] shadow-sm transition-colors hover:bg-[#dfe9bd] sm:w-auto dark:border-[#d5e6a9]/20 dark:bg-[#b8ff5c]/8 dark:text-[#b8ff5c] dark:hover:bg-[#b8ff5c]/16"
        >
          Ver ranking completo
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </article>
  )
}