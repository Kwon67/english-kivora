import { Loader2 } from 'lucide-react'
import {
  libraryHero,
  libraryPanel,
  libraryShell,
  libraryTelemetryBand,
} from '@/features/profile/lib/libraryPageUi'

export default function Loading() {
  return (
    <div className={libraryShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl space-y-6 animate-pulse pb-12 sm:space-y-8">
        <div className={`${libraryHero} h-64 sm:h-80`} />

        <div className={libraryTelemetryBand}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-control border border-brand-dark/20 bg-bg-primary" />
          ))}
        </div>

        <div className="h-20 rounded-control border border-brand-dark/20 bg-bg-card" />

        <div className={`${libraryPanel} h-96`} />

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}