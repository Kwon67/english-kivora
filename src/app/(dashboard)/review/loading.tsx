import { Brain } from 'lucide-react'
import {
  reviewHero,
  reviewInnerMax,
  reviewPracticePanel,
  reviewShell,
} from '@/features/review/lib/reviewPageUi'

export default function Loading() {
  return (
    <div className={reviewShell}>
      <div className={`${reviewInnerMax} animate-pulse space-y-3 pb-6 sm:space-y-4 sm:pb-10`}>
        <div className={`${reviewHero} p-3 sm:p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-6 w-40 rounded border border-brand-dark/15 bg-bg-primary sm:h-7 sm:w-48" />
              <div className="h-4 w-28 rounded border border-brand-dark/15 bg-bg-primary" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-10 w-20 rounded-[13px] border border-brand-dark/15 bg-bg-primary sm:w-24" />
              <div className="h-10 w-10 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
              <div className="h-10 w-10 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
            </div>
          </div>
          <div className="mt-3 h-10 w-full rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        </div>

        <section className={`${reviewPracticePanel} min-h-[20rem] sm:min-h-[28rem]`}>
          <div className="flex min-h-[16rem] flex-col items-center justify-center sm:min-h-[22rem]">
            <Brain className="h-10 w-10 text-brand-secondary" />
            <div className="mt-6 h-10 w-full max-w-md rounded border border-brand-dark/15 bg-bg-primary sm:h-12" />
            <div className="mt-3 h-5 w-48 rounded border border-brand-dark/15 bg-bg-primary" />
          </div>
        </section>
      </div>
    </div>
  )
}