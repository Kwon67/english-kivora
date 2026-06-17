export default function Loading() {
  return (
    <main className="min-h-[100svh] bg-[var(--color-background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-4">
          <div className="h-36 animate-pulse rounded-[1.5rem] bg-[var(--color-surface-container-high)]" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-[1rem] bg-[var(--color-surface-container-high)]" />
            <div className="h-24 animate-pulse rounded-[1rem] bg-[var(--color-surface-container-high)]" />
            <div className="h-24 animate-pulse rounded-[1rem] bg-[var(--color-surface-container-high)]" />
          </div>
          <div className="h-64 animate-pulse rounded-[1.25rem] bg-[var(--color-surface-container-high)]" />
        </section>
        <aside className="hidden space-y-4 lg:block">
          <div className="h-40 animate-pulse rounded-[1.25rem] bg-[var(--color-surface-container-high)]" />
          <div className="h-56 animate-pulse rounded-[1.25rem] bg-[var(--color-surface-container-high)]" />
        </aside>
      </div>
    </main>
  )
}
