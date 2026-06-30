import { Loader2 } from 'lucide-react'
import {
  settingsHero,
  settingsPanel,
  settingsShell,
  settingsTelemetryBand,
} from '@/features/profile/lib/settingsPageUi'

export default function Loading() {
  return (
    <div className={settingsShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-4xl space-y-6 animate-pulse pb-12 sm:space-y-8">
        <div className={`${settingsHero} h-64 sm:h-80`} />

        <div className={settingsTelemetryBand}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-[13px] border border-brand-dark/20 bg-bg-primary" />
          ))}
        </div>

        <div className="h-20 rounded-[13px] border border-brand-dark/20 bg-bg-card" />

        <div className={`${settingsPanel} h-56`} />
        <div className={`${settingsPanel} h-72`} />

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}