import { glassTile } from '@/features/admin/lib/adminUi'

function SidebarLine() {
  return <div className="h-9 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
}

export default function Loading() {
  return (
    <div className="min-h-screen min-h-[100svh] overflow-x-hidden bg-bg-primary animate-pulse">
      <div className="mx-auto flex min-h-screen min-h-[100svh] w-full max-w-[1440px] flex-col gap-4 overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:flex-row">
        <aside className={`${glassTile} flex w-full shrink-0 flex-col overflow-hidden p-3 lg:w-56`}>
          <div className="border-b-2 border-brand-dark/15 pb-3">
            <div className="h-9 w-36 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="mt-3 h-6 w-16 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
          </div>

          <div className="mt-3 rounded-xl border-2 border-brand-dark/20 bg-bg-primary px-3 py-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl border-2 border-brand-dark/20 bg-bg-card" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
                <div className="mt-2 h-3 w-16 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-col">
            {Array.from({ length: 8 }).map((_, index) => (
              <SidebarLine key={index} />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <div className={`${glassTile} h-40 p-6`}>
            <div className="h-10 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="mt-6 h-8 w-64 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`${glassTile} h-48`} />
            <div className={`${glassTile} h-48`} />
          </div>
        </main>
      </div>
    </div>
  )
}