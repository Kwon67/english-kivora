'use client'

import { m } from 'motion/react'
import { Flame, Heart, Zap } from 'lucide-react'
import {
  getBlitzSessionPhase,
  getBlitzSessionProgress,
  getComboMultiplier,
} from '@/features/blitz/lib/blitzScoring'
import type { BlitzGameMode } from '@/features/blitz/lib/blitzModes'
import { getBlitzModeShortLabel } from '@/features/blitz/lib/blitzModes'
import { blitzHudCard, blitzKicker } from '@/features/blitz/lib/blitzUi'

interface BlitzHudProps {
  lives: number
  score: number
  combo: number
  mode: BlitzGameMode
  cardsAnswered: number
  totalCards: number
}

export default function BlitzHud({
  lives,
  score,
  combo,
  mode,
  cardsAnswered,
  totalCards,
}: BlitzHudProps) {
  const multiplier = getComboMultiplier(combo)
  const progress = getBlitzSessionProgress(cardsAnswered, totalCards, lives)
  const phase = getBlitzSessionPhase(progress)

  return (
    <div className={`${blitzHudCard} mb-3 p-3 sm:mb-4 sm:p-3.5`}>
      <div
        className="mb-2.5 h-2 overflow-hidden rounded-full border border-brand-dark bg-brand-border sm:mb-3"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${phase} da partida`}
        aria-label="Progresso da partida de Blitz"
        data-testid="blitz-session-progress"
      >
        <div
          className="h-full rounded-full bg-brand-dark transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* One horizontal strip. Stacked hearts / two stat tiles / mode pill ate ~45% of a 812px
          phone, which pushed half the answer options below the fold in a timed game. */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex shrink-0 items-center gap-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <m.span
              key={index}
              animate={index < lives ? { scale: 1 } : { scale: [1, 1.35, 1] }}
              transition={{ duration: 0.35 }}
            >
              <Heart
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  index < lives
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-brand-secondary opacity-30'
                }`}
              />
            </m.span>
          ))}
        </div>

        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <p className="font-heading text-base font-bold tabular-nums leading-none text-brand-dark sm:text-lg">
            <span className="mr-1 text-2xs font-bold uppercase tracking-widest text-brand-secondary">Score</span>
            {score}
          </p>
          <m.p
            key={combo}
            initial={combo > 0 ? { scale: 1.25 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            className="flex items-center gap-1 font-heading text-base font-bold tabular-nums leading-none text-brand-dark sm:text-lg"
          >
            <Flame className={`h-4 w-4 shrink-0 ${combo >= 3 ? 'text-rose-500' : 'text-brand-dark'}`} />
            {combo}
            {combo >= 3 && <span className="text-xs text-brand-secondary">x{multiplier}</span>}
          </m.p>
        </div>

        <span className={`${blitzKicker} min-w-0 shrink gap-1.5 bg-brand-accent`}>
          <Zap className="h-3 w-3 shrink-0" />
          <span className="truncate">{getBlitzModeShortLabel(mode)}</span>
        </span>
      </div>
    </div>
  )
}