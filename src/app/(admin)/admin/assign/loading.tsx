import { Loader2 } from 'lucide-react'
import {
  adminAssignHero,
  adminAssignPanel,
  adminAssignShell,
  adminAssignTelemetryBand,
  adminAssignTelemetryCell,
  adminAssignTile,
} from '@/features/admin/lib/adminAssignUi'

function TelemetrySkeleton() {
  return (
    <div className={`${adminAssignTelemetryCell} animate-pulse`}>
      <div className="h-3 w-16 rounded border border-brand-dark/15 bg-bg-primary" />
      <div className="mt-2 h-6 w-12 rounded border border-brand-dark/15 bg-bg-primary" />
    </div>
  )
}

function FormSectionSkeleton() {
  return (
    <div className={`${adminAssignPanel} animate-pulse space-y-4`}>
      <div className="rounded-[13px] border border-brand-dark/15 bg-bg-primary p-4">
        <div className="h-6 w-36 rounded border border-brand-dark/15 bg-bg-card" />
        <div className="mt-4 h-4 w-64 rounded border border-brand-dark/15 bg-bg-card" />
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="h-12 rounded-[13px] border border-brand-dark/15 bg-bg-card" />
          <div className="h-12 rounded-[13px] border border-brand-dark/15 bg-bg-card" />
          <div className="h-12 rounded-[13px] border border-brand-dark/15 bg-bg-card" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-12 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        <div className="h-12 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        ))}
      </div>
      <div className="h-12 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
    </div>
  )
}

function PanelSectionSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <div className={`${adminAssignPanel} animate-pulse`}>
      <div className={`h-6 rounded border border-brand-dark/15 bg-bg-primary ${titleWidth}`} />
      <div className="mt-4 h-4 w-72 max-w-full rounded border border-brand-dark/15 bg-bg-primary" />
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="h-72 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className={adminAssignShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl animate-pulse space-y-6 pb-8 sm:space-y-8">
        <div className={`${adminAssignHero} p-6 sm:p-8`}>
          <div className="h-10 w-36 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-4 w-32 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-12 w-72 rounded border border-brand-dark/15 bg-bg-primary" />
              <div className="h-16 w-full max-w-md rounded border border-brand-dark/15 bg-bg-primary" />
            </div>
            <div className={`${adminAssignTile} h-64`} />
          </div>
        </div>

        <div className={adminAssignTelemetryBand}>
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
          <TelemetrySkeleton />
        </div>

        <FormSectionSkeleton />
        <PanelSectionSkeleton titleWidth="w-44" />
        <PanelSectionSkeleton titleWidth="w-40" />

        <div className={adminAssignPanel}>
          <div className="h-6 w-48 rounded border border-brand-dark/15 bg-bg-primary" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-20 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
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