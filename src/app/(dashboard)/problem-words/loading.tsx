import { Loader2 } from 'lucide-react'
import {
  problemWordsHero,
  problemWordsFrostedSubtle,
  problemWordsPanel,
  problemWordsShell,
  problemWordsTelemetryBand,
} from '@/features/review/lib/problemWordsUi'

export default function Loading() {
  return (
    <div className={problemWordsShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-3xl space-y-6 animate-pulse pb-12 sm:space-y-8">
        <div className={`${problemWordsHero} h-64 sm:h-80`} />

        <div className={problemWordsTelemetryBand}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-20 rounded-control border border-brand-dark/20 ${problemWordsFrostedSubtle}`} />
          ))}
        </div>

        <div className={`${problemWordsPanel} h-72`} />

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}
