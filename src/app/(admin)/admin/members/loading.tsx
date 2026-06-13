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
        <div className="h-10 w-40 rounded-full bg-[var(--color-surface-hover)]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 py-4">
          <div className="h-10 w-full max-w-sm rounded-md bg-[var(--color-surface-hover)]" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 rounded-md bg-[var(--color-surface-hover)]" />
          ))}
        </div>
      </div>

      <div className="flex justify-center py-2">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    </div>
  )
}