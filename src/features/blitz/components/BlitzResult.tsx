'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Flame, RotateCcw, Trophy, Zap } from 'lucide-react'
import { m } from 'framer-motion'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import BlitzMissRecap from '@/features/blitz/components/BlitzMissRecap'
import { blitzGlassPanel, blitzGlassTile, blitzKicker, blitzPrimaryBtn } from '@/features/blitz/lib/blitzUi'
import type { BlitzMiss } from '@/features/blitz/lib/blitzMisses'
import { softBtn } from '@/lib/brandUi'

const QUEST_LABELS: Record<string, string> = {
  any_session: 'Missão diária concluída',
  blitz_session: 'Missão de Blitz concluída',
  blitz_combo: 'Missão de combo concluída',
}

interface BlitzResultProps {
  score: number
  maxCombo: number
  cardsAnswered: number
  personalBest: number
  isNewRecord: boolean
  streakUpdated?: boolean
  unlockedBadges?: { name: string; icon_name: string | null }[]
  questsCompleted?: string[]
  misses?: BlitzMiss[]
  onPlayAgain: () => void
}

export default function BlitzResult({
  score,
  maxCombo,
  cardsAnswered,
  personalBest,
  isNewRecord,
  streakUpdated,
  unlockedBadges,
  questsCompleted,
  misses = [],
  onPlayAgain,
}: BlitzResultProps) {
  useEffect(() => {
    void import('canvas-confetti').then(({ default: confetti }) => {
      if (isNewRecord || (unlockedBadges && unlockedBadges.length > 0)) {
        confetti({
          particleCount: 120,
          spread: 72,
          origin: { y: 0.65 },
          colors: ['#466259', '#5e7a71', '#735802', '#cae9de'],
        })
      }
    })
  }, [isNewRecord, unlockedBadges])

  const rewardMessages = [
    ...(streakUpdated ? ['Sequência diária mantida!'] : []),
    ...(unlockedBadges || []).map((badge) => `Badge desbloqueado: ${badge.name}`),
    ...(questsCompleted || []).map((quest) => QUEST_LABELS[quest] || 'Missão concluída'),
  ]

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${blitzGlassPanel} w-full max-w-xl p-8 text-center`}
      >
        <p className={blitzKicker}>Fim de jogo</p>
        <h1 className="mt-4 font-montserrat text-3xl font-bold text-text">
          {isNewRecord ? 'Novo recorde!' : 'Boa partida!'}
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          {cardsAnswered} desafios respondidos nesta rodada.
        </p>

        {rewardMessages.length > 0 && (
          <div className="mt-5 space-y-2 text-left">
            {rewardMessages.map((message) => (
              <p
                key={message}
                className="flex items-center gap-2 rounded-[14px] border border-dashed border-primary/25 bg-primary-container px-3 py-2 text-sm font-semibold text-primary dark:border-primary/20 dark:bg-primary/12"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {message}
              </p>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className={blitzGlassTile}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">Pontuação</p>
            <p className="mt-2 text-3xl font-black text-text">{score}</p>
          </div>
          <div className={blitzGlassTile}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">Melhor combo</p>
            <p className="mt-2 flex items-center justify-center gap-1 text-3xl font-black text-text">
              <Flame className="h-5 w-5 text-orange-500" />
              {maxCombo}
            </p>
          </div>
          <div className={blitzGlassTile}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">Recorde</p>
            <p className="mt-2 flex items-center justify-center gap-1 text-3xl font-black text-text">
              <Trophy className="h-5 w-5 text-amber-500" />
              {personalBest}
            </p>
          </div>
        </div>

        <BlitzMissRecap misses={misses} />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={onPlayAgain} className={`${blitzPrimaryBtn} inline-flex`}>
            <RotateCcw className="h-4 w-4" />
            Jogar de novo
          </button>
          <Link href="/blitz" className={`${softBtn} inline-flex`} transitionTypes={navBackTransitionTypes}>
            <Zap className="h-4 w-4" />
            Voltar ao Blitz
          </Link>
          <Link href="/blitz" className={`${softBtn} inline-flex`} transitionTypes={navForwardTransitionTypes}>
            Ranking Blitz
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </m.div>
    </div>
  )
}