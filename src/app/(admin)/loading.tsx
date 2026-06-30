import {
  adminDashboardHero,
  adminDashboardPanel,
  adminSidebarShell,
  adminSidebarHeader,
  adminSidebarProfile,
  adminDashboardTelemetryBand,
  adminDashboardTelemetryCell,
} from '@/features/admin/lib/adminDashboardUi'

function TelemetrySkeleton() {
  return (
    <div className={`${adminDashboardTelemetryCell} animate-pulse`}>
      <div className="h-3 w-16 rounded border border-brand-dark/15 bg-bg-primary" />
      <div className="mt-2 h-6 w-12 rounded border border-brand-dark/15 bg-bg-primary" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="min-h-screen min-h-[100svh] animate-pulse overflow-x-hidden bg-bg-primary">
      <div className="relative z-10 mx-auto flex min-h-screen min-h-[100svh] w-full max-w-[1440px] flex-col gap-4 overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:flex-row">
        <aside className={adminSidebarShell}>
          <div className={adminSidebarHeader}>
            <div className="h-9 w-36 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
            <div className="mt-3 h-6 w-16 rounded-full border border-brand-dark/15 bg-bg-primary" />
          </div>

          <div className={`${adminSidebarProfile} mt-3`}>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-[13px] border border-brand-dark/15 bg-bg-card" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded border border-brand-dark/15 bg-bg-card" />
                <div className="mt-2 h-3 w-16 rounded border border-brand-dark/15 bg-bg-card" />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1.5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-9 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <div className={`${adminDashboardHero} h-40 p-6`}>
            <div className="h-10 w-24 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
            <div className="mt-6 h-8 w-64 rounded border border-brand-dark/15 bg-bg-primary" />
          </div>

          <div className={adminDashboardTelemetryBand}>
            <TelemetrySkeleton />
            <TelemetrySkeleton />
            <TelemetrySkeleton />
          </div>

          <div className={`${adminDashboardPanel} h-48`} />
        </main>
      </div>
    </div>
  )
}