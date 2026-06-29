import { Brain, BookOpenCheck, Flame, Target } from 'lucide-react'

export default function Loading() {
  return (
    <div className="landing-light relative -mx-4 -my-6 min-h-[calc(100vh-5rem)] overflow-x-hidden bg-bg-primary px-4 py-6 pb-10 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 animate-pulse">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 sm:px-5 lg:px-6">
      <header className="mb-4">
        <div className="overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_18rem]">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="h-6 w-36 rounded-full bg-brand-border" />
                  <div className="mt-3 h-9 w-48 rounded bg-brand-border" />
                  <div className="mt-2 h-4 w-72 max-w-full rounded bg-brand-border" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded-lg border-2 border-brand-dark bg-bg-card" />
                  <div className="h-10 w-10 rounded-lg border-2 border-brand-dark bg-bg-card" />
                  <div className="h-10 w-10 rounded-lg border-2 border-brand-dark bg-bg-card" />
                </div>
              </div>
              <div className="mt-5 h-2 w-full rounded-full bg-brand-border" />
            </div>

            <div className="grid grid-cols-3 border-t-2 border-brand-dark bg-bg-primary lg:grid-cols-1 lg:border-l-2 lg:border-t-0">
              {[BookOpenCheck, Target, Flame].map((Icon, index) => (
                <div key={index} className="border-r border-brand-border p-4 lg:border-b lg:border-r-0">
                  <Icon className="h-4 w-4 text-brand-dark" />
                  <div className="mt-3 h-8 w-12 rounded bg-brand-border" />
                  <div className="mt-2 h-3 w-20 rounded bg-brand-border" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-h-[28rem] rounded-2xl border-2 border-brand-dark bg-bg-card p-4 shadow-[8px_8px_0_var(--color-brand-dark)] sm:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-2">
              <div className="h-7 w-24 rounded-full bg-brand-border" />
              <div className="h-7 w-28 rounded-full bg-brand-border" />
            </div>
            <div className="h-10 w-10 rounded-lg border-2 border-brand-dark bg-bg-card" />
          </div>
          <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
            <Brain className="h-10 w-10 text-brand-secondary" />
            <div className="mt-6 h-12 w-full max-w-md rounded bg-brand-border" />
            <div className="mt-3 h-5 w-48 rounded bg-brand-border" />
          </div>
        </section>

        <aside className="space-y-4">
          {[...Array(2)].map((_, index) => (
            <section key={index} className="rounded-2xl border-2 border-brand-dark bg-bg-card p-4 shadow-[8px_8px_0_var(--color-brand-dark)] sm:p-5">
              <div className="h-6 w-24 rounded-full bg-brand-border" />
              <div className="mt-4 space-y-3">
                {[...Array(4)].map((__, row) => (
                  <div key={row} className="h-12 rounded-xl bg-brand-border" />
                ))}
              </div>
            </section>
          ))}
        </aside>
      </main>
      </div>
    </div>
  )
}
