import { Brain, BookOpenCheck, CalendarClock, Layers, Target, Zap } from 'lucide-react'
import {
  reviewHero,
  reviewInnerMax,
  reviewPanel,
  reviewPracticePanel,
  reviewShell,
  reviewTelemetryBand,
  reviewTelemetryCell,
  reviewTile,
} from '@/features/review/lib/reviewPageUi'

function TelemetrySkeleton() {
  return (
    <div className={`${reviewTelemetryCell} animate-pulse`}>
      <div className="h-3 w-12 rounded border border-brand-dark/15 bg-bg-primary sm:w-16" />
      <div className="mt-1.5 h-5 w-10 rounded border border-brand-dark/15 bg-bg-primary sm:mt-2 sm:h-6 sm:w-12" />
    </div>
  )
}

const telemetryIcons = [Layers, Brain, BookOpenCheck, CalendarClock, Target, Zap]

export default function Loading() {
  return (
    <div className={reviewShell}>
      <div className={`${reviewInnerMax} animate-pulse space-y-3 pb-6 sm:space-y-6 sm:pb-10`}>
        <div className="mb-2 hidden h-4 w-40 rounded border border-brand-dark/15 bg-bg-primary sm:block" />

        <div className={`${reviewHero} p-3 sm:p-6 lg:p-8`}>
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <div className="h-4 w-28 rounded border border-brand-dark/15 bg-bg-primary" />
                <div className="flex gap-1.5">
                  <div className="h-10 w-10 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
                  <div className="h-10 w-10 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
                </div>
              </div>
              <div className="hidden h-4 w-32 rounded border border-brand-dark/15 bg-bg-primary lg:block" />
              <div className="h-8 w-48 rounded border border-brand-dark/15 bg-bg-primary sm:h-10 sm:w-64" />
              <div className="h-4 w-full max-w-xs rounded border border-brand-dark/15 bg-bg-primary lg:hidden" />
              <div className="h-12 w-full rounded-[13px] border border-brand-dark/15 bg-bg-primary sm:h-14" />
            </div>
            <div className={`${reviewTile} hidden h-56 lg:block`} />
          </div>
        </div>

        <div className={reviewTelemetryBand}>
          {telemetryIcons.map((Icon, index) => (
            <TelemetrySkeleton key={index} />
          ))}
        </div>

        <main className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className={`${reviewPracticePanel} min-h-[20rem] sm:min-h-[28rem]`}>
            <div className="flex gap-2">
              <div className="h-7 w-24 rounded-full border border-brand-dark/15 bg-bg-primary" />
              <div className="h-7 w-28 rounded-full border border-brand-dark/15 bg-bg-primary" />
            </div>
            <div className="flex min-h-[16rem] flex-col items-center justify-center sm:min-h-[22rem]">
              <Brain className="h-10 w-10 text-brand-secondary" />
              <div className="mt-6 h-10 w-full max-w-md rounded border border-brand-dark/15 bg-bg-primary sm:h-12" />
              <div className="mt-3 h-5 w-48 rounded border border-brand-dark/15 bg-bg-primary" />
            </div>
          </section>

          <aside className="hidden space-y-4 lg:block">
            {[...Array(2)].map((_, index) => (
              <section key={index} className={reviewPanel}>
                <div className="h-6 w-24 rounded-full border border-brand-dark/15 bg-bg-primary" />
                <div className="mt-4 space-y-3">
                  {[...Array(4)].map((__, row) => (
                    <div key={row} className="h-12 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
                  ))}
                </div>
              </section>
            ))}
          </aside>
        </main>
      </div>
    </div>
  )
}