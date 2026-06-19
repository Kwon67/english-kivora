'use client'

import { getBlitzModeLabel } from '@/features/blitz/lib/blitzModes'
import { getVisibleBlitzMisses, type BlitzMiss } from '@/features/blitz/lib/blitzMisses'

interface BlitzMissRecapProps {
  misses: BlitzMiss[]
}

export default function BlitzMissRecap({ misses }: BlitzMissRecapProps) {
  const { visible, hiddenCount } = getVisibleBlitzMisses(misses)

  if (misses.length === 0) return null

  return (
    <div className="mt-6 text-left">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
          Para revisar depois
        </p>
        <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-bold text-text-muted">
          {misses.length} {misses.length === 1 ? 'erro' : 'erros'}
        </span>
      </div>

      <ul className="space-y-2">
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
            ) : miss.portugueseHint ? (
              <p className="mt-1 text-xs text-text-muted">{miss.portugueseHint}</p>
            ) : null}
          </li>
        ))}
        {hiddenCount > 0 && (
          <li className="px-1 text-xs text-text-subtle">+{hiddenCount} mais para revisar</li>
        )}
      </ul>
    </div>
  )
}