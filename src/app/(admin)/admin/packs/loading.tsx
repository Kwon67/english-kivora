import { Package, Loader2 } from 'lucide-react'

function PackCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-[0.8rem] bg-[var(--color-surface-hover)]" />
        <div className="h-5 w-16 bg-[var(--color-surface-hover)] rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-[var(--color-surface-hover)] rounded mb-2" />
      <div className="h-4 w-full bg-[var(--color-surface-hover)] rounded mb-4" />
      <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
        <div className="h-3 w-20 bg-[var(--color-surface-hover)] rounded" />
        <div className="h-3 w-16 bg-[var(--color-surface-hover)] rounded" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-4 pb-8 animate-pulse">
      <div className="premium-card overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[1fr_0.95fr]">
          <div className="p-5 sm:p-6">
            <div className="h-6 w-32 rounded-full bg-[var(--color-surface-hover)]" />
            <div className="mt-4 h-10 w-56 rounded bg-[var(--color-surface-hover)]" />
            <div className="mt-3 h-4 w-full max-w-lg rounded bg-[var(--color-surface-hover)]" />
            <div className="mt-5 flex gap-3">
              <div className="h-11 w-28 rounded-xl bg-[var(--color-surface-hover)]" />
              <div className="h-11 w-32 rounded-xl bg-[var(--color-surface-hover)]" />
            </div>
          </div>
          <div className="grid border-t border-[var(--color-border)] bg-[var(--color-surface-container-low)] sm:grid-cols-4 xl:border-l xl:border-t-0">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="border-b border-[var(--color-border)] p-4 sm:border-b-0 sm:border-r">
                <div className="h-4 w-4 rounded bg-[var(--color-surface-hover)]" />
                <div className="mt-3 h-8 w-12 rounded bg-[var(--color-surface-hover)]" />
                <div className="mt-2 h-3 w-20 rounded bg-[var(--color-surface-hover)]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-[var(--color-text-subtle)]" />
          <div className="h-5 w-44 rounded bg-[var(--color-surface-hover)]" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PackCardSkeleton />
        <PackCardSkeleton />
        <PackCardSkeleton />
        <PackCardSkeleton />
        <PackCardSkeleton />
        <PackCardSkeleton />
      </div>

      {/* Loading indicator */}
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
      </div>
    </div>
  )
}
