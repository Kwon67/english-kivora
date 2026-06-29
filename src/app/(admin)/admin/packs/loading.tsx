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

function PackFolderSkeleton() {
  return (
    <div className={`${glassTile} overflow-hidden animate-pulse`}>
      <div className="flex items-center gap-3 border-b-2 border-brand-dark/15 bg-bg-primary px-4 py-3">
        <div className="h-10 w-10 rounded-xl border-2 border-brand-dark/20 bg-bg-card" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
          <div className="h-3 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
        </div>
      </div>
      <div className="space-y-2 p-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        ))}
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
          <div className="h-4 w-32 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-12 w-64 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-16 w-full max-w-md rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        </div>
        <div className="mt-6 flex gap-2">
          <div className="h-10 w-28 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-10 w-32 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className={`${glassTile} h-24 p-5`} />

      <div className={`${glassTile} space-y-4 p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="h-6 w-40 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-4 w-full max-w-md rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          </div>
          <div className="h-12 w-full rounded-lg border-2 border-brand-dark/20 bg-bg-primary sm:w-72" />
        </div>
        <div className="space-y-3">
          <PackFolderSkeleton />
          <PackFolderSkeleton />
        </div>
      </div>

      <div className="flex justify-center py-2">
        <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
      </div>
    </div>
  )
}