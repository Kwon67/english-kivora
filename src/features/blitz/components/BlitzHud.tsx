'use client'

import { Flame, Heart, Zap } from 'lucide-react'
import {
  getBlitzSessionPhase,
  getBlitzSessionProgress,
  getComboMultiplier,
} from '@/features/blitz/lib/blitzScoring'
import type { BlitzGameMode } from '@/features/blitz/lib/blitzModes'
import { getBlitzModeLabel } from '@/features/blitz/lib/blitzModes'
import { blitzHudCard, blitzKicker, blitzTile } from '@/features/blitz/lib/blitzUi'

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
    <div className={`${blitzHudCard} mb-4 p-3 sm:mb-6 sm:p-4`}>
      <div
        className="mb-3 h-2 overflow-hidden rounded-full border border-brand-dark bg-brand-border sm:mb-4"
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          {Array.from({ length: 3 }).map((_, index) => (
            <Heart
              key={index}
              className={`h-5 w-5 ${
                index < lives
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-brand-secondary opacity-30'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
          <div className={`${blitzTile} min-w-0 px-2.5 py-2 text-center sm:min-w-[88px] sm:px-3`}>
            <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Score</p>
            <p className="mt-1 font-heading text-lg font-bold tabular-nums text-brand-dark sm:text-xl">{score}</p>
          </div>

          <div className={`${blitzTile} min-w-0 px-2.5 py-2 text-center sm:min-w-[88px] sm:px-3`}>
            <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Combo</p>
            <p className="mt-1 flex items-center justify-center gap-1 font-heading text-lg font-bold tabular-nums text-brand-dark sm:text-xl">
              <Flame className="h-4 w-4 shrink-0 text-brand-dark" />
              {combo}
              {combo >= 3 && (
                <span className="text-sm text-brand-secondary">x{multiplier}</span>
              )}
            </p>
          </div>
        </div>

        <span className={`${blitzKicker} mx-auto gap-2 bg-brand-accent sm:mx-0`}>
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{getBlitzModeLabel(mode)}</span>
        </span>
      </div>
    </div>
  )
}