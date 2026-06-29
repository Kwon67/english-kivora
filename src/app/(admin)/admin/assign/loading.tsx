import { Loader2 } from 'lucide-react'
import { glassTile } from '@/features/admin/lib/adminUi'

function StatCardSkeleton() {
  return (
    <div className={`${glassTile} p-5 animate-pulse`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="h-6 w-28 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="h-10 w-10 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
      </div>
      <div className="h-8 w-16 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
      <div className="mt-4 h-4 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
    </div>
  )
}

function FormSectionSkeleton() {
  return (
    <div className={`${glassTile} max-w-6xl space-y-4 p-5 animate-pulse`}>
      <div className={`rounded-xl border-2 border-brand-dark/20 bg-bg-primary p-4`}>
        <div className="h-6 w-36 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
        <div className="mt-4 h-4 w-64 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
          <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
          <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
        ))}
      </div>
      <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
    </div>
  )
}

function PanelSectionSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <div className={`${glassTile} max-w-6xl p-5 animate-pulse`}>
      <div className={`h-6 rounded-lg border-2 border-brand-dark/20 bg-bg-primary ${titleWidth}`} />
      <div className="mt-4 h-4 w-72 max-w-full rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="h-72 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse pb-8">
      <div className={`${glassTile} p-6 sm:p-8 lg:p-10`}>
        <div className="h-10 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="mt-6 space-y-4">
          <div className="h-6 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-12 w-72 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-16 w-full max-w-md rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        </div>
        <div className="mt-6 h-10 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <FormSectionSkeleton />

      <PanelSectionSkeleton titleWidth="w-44" />

      <PanelSectionSkeleton titleWidth="w-40" />

      <div className={`${glassTile} max-w-6xl p-5`}>
        <div className="h-6 w-48 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-20 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
          ))}
        </div>
      </div>

      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
      </div>
    </div>
  )
}