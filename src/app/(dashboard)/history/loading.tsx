import { Loader2 } from 'lucide-react'
import {
  historyCard,
  historyFrostedSubtle,
  historyHero,
  historyShell,
  historyTelemetryBand,
} from '@/features/history/lib/historyUi'

export default function Loading() {
  return (
    <div className={historyShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl space-y-6 animate-pulse pb-12 sm:space-y-8">
        <div className={`${historyHero} h-64 sm:h-80`} />

        <div className={historyTelemetryBand}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${historyFrostedSubtle} h-20 border border-brand-dark/20`} />
          ))}
        </div>

        <div className={`${historyCard} h-36`} />

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className={`${historyCard} h-80`} />
          <div className={`${historyCard} h-80`} />
        </div>

        <div className={`${historyCard} h-96`} />

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}
