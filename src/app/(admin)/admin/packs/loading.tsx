import { Package, Loader2 } from 'lucide-react'

function PackCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-hover)]" />
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
    <div className="space-y-6 pb-20 animate-pulse">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <Package className="w-6 h-6 text-[var(--color-text-subtle)]" />
              <div className="h-8 w-48 bg-[var(--color-surface-hover)] rounded" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-16 bg-[var(--color-surface-hover)] rounded-full" />
              <div className="h-3 w-32 bg-[var(--color-surface-hover)] rounded" />
            </div>
            <div className="h-4 w-64 bg-[var(--color-surface-hover)] rounded" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-[var(--color-surface-hover)] rounded-lg" />
            <div className="h-10 w-28 bg-[var(--color-surface-hover)] rounded-lg" />
          </div>
        </div>
      </div>

      {/* Packs Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
