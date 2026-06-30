import { Loader2 } from 'lucide-react'
import {
  adminPacksHero,
  adminPacksPanel,
  adminPacksShell,
  adminPacksTelemetryBand,
  adminPacksTelemetryCell,
  adminPacksTile,
} from '@/features/admin/lib/adminPacksUi'

function TelemetrySkeleton() {
  return (
    <div className={`${adminPacksTelemetryCell} animate-pulse`}>
      <div className="h-3 w-16 rounded border border-brand-dark/15 bg-bg-primary" />
      <div className="mt-2 h-6 w-12 rounded border border-brand-dark/15 bg-bg-primary" />
    </div>
  )
}

function PackFolderSkeleton() {
  return (
    <div className={`${adminPacksPanel} overflow-hidden animate-pulse`}>
      <div className="flex items-center gap-3 border-b border-brand-dark/15 bg-bg-primary px-4 py-3">
        <div className="h-10 w-10 rounded-[13px] border border-brand-dark/15 bg-bg-card" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 rounded border border-brand-dark/15 bg-bg-card" />
          <div className="h-3 w-24 rounded border border-brand-dark/15 bg-bg-card" />
        </div>
      </div>
      <div className="space-y-2 p-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-12 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        ))}
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className={adminPacksShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl animate-pulse space-y-6 pb-8 sm:space-y-8">
        <div className={`${adminPacksHero} p-6 sm:p-8`}>
          <div className="h-10 w-36 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-4 w-32 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-12 w-72 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-16 w-full max-w-md rounded border border-brand-dark/15 bg-bg-primary" />
            </div>
            <div className={`${adminPacksTile} h-64`} />
          </div>
        </div>

        <div className={adminPacksTelemetryBand}>
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
        </div>

        <div className={`${adminPacksPanel} h-24 p-5`} />

        <div className={`${adminPacksPanel} space-y-4 p-5`}>
          <div className="h-6 w-48 rounded border border-brand-dark/15 bg-bg-primary" />
          <PackFolderSkeleton />
          <PackFolderSkeleton />
        </div>

        <div className="flex justify-center py-2">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}