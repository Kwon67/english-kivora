import { Loader2, Clock } from 'lucide-react'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--color-surface-container-high)] ${className}`}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  )
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`premium-card p-4 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg mt-4" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 pb-20 px-4 sm:px-0">
      {/* Header Skeleton */}
      <div className="premium-card p-4 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-8 w-48 rounded mb-2" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="w-full">
        <Skeleton className="w-full h-[260px] sm:h-[300px] rounded-2xl" />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-16 sm:h-20 rounded-xl"
            />
          ))}
        </div>
      </div>

      {/* Stats Section Skeleton */}
      <div className="premium-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32 rounded mb-1" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="text-center p-3 bg-[var(--color-surface-container-low)] rounded-xl"
            >
              <Skeleton className="h-8 w-16 mx-auto rounded mb-1" />
              <Skeleton className="h-3 w-20 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-text-subtle" />
        <Skeleton className="h-5 w-32 rounded" />
      </div>

      {/* Task Cards Skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="hidden lg:block" />
      </div>

      {/* Loading indicator */}
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    </div>
  )
}
