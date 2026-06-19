'use client'

import { Flame, Heart, Zap } from 'lucide-react'
import { getComboMultiplier } from '@/features/blitz/lib/blitzScoring'
import type { BlitzGameMode } from '@/features/blitz/lib/blitzModes'
import { getBlitzModeLabel } from '@/features/blitz/lib/blitzModes'
import { blitzGlassPanel, blitzGlassTile } from '@/features/blitz/lib/blitzUi'

interface BlitzHudProps {
  lives: number
  score: number
  combo: number
  mode: BlitzGameMode
}

export default function BlitzHud({ lives, score, combo, mode }: BlitzHudProps) {
  const multiplier = getComboMultiplier(combo)

  return (
    <div className={`${blitzGlassPanel} mb-6 flex flex-wrap items-center justify-between gap-4 p-4`}>
      <div className="flex items-center gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Heart
            key={index}
            className={`h-5 w-5 ${
              index < lives
                ? 'fill-rose-500 text-rose-500'
                : 'text-text-subtle opacity-30'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className={`${blitzGlassTile} min-w-[88px] px-3 py-2 text-center`}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-subtle">Score</p>
          <p className="mt-1 text-xl font-black text-text">{score}</p>
        </div>

        <div className={`${blitzGlassTile} min-w-[88px] px-3 py-2 text-center`}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-subtle">Combo</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-xl font-black text-text">
            <Flame className="h-4 w-4 text-orange-500" />
            {combo}
            {combo >= 3 && (
              <span className="text-sm text-primary">x{multiplier}</span>
            )}
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-border-muted/18 bg-primary-container px-3 py-1.5 text-xs font-bold text-primary dark:border-border-accent/18 dark:bg-primary/12">
        <Zap className="h-3.5 w-3.5" />
        {getBlitzModeLabel(mode)}
      </div>
    </div>
  )
}