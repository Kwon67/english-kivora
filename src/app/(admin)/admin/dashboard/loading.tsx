import { Loader2 } from 'lucide-react'
import {
  adminDashboardHero,
  adminDashboardPanel,
  adminDashboardShell,
  adminDashboardTelemetryBand,
  adminDashboardTelemetryCell,
  adminDashboardTile,
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
    <div className={adminDashboardShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl space-y-6 animate-pulse pb-8 sm:space-y-8">
        <div className={`${adminDashboardHero} p-6 sm:p-8`}>
          <div className="h-10 w-24 rounded-control border border-brand-dark/20 bg-bg-primary" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-4 w-32 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-12 w-72 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-16 w-full max-w-md rounded border border-brand-dark/15 bg-bg-primary" />
            </div>
            <div className={`${adminDashboardTile} h-64`} />
          </div>
        </div>

        <div className={`${adminDashboardTelemetryBand}`}>
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
        </div>

        <div className={adminDashboardPanel}>
          <div className="h-6 w-48 rounded border border-brand-dark/15 bg-bg-primary" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-control border border-brand-dark/15 bg-bg-primary" />
            ))}
          </div>
        </div>

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}