import { Brain, BookOpenCheck, Flame, Target } from 'lucide-react'

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-5 lg:px-6 animate-pulse">
      <header className="mb-4">
        <div className="premium-card overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_18rem]">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="h-6 w-36 rounded-full bg-[var(--color-surface-hover)]" />
                  <div className="mt-3 h-9 w-48 rounded bg-[var(--color-surface-hover)]" />
                  <div className="mt-2 h-4 w-72 max-w-full rounded bg-[var(--color-surface-hover)]" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded-[0.8rem] bg-[var(--color-surface-hover)]" />
                  <div className="h-10 w-10 rounded-[0.8rem] bg-[var(--color-surface-hover)]" />
                  <div className="h-10 w-10 rounded-[0.8rem] bg-[var(--color-surface-hover)]" />
                </div>
              </div>
              <div className="mt-5 h-2 w-full rounded-full bg-[var(--color-surface-hover)]" />
            </div>

            <div className="grid grid-cols-3 border-t border-border bg-[var(--color-surface-container-low)] lg:grid-cols-1 lg:border-l lg:border-t-0">
              {[BookOpenCheck, Target, Flame].map((Icon, index) => (
                <div key={index} className="border-r border-border p-4 lg:border-b lg:border-r-0">
                  <Icon className="h-4 w-4 text-text-subtle" />
                  <div className="mt-3 h-8 w-12 rounded bg-[var(--color-surface-hover)]" />
                  <div className="mt-2 h-3 w-20 rounded bg-[var(--color-surface-hover)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="premium-card min-h-[28rem] p-4 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-2">
              <div className="h-7 w-24 rounded-[0.65rem] bg-[var(--color-surface-hover)]" />
              <div className="h-7 w-28 rounded-[0.65rem] bg-[var(--color-surface-hover)]" />
            </div>
            <div className="h-10 w-10 rounded-[0.8rem] bg-[var(--color-surface-hover)]" />
          </div>
          <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
            <Brain className="h-10 w-10 text-text-subtle" />
            <div className="mt-6 h-12 w-full max-w-md rounded bg-[var(--color-surface-hover)]" />
            <div className="mt-3 h-5 w-48 rounded bg-[var(--color-surface-hover)]" />
          </div>
        </section>

        <aside className="space-y-4">
          {[...Array(2)].map((_, index) => (
            <section key={index} className="card p-4 sm:p-5">
              <div className="h-6 w-24 rounded-full bg-[var(--color-surface-hover)]" />
              <div className="mt-4 space-y-3">
                {[...Array(4)].map((__, row) => (
                  <div key={row} className="h-12 rounded-[0.85rem] bg-[var(--color-surface-hover)]" />
                ))}
              </div>
            </section>
          ))}
        </aside>
      </main>
    </div>
  )
}
