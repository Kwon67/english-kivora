function SidebarLine() {
  return <div className="h-9 rounded-md bg-[var(--color-surface-container)]" />
}

export default function Loading() {
  return (
    <div className="min-h-[100svh] overflow-x-hidden animate-pulse">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col gap-4 overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-[var(--shadow-sm)] lg:w-56">
          <div className="border-b border-[var(--color-border)] pb-3">
            <div className="h-9 w-36 rounded-md bg-[var(--color-surface-container)]" />
            <div className="mt-3 h-4 w-16 rounded-md bg-[var(--color-surface-container)]" />
          </div>

          <div className="mt-3 rounded-md bg-[var(--color-surface-container-lowest)] px-2 py-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-[var(--color-surface-container)]" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
                <div className="mt-2 h-3 w-16 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-col">
            {Array.from({ length: 8 }).map((_, index) => (
              <SidebarLine key={index} />
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-[var(--shadow-sm)]">
            <div>
              <div className="h-3 w-24 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
              <div className="mt-2 h-4 w-64 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
            </div>
          </header>

          <div className="space-y-4">
            <div className="h-40 rounded-[1rem] bg-[var(--color-surface-container)]" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-48 rounded-[1rem] bg-[var(--color-surface-container)]" />
              <div className="h-48 rounded-[1rem] bg-[var(--color-surface-container)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
