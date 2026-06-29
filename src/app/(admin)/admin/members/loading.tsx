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

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className={`${glassTile} p-6 sm:p-8 lg:p-10`}>
        <div className="h-10 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="mt-6 space-y-4">
          <div className="h-4 w-32 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-12 w-64 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-16 w-full max-w-md rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        </div>
        <div className="mt-6 h-10 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className={`${glassTile} overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b-2 border-brand-dark/15 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="h-6 w-32 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-8 w-48 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <div className="h-12 w-full rounded-lg border-2 border-brand-dark/20 bg-bg-primary sm:w-64" />
            <div className="h-12 w-full rounded-lg border-2 border-brand-dark/20 bg-bg-primary sm:w-36" />
          </div>
        </div>
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          ))}
        </div>
      </div>

      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
      </div>
    </div>
  )
}