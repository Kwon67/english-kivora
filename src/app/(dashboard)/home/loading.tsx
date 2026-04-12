import { Loader2, Clock } from 'lucide-react'

function SkeletonCard() {
  return (
    <div className="glass-card p-4 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-[var(--color-surface-hover)] rounded-full" />
            <div className="h-5 w-20 bg-[var(--color-surface-hover)] rounded-full" />
          </div>
          <div className="h-7 w-3/4 bg-[var(--color-surface-hover)] rounded" />
          <div className="h-4 w-full bg-[var(--color-surface-hover)] rounded" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)]" />
      </div>
      <div className="h-10 w-full bg-[var(--color-surface-hover)] rounded-lg mt-4" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 sm:space-y-10 pb-20 px-4 sm:px-0">
      {/* Header Skeleton */}
      <div className="glass-card p-4 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
        <div className="flex-1">
          <div className="h-8 w-48 bg-[var(--color-surface-hover)] rounded mb-2" />
          <div className="h-4 w-64 bg-[var(--color-surface-hover)] rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 bg-[var(--color-surface-hover)] rounded-xl" />
        </div>
      </div>

      {/* Carousel Skeleton */}
      <div className="w-full">
        <div className="w-full h-[260px] sm:h-[300px] rounded-2xl bg-[var(--color-surface-hover)] animate-pulse" />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 sm:h-20 rounded-xl bg-[var(--color-surface-hover)] animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Stats Section Skeleton */}
      <div className="glass-card p-6 animate-pulse">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)]" />
            <div>
              <div className="h-5 w-32 bg-[var(--color-surface-hover)] rounded mb-1" />
              <div className="h-4 w-48 bg-[var(--color-surface-hover)] rounded" />
            </div>
          </div>
          <div className="h-10 w-36 bg-[var(--color-surface-hover)] rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="text-center p-3 bg-[var(--color-surface-hover)] rounded-xl"
            >
              <div className="h-8 w-16 mx-auto bg-[var(--color-border)] rounded mb-1" />
              <div className="h-3 w-20 mx-auto bg-[var(--color-border)] rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center gap-3 animate-pulse">
        <Clock className="w-5 h-5 text-[var(--color-text-subtle)]" />
        <div className="h-5 w-32 bg-[var(--color-surface-hover)] rounded" />
      </div>

      {/* Task Cards Skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Loading indicator */}
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
      </div>
    </div>
  )
}
