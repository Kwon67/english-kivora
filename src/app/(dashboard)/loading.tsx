import { Loader2, Sparkles } from 'lucide-react'
import { homeCardClass, homeFrostedSurface } from '@/lib/homeStyles'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--color-surface-container-high)] ${className}`}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  )
}

function MetricSkeleton() {
  return (
    <div className="stitch-panel p-5">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="mt-4 h-9 w-20 rounded-xl" />
      <Skeleton className="mt-3 h-4 w-32 rounded-full" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-5 pb-8">
      <section className={`${homeCardClass} ${homeFrostedSurface} overflow-hidden p-6 sm:p-7`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-primary">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            <Skeleton className="mt-5 h-10 w-56 rounded-2xl" />
            <Skeleton className="mt-3 h-4 w-full max-w-xl rounded-full" />
            <Skeleton className="mt-2 h-4 w-4/5 max-w-lg rounded-full" />
          </div>
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </section>

      <section className={`${homeCardClass} ${homeFrostedSurface} p-6 sm:p-7`}>
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="mt-4 h-8 w-52 rounded-2xl" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-[1.25rem] bg-[var(--color-surface-container-low)] p-4"
            >
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="mt-3 h-4 w-full rounded-full" />
              <Skeleton className="mt-2 h-4 w-2/3 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 py-3 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Carregando conteúdo premium...
      </div>
    </div>
  )
}
