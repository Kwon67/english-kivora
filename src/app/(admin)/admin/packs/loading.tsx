import { Loader2 } from 'lucide-react'

function StatCardSkeleton() {
  return (
    <div className="rounded-[0.9rem] border border-border bg-card p-4 shadow-[var(--shadow-sm)] animate-pulse">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-4 w-24 rounded bg-[var(--color-surface-hover)]" />
        <div className="h-9 w-9 rounded-md bg-[var(--color-surface-hover)]" />
      </div>
      <div className="h-8 w-16 rounded bg-[var(--color-surface-hover)]" />
    </div>
  )
}

function PackCardSkeleton() {
  return (
    <div className="rounded-[0.9rem] border border-border bg-card p-4 shadow-[var(--shadow-sm)] animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-[0.8rem] bg-[var(--color-surface-hover)]" />
        <div className="h-5 w-16 rounded-full bg-[var(--color-surface-hover)]" />
      </div>
      <div className="mt-4 h-5 w-3/4 rounded bg-[var(--color-surface-hover)]" />
      <div className="mt-2 h-4 w-full rounded bg-[var(--color-surface-hover)]" />
      <div className="mt-4 border-t border-border pt-3">
        <div className="h-3 w-20 rounded bg-[var(--color-surface-hover)]" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-6 w-36 rounded-full bg-[var(--color-surface-hover)]" />
          <div className="mt-3 h-8 w-48 rounded bg-[var(--color-surface-hover)]" />
          <div className="mt-2 h-4 w-80 max-w-full rounded bg-[var(--color-surface-hover)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-full bg-[var(--color-surface-hover)]" />
          <div className="h-10 w-32 rounded-full bg-[var(--color-surface-hover)]" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="card h-24 p-5" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <PackCardSkeleton key={index} />
        ))}
      </div>

      <div className="flex justify-center py-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </div>
  )
}