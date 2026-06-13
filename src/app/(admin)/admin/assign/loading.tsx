import { Loader2 } from 'lucide-react'

function StatCardSkeleton() {
  return (
    <div className="rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-sm)] animate-pulse">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-4 w-24 rounded bg-[var(--color-surface-hover)]" />
        <div className="h-9 w-9 rounded-md bg-[var(--color-surface-hover)]" />
      </div>
      <div className="h-8 w-16 rounded bg-[var(--color-surface-hover)]" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-6 w-36 rounded-full bg-[var(--color-surface-hover)]" />
          <div className="mt-3 h-8 w-56 rounded bg-[var(--color-surface-hover)]" />
          <div className="mt-2 h-4 w-80 max-w-full rounded bg-[var(--color-surface-hover)]" />
        </div>
        <div className="h-10 w-32 rounded-full bg-[var(--color-surface-hover)]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="card max-w-6xl space-y-4 p-5">
        <div className="h-28 rounded-[0.9rem] bg-[var(--color-surface-hover)]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-12 rounded-[0.9rem] bg-[var(--color-surface-hover)]" />
          <div className="h-12 rounded-[0.9rem] bg-[var(--color-surface-hover)]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 rounded-md bg-[var(--color-surface-hover)]" />
          ))}
        </div>
        <div className="h-12 rounded-xl bg-[var(--color-surface-hover)]" />
      </div>

      <div className="card max-w-6xl p-5">
        <div className="h-6 w-44 rounded bg-[var(--color-surface-hover)]" />
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="h-72 rounded-[1rem] bg-[var(--color-surface-hover)]" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 rounded-[1rem] bg-[var(--color-surface-hover)]" />
            ))}
          </div>
        </div>
      </div>

      <div className="card max-w-6xl p-5">
        <div className="h-6 w-40 rounded bg-[var(--color-surface-hover)]" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-20 rounded-[1rem] bg-[var(--color-surface-hover)]" />
          ))}
        </div>
      </div>

      <div className="flex justify-center py-2">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    </div>
  )
}