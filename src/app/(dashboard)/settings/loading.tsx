import { Loader2 } from 'lucide-react'
import {
  settingsGroup,
  settingsHero,
  settingsFrostedSubtle,
  settingsShell,
  settingsTelemetryBand,
} from '@/features/profile/lib/settingsPageUi'

export default function Loading() {
  return (
    <div className={settingsShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-4xl space-y-6 animate-pulse pb-12 sm:space-y-8">
        <div className={`${settingsHero} h-64 sm:h-80`} />

        <div className={settingsTelemetryBand}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className={`h-20 rounded-control border border-brand-dark/20 ${settingsFrostedSubtle}`} />
          ))}
        </div>

        <div className="h-20 rounded-control border border-brand-dark/20 bg-bg-card" />

        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-brand-dark/15" />
          <div className={`${settingsGroup} h-32`} />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-20 rounded-full bg-brand-dark/15" />
          <div className={`${settingsGroup} h-56`} />
        </div>

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}
