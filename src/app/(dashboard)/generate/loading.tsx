import { Loader2 } from 'lucide-react'
import { cardClass } from '@/features/profile/lib/libraryUi'

const glassTile = cardClass

function StatSkeleton() {
  return (
    <div className="rounded-xl border-2 border-brand-dark/20 bg-bg-primary p-4">
      <div className="h-4 w-4 rounded border-2 border-brand-dark/20 bg-bg-card" />
      <div className="mt-3 h-5 w-16 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
      <div className="mt-2 h-3 w-20 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="home-mobile-optimized gerador-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl animate-pulse space-y-8 pb-12">
        <div className={`${glassTile} overflow-hidden p-6 sm:p-8`}>
          <div className="h-10 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-6 w-32 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
              <div className="h-12 w-4/5 max-w-lg rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
              <div className="h-16 w-full max-w-xl rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
              <div className="grid gap-3 sm:grid-cols-3">
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </div>
            </div>
            <div className="h-64 rounded-2xl border-2 border-brand-dark/20 bg-bg-primary lg:h-full" />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className={`${glassTile} space-y-4 p-5 sm:p-6`}>
            <div className="h-6 w-32 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-8 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-24 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
              <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            </div>
            <div className="h-28 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          </div>

          <div className="space-y-4">
            <div className={`${glassTile} space-y-3 p-5`}>
              <div className="h-6 w-20 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
              ))}
            </div>
            <div className={`${glassTile} h-36 p-5`} />
          </div>
        </div>

        <div className="flex justify-center py-2">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}