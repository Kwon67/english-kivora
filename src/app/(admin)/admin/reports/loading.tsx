
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse pb-8">
      <div className="premium-card overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[1fr_0.95fr]">
          <div className="p-5 sm:p-6">
            <div className="h-6 w-40 rounded-full bg-[var(--color-surface-hover)]" />
            <div className="mt-4 h-10 w-64 rounded bg-[var(--color-surface-hover)]" />
            <div className="mt-3 h-4 w-full max-w-lg rounded bg-[var(--color-surface-hover)]" />
            <div className="mt-5 h-11 w-36 rounded-xl bg-[var(--color-surface-hover)]" />
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

      <div className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
          <div className="h-6 w-24 rounded-full bg-[var(--color-surface-hover)]" />
          <div className="mt-3 h-7 w-56 rounded bg-[var(--color-surface-hover)]" />
        </div>
        <div className="p-4 sm:p-5">
          <div className="h-64 rounded bg-[var(--color-surface-hover)]" />
        </div>
      </div>

      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    </div>
  )
}
