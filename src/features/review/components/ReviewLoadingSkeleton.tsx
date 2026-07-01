import { Loader2 } from 'lucide-react'
import { landingRadius } from '@/lib/landingStyles'
import {
  reviewHero,
  reviewInnerMax,
  reviewPracticePanel,
  reviewShell,
} from '@/features/review/lib/reviewPageUi'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-brand-border/35 ${className ?? ''}`}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  )
}

interface ReviewLoadingSkeletonProps {
  label?: string
}

export default function ReviewLoadingSkeleton({
  label = 'Preparando revisão...',
}: ReviewLoadingSkeletonProps) {
  return (
    <div className={reviewShell}>
      <div className={`${reviewInnerMax} animate-fade-in space-y-3 pb-6 sm:space-y-4 sm:pb-10`}>
        <div className={`${reviewHero} p-3 sm:p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className={`h-6 w-40 sm:h-7 sm:w-48 ${landingRadius}`} />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Skeleton className={`h-10 w-24 ${landingRadius}`} />
              <Skeleton className={`h-10 w-10 ${landingRadius}`} />
              <Skeleton className={`h-10 w-10 ${landingRadius}`} />
            </div>
          </div>
          <Skeleton className={`mt-3 h-10 w-full ${landingRadius}`} />
        </div>

        <section className={`${reviewPracticePanel} min-h-[20rem] sm:min-h-[28rem]`}>
          <div className="flex min-h-[16rem] flex-col items-center justify-center gap-4 px-4 sm:min-h-[22rem]">
            <Skeleton className={`h-10 w-full max-w-md ${landingRadius}`} />
            <Skeleton className={`h-24 w-full max-w-xl ${landingRadius}`} />
            <Skeleton className="h-5 w-48 rounded-full" />
          </div>
        </section>

        <div className="flex items-center justify-center gap-2 py-2 font-body text-sm text-brand-secondary">
          <Loader2 className="h-4 w-4 animate-spin text-brand-dark" />
          {label}
        </div>
      </div>
    </div>
  )
}