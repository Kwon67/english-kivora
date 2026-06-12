function SidebarLine() {
  return <div className="h-12 rounded-[0.8rem] bg-[var(--color-surface-container)]" />
}

export default function Loading() {
  return (
    <div className="min-h-[100svh] overflow-x-hidden animate-pulse">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col gap-4 overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-md)] lg:w-[17.5rem]">
          <div className="rounded-[0.9rem] bg-[var(--color-surface-container)] p-4">
            <div className="h-10 w-40 rounded-[0.75rem] bg-[var(--color-surface-container-high)]" />
            <div className="mt-4 h-7 w-28 rounded-[0.7rem] bg-[var(--color-surface-container-high)]" />
          </div>

          <div className="mt-4 rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[0.75rem] bg-[var(--color-surface-container)]" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
                <div className="mt-2 h-3 w-16 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:flex lg:flex-col">
            {Array.from({ length: 7 }).map((_, index) => (
              <SidebarLine key={index} />
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-md)]">
            <div>
              <div className="h-3 w-24 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
              <div className="mt-4 h-8 w-72 rounded-[0.8rem] bg-[var(--color-surface-container)]" />
            </div>
            <div className="h-11 w-36 rounded-[0.75rem] bg-[var(--color-surface-container)]" />
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
