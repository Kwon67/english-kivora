'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Brain, CheckCircle2, Flame, Home, RotateCcw, Trophy, X, Zap } from 'lucide-react'
import { queueBlitzMissesForReview } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import BlitzMissRecap from '@/features/blitz/components/BlitzMissRecap'
import { blitzGlassPanel, blitzGlassTile, blitzKicker, blitzPrimaryBtn } from '@/features/blitz/lib/blitzUi'
import { getUniqueBlitzMissCardIds, type BlitzMiss } from '@/features/blitz/lib/blitzMisses'
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
  onClose: () => void
  onLeaveResult?: () => void
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
  onClose,
  onLeaveResult,
}: BlitzResultProps) {
  const router = useRouter()
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [isReviewPending, startReviewTransition] = useTransition()
  const missCardIds = getUniqueBlitzMissCardIds(misses)

  const handleReviewMisses = () => {
    if (missCardIds.length === 0) return

    setReviewError(null)
    startReviewTransition(async () => {
      const result = await queueBlitzMissesForReview(missCardIds)
      if (!result.success) {
        setReviewError(result.error)
        return
      }

      onLeaveResult?.()
      router.push('/review')
    })
  }

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
    <div
      className={`${blitzGlassPanel} relative w-full max-w-xl p-8 text-center`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blitz-result-title"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border-muted/22 bg-card text-text-muted transition-colors hover:text-text dark:border-border-accent/20"
        aria-label="Fechar resultado"
      >
        <X className="h-4 w-4" />
      </button>

        <p className={blitzKicker}>Fim de jogo</p>
        <h1 id="blitz-result-title" className="mt-4 font-montserrat text-3xl font-bold text-text">
          {isNewRecord ? 'Novo recorde!' : 'Boa partida!'}
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          {cardsAnswered} desafios respondidos nesta rodada.
        </p>

        <BlitzMissRecap misses={misses} />

        {missCardIds.length > 0 && (
          <div className="mt-4 space-y-2 text-left">
            <button
              type="button"
              onClick={handleReviewMisses}
              disabled={isReviewPending}
              className={`${softBtn} inline-flex w-full justify-center disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Brain className="h-4 w-4" />
              {isReviewPending
                ? 'Enfileirando revisão...'
                : `Revisar ${missCardIds.length} ${missCardIds.length === 1 ? 'erro' : 'erros'}`}
            </button>
            {reviewError ? (
              <p className="text-center text-xs font-semibold text-rose-600 dark:text-rose-400">{reviewError}</p>
            ) : (
              <p className="text-center text-xs text-text-subtle">
                Os cards vão para sua fila de revisão e dificuldades.
              </p>
            )}
          </div>
        )}

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

        <div className="mt-8 space-y-3">
          <button type="button" onClick={onPlayAgain} className={`${blitzPrimaryBtn} inline-flex w-full justify-center`}>
            <RotateCcw className="h-4 w-4" />
            Jogar de novo
          </button>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/blitz/ranking"
              onClick={onLeaveResult}
              className={`${softBtn} inline-flex w-full justify-center`}
              transitionTypes={navBackTransitionTypes}
            >
              <Trophy className="h-4 w-4" />
              Ranking Blitz
            </Link>
            <Link
              href="/blitz"
              onClick={onLeaveResult}
              className={`${softBtn} inline-flex w-full justify-center`}
              transitionTypes={navBackTransitionTypes}
            >
              <Zap className="h-4 w-4" />
              Início do Blitz
            </Link>
            <Link
              href="/home"
              onClick={onLeaveResult}
              className={`${softBtn} inline-flex w-full justify-center`}
              transitionTypes={navBackTransitionTypes}
            >
              <Home className="h-4 w-4" />
              Ir para Home
            </Link>
          </div>
        </div>
    </div>
  )
}