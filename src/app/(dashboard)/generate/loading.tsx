import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6 pb-8">
      <div className="premium-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4 p-5 sm:p-7">
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-[var(--color-surface-hover)]" />
              <div className="h-6 w-28 rounded-full bg-[var(--color-surface-hover)]" />
            </div>
            <div className="h-10 w-4/5 max-w-lg rounded bg-[var(--color-surface-hover)]" />
            <div className="h-4 w-full max-w-xl rounded bg-[var(--color-surface-hover)]" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-20 rounded-[0.85rem] bg-[var(--color-surface-hover)]" />
              ))}
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-5 lg:border-l lg:border-t-0">
            <div className="h-48 rounded-[1rem] bg-[var(--color-surface-hover)] sm:h-56 lg:h-full" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="premium-card space-y-4 p-5 sm:p-6">
          <div className="h-6 w-32 rounded bg-[var(--color-surface-hover)]" />
          <div className="h-8 w-40 rounded bg-[var(--color-surface-hover)]" />
          <div className="h-12 rounded-xl bg-[var(--color-surface-hover)]" />
          <div className="h-24 rounded-xl bg-[var(--color-surface-hover)]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-12 rounded-xl bg-[var(--color-surface-hover)]" />
            <div className="h-12 rounded-xl bg-[var(--color-surface-hover)]" />
          </div>
          <div className="h-28 rounded-[1rem] bg-[var(--color-surface-hover)]" />
          <div className="h-12 rounded-xl bg-[var(--color-surface-hover)]" />
        </div>

        <div className="space-y-4">
          <div className="stitch-panel space-y-3 p-5">
            <div className="h-4 w-20 rounded bg-[var(--color-surface-hover)]" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 rounded-[0.85rem] bg-[var(--color-surface-hover)]" />
            ))}
          </div>
          <div className="premium-card h-36 p-5" />
        </div>
      </div>

      <div className="flex justify-center py-2">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    </div>
  )
}