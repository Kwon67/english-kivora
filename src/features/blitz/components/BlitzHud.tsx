'use client'

import { Flame, Heart, Zap } from 'lucide-react'
import {
  getBlitzSessionPhase,
  getBlitzSessionProgress,
  getComboMultiplier,
} from '@/features/blitz/lib/blitzScoring'
import type { BlitzGameMode } from '@/features/blitz/lib/blitzModes'
import { getBlitzModeLabel } from '@/features/blitz/lib/blitzModes'
import { blitzGlassPanel, blitzGlassTile } from '@/features/blitz/lib/blitzUi'

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
    <div className={`${blitzGlassPanel} mb-6 p-4`}>
      <div
        className="mb-4 h-2 overflow-hidden rounded-full border border-brand-dark bg-brand-border"
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

      <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-3">
        <div className={`${blitzGlassTile} min-w-[88px] px-3 py-2 text-center`}>
          <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Score</p>
          <p className="mt-1 font-heading text-xl font-bold text-brand-dark">{score}</p>
        </div>

        <div className={`${blitzGlassTile} min-w-[88px] px-3 py-2 text-center`}>
          <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Combo</p>
          <p className="mt-1 flex items-center justify-center gap-1 font-heading text-xl font-bold text-brand-dark">
            <Flame className="h-4 w-4 text-brand-dark" />
            {combo}
            {combo >= 3 && (
              <span className="text-sm text-brand-secondary">x{multiplier}</span>
            )}
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-brand-dark bg-brand-accent px-3 py-1.5 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
        <Zap className="h-3.5 w-3.5" />
        {getBlitzModeLabel(mode)}
      </div>
      </div>
    </div>
  )
}
