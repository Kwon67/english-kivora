import { Loader2 } from 'lucide-react'
import { pageBgGlowExplore, pageBgGridExplore } from '@/lib/pageShellBackground'

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]'

export default function Loading() {
  return (
    <div className="home-mobile-optimized historico-root relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-12 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#0a0a0a]">
      <div className={pageBgGridExplore} />
      <div className={pageBgGlowExplore} />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 animate-pulse pb-12">
        <div className={`${glassTile} h-64 sm:h-72`} />

        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`${glassTile} h-36`} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className={`${glassTile} h-80`} />
          <div className={`${glassTile} h-80`} />
        </div>

        <div className={`${glassTile} h-96`} />

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    </div>
  )
}