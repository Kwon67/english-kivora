'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { getBlitzModeLabel } from '@/features/blitz/lib/blitzModes'
import { getVisibleBlitzMisses, type BlitzMiss } from '@/features/blitz/lib/blitzMisses'

interface BlitzMissRecapProps {
  misses: BlitzMiss[]
}

export default function BlitzMissRecap({ misses }: BlitzMissRecapProps) {
  const [open, setOpen] = useState(misses.length <= 3)
  const { visible, hiddenCount } = getVisibleBlitzMisses(misses)

  if (misses.length === 0) return null

  return (
    <div className="mt-6 text-left">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-[14px] border border-dashed border-border-muted/22 bg-[#f7f8ef]/80 px-3 py-2.5 text-left transition-colors hover:bg-[#f0f2e4] dark:border-border-accent/20 dark:bg-card/80 dark:hover:bg-card"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-text">
          <BookOpen className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
          Para revisar depois
          <span className="text-xs font-medium text-text-subtle">({misses.length})</span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-text-subtle" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-text-subtle" />
        )}
      </button>

      {open && (
        <ul className="mt-2 space-y-2">
          {visible.map((miss) => (
            <li
              key={miss.id}
              className="rounded-[14px] border border-dashed border-border-muted/18 bg-[#f7f8ef] px-3 py-2.5 dark:border-border-accent/16 dark:bg-card"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-text">
                  {miss.englishPhrase}
                </p>
                <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-text-subtle">
                  {getBlitzModeLabel(miss.mode)}
                </span>
              </div>
              {miss.detail ? (
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{miss.detail}</p>
              ) : (
                <p className="mt-1 text-xs text-text-muted">{miss.portugueseHint}</p>
              )}
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="px-1 text-xs text-text-subtle">+{hiddenCount} mais para revisar</li>
          )}
        </ul>
      )}
    </div>
  )
}