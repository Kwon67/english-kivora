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
        <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
          Para revisar depois
        </p>
        <span className="rounded-full border border-brand-dark bg-brand-accent px-2.5 py-0.5 font-heading text-[11px] font-bold text-brand-dark">
          {misses.length} {misses.length === 1 ? 'erro' : 'erros'}
        </span>
      </div>

      <ul className="space-y-2">
        {visible.map((miss) => (
          <li
            key={miss.id}
            className="rounded-xl border border-brand-border bg-bg-card px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 font-body text-sm font-semibold leading-snug text-brand-dark">
                {miss.englishPhrase}
              </p>
              <span className="shrink-0 rounded-full border border-brand-border bg-bg-primary px-2 py-0.5 font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
                {getBlitzModeLabel(miss.mode)}
              </span>
            </div>
            {miss.detail ? (
              <p className="mt-1 font-body text-xs leading-relaxed text-brand-secondary">{miss.detail}</p>
            ) : miss.portugueseHint ? (
              <p className="mt-1 font-body text-xs text-brand-secondary">{miss.portugueseHint}</p>
            ) : null}
          </li>
        ))}
        {hiddenCount > 0 && (
          <li className="px-1 font-body text-xs text-brand-secondary">+{hiddenCount} mais para revisar</li>
        )}
      </ul>
    </div>
  )
}
