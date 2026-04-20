function SidebarLine() {
  return <div className="h-12 rounded-full bg-[var(--color-surface-container)]" />
}

export default function Loading() {
  return (
    <div className="min-h-[100svh] overflow-x-hidden animate-pulse">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row overflow-x-hidden">
        <aside className="bg-[var(--color-surface-container-lowest)] flex w-full shrink-0 flex-col rounded-[2rem] editorial-shadow ghost-border p-6 lg:w-[290px]">
          <div className="rounded-[2rem] bg-[var(--color-surface-container)] p-5">
            <div className="h-10 w-40 rounded-full bg-[var(--color-surface-container-high)]" />
            <div className="mt-4 h-7 w-28 rounded-full bg-[var(--color-surface-container-high)]" />
          </div>

          <div className="mt-5 rounded-[28px] border border-[var(--color-border)] bg-white/62 p-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[var(--color-surface-container)]" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded-full bg-[var(--color-surface-container)]" />
                <div className="mt-2 h-3 w-16 rounded-full bg-[var(--color-surface-container)]" />
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <SidebarLine key={index} />
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 editorial-shadow">
            <div>
              <div className="h-3 w-24 rounded-full bg-[var(--color-surface-container)]" />
              <div className="mt-4 h-9 w-80 rounded-2xl bg-[var(--color-surface-container)]" />
            </div>
            <div className="h-16 w-44 rounded-[24px] bg-[var(--color-surface-container)]" />
          </header>

          <div className="space-y-4">
            <div className="h-40 rounded-[2rem] bg-[var(--color-surface-container)]" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-48 rounded-[2rem] bg-[var(--color-surface-container)]" />
              <div className="h-48 rounded-[2rem] bg-[var(--color-surface-container)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
