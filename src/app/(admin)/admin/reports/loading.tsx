import { Loader2 } from 'lucide-react'
import {
  adminReportsHero,
  adminReportsPanel,
  adminReportsShell,
  adminReportsTelemetryBand,
  adminReportsTelemetryCell,
  adminReportsTile,
} from '@/features/admin/lib/adminReportsUi'

function TelemetrySkeleton() {
  return (
    <div className={`${adminReportsTelemetryCell} animate-pulse`}>
      <div className="h-3 w-16 rounded border border-brand-dark/15 bg-bg-primary" />
      <div className="mt-2 h-6 w-12 rounded border border-brand-dark/15 bg-bg-primary" />
    </div>
  )
}

function WeaknessCardSkeleton() {
  return (
    <div className={`${adminReportsPanel} animate-pulse p-5`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        <div className="space-y-2">
          <div className="h-4 w-28 rounded border border-brand-dark/15 bg-bg-primary" />
          <div className="h-5 w-36 rounded border border-brand-dark/15 bg-bg-primary" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-16 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        <div className="h-16 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className={adminReportsShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl animate-pulse space-y-6 pb-8 sm:space-y-8">
        <div className={`${adminReportsHero} p-6 sm:p-8`}>
          <div className="h-10 w-36 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-4 w-32 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-12 w-72 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-16 w-full max-w-md rounded border border-brand-dark/15 bg-bg-primary" />
            </div>
            <div className={`${adminReportsTile} h-64`} />
          </div>
        </div>

        <div className={adminReportsTelemetryBand}>
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
        </div>

        <div className={`${adminReportsPanel} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-brand-dark/15 px-6 py-5">
            <div className="space-y-3">
              <div className="h-6 w-24 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-8 w-48 rounded border border-brand-dark/15 bg-bg-primary" />
            </div>
            <div className="h-8 w-32 rounded-full border border-brand-dark/15 bg-bg-primary" />
          </div>
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <WeaknessCardSkeleton />
          <WeaknessCardSkeleton />
          <WeaknessCardSkeleton />
        </div>

        <div className={`${adminReportsPanel} overflow-hidden`}>
          <div className="border-b border-brand-dark/15 px-6 py-5">
            <div className="h-6 w-40 rounded border border-brand-dark/15 bg-bg-primary" />
            <div className="mt-3 h-8 w-48 rounded border border-brand-dark/15 bg-bg-primary" />
          </div>
          <div className="h-72 bg-bg-primary/40" />
        </div>

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}