import { Loader2, Sparkles } from 'lucide-react'

function MetricSkeleton() {
  return (
    <div className="stitch-panel p-5">
      <div className="h-3 w-24 rounded-full bg-[var(--color-surface-container)]" />
      <div className="mt-4 h-9 w-20 rounded-xl bg-[var(--color-surface-container)]" />
      <div className="mt-3 h-4 w-32 rounded-full bg-[var(--color-surface-container)]" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-5 pb-8 animate-pulse">
      <section className="premium-card overflow-hidden p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="mt-5 h-10 w-56 rounded-2xl bg-[var(--color-surface-container)]" />
            <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-[var(--color-surface-container)]" />
            <div className="mt-2 h-4 w-4/5 max-w-lg rounded-full bg-[var(--color-surface-container)]" />
          </div>
          <div className="h-11 w-28 rounded-full bg-[var(--color-surface-container)]" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </section>

      <section className="premium-card p-6 sm:p-7">
        <div className="h-4 w-28 rounded-full bg-[var(--color-surface-container)]" />
        <div className="mt-4 h-8 w-52 rounded-2xl bg-[var(--color-surface-container)]" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-[1.25rem] bg-[var(--color-surface-container-low)] p-4"
            >
              <div className="h-5 w-40 rounded-full bg-[var(--color-surface-container)]" />
              <div className="mt-3 h-4 w-full rounded-full bg-[var(--color-surface-container)]" />
              <div className="mt-2 h-4 w-2/3 rounded-full bg-[var(--color-surface-container)]" />
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 py-3 text-sm text-[var(--color-text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando proxima secao...
      </div>
    </div>
  )
}
