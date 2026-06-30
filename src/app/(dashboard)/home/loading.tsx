import { Loader2 } from 'lucide-react'
import { homeCardClass } from '@/lib/homeStyles'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-brand-border/40 ${className}`}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  )
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`${homeCardClass} p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-3/4 rounded-[13px]" />
          <Skeleton className="h-4 w-full rounded-[13px]" />
        </div>
        <Skeleton className="h-12 w-12 rounded-[13px]" />
      </div>
      <Skeleton className="mt-4 h-10 w-full rounded-[13px]" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 px-4 pb-20 sm:px-0">
      <div className={`${homeCardClass} flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-8`}>
        <div className="flex-1">
          <Skeleton className="mb-2 h-8 w-48 rounded-[13px]" />
          <Skeleton className="h-4 w-64 rounded-[13px]" />
        </div>
        <Skeleton className="h-10 w-24 rounded-[13px]" />
      </div>

      <div className="w-full">
        <Skeleton className={`h-[260px] w-full sm:h-[300px] ${homeCardClass}`} />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-[13px] sm:h-20" />
          ))}
        </div>
      </div>

      <div className={`${homeCardClass} p-6`}>
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-[13px]" />
            <div>
              <Skeleton className="mb-1 h-5 w-32 rounded-[13px]" />
              <Skeleton className="h-4 w-48 rounded-[13px]" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-[13px]" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-[13px] bg-bg-primary p-3 text-center">
              <Skeleton className="mx-auto mb-1 h-8 w-16 rounded-[13px]" />
              <Skeleton className="mx-auto h-3 w-20 rounded-[13px]" />
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="h-5 w-32 rounded-[13px]" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard className="hidden lg:block" />
      </div>

      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
      </div>
    </div>
  )
}