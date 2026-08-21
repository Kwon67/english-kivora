import { primaryBtn, softBtn, softKicker } from '@/lib/brandUi'
import {
  pageBgGlow,
  pageBgGlowExplore,
  pageBgGrid,
  pageBgGridExplore,
} from '@/lib/pageShellBackground'

export { softKicker, primaryBtn, softBtn }

export const dashboardShell =
  'home-mobile-optimized relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-10 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8'

export const dashboardShellExplore =
  'home-mobile-optimized relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-12 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8'

export const dashboardBgGrid = pageBgGrid
export const dashboardBgGlow = pageBgGlow
export const dashboardBgGridExplore = pageBgGridExplore
export const dashboardBgGlowExplore = pageBgGlowExplore

export const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-border-muted/20 bg-card shadow-[0_18px_48px_rgba(28, 25, 21,0.14)]'

export const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-container border border-dashed border-border-muted/22 bg-bg-card shadow-[0_12px_34px_rgba(28, 25, 21,0.10)]'

export const cardSheen =
  'home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)]'