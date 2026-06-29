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

function WeaknessCardSkeleton() {
  return (
    <div className={`${glassTile} p-5 animate-pulse`}>
      <div className="flex items-center justify-between gap-3">
        <div className="h-6 w-32 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="h-10 w-10 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-16 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="h-16 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse pb-8">
      <div className={`${glassTile} p-6 sm:p-8`}>
        <div className="h-10 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="mt-6 space-y-4">
          <div className="h-4 w-32 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-12 w-64 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="h-16 w-full max-w-md rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        </div>
        <div className="mt-6 h-10 w-36 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className={`${glassTile} overflow-hidden`}>
        <div className="flex items-center justify-between border-b-2 border-brand-dark/15 px-6 py-5">
          <div className="space-y-3">
            <div className="h-6 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-8 w-48 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          </div>
          <div className="h-8 w-32 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
        </div>
        <div className="space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <WeaknessCardSkeleton />
        <WeaknessCardSkeleton />
        <WeaknessCardSkeleton />
      </div>

      <div className={`${glassTile} overflow-hidden`}>
        <div className="border-b-2 border-brand-dark/15 px-6 py-5">
          <div className="h-6 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="mt-3 h-8 w-48 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        </div>
        <div className="h-72 bg-bg-primary/40" />
      </div>

      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
      </div>
    </div>
  )
}