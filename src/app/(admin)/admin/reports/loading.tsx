
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card p-6">
            <div className="h-4 w-24 rounded bg-[var(--color-surface-hover)]" />
            <div className="mt-4 h-10 w-20 rounded bg-[var(--color-surface-hover)]" />
            <div className="mt-3 h-4 w-40 rounded bg-[var(--color-surface-hover)]" />
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <div className="h-4 w-24 rounded bg-[var(--color-surface-hover)]" />
          <div className="mt-4 h-8 w-56 rounded bg-[var(--color-surface-hover)]" />
        </div>
        <div className="p-6">
          <div className="h-64 rounded bg-[var(--color-surface-hover)]" />
        </div>
      </div>

      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    </div>
  )
}
