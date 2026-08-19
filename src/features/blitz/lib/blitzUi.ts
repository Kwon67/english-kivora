import { landingHeroCardClass, landingRadius , landingRadiusLg} from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePillClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'

export const blitzShell = `${homeShellClass} blitz-arena pb-20 sm:pb-10`

/** Hero arena — offset shadow, no macOS chrome */
export const blitzHeroArena = `${landingHeroCardClass} blitz-hero-arena blitz-hero-shadow relative overflow-hidden `

export const blitzCard = homeCardClass
export const blitzTile = `${homeNestedCardClass} p-4`
export const blitzKicker = homeSmallPillClass
export const blitzPill = homePillClass
export const blitzSoftBtn = homeSecondaryButton
export const blitzIconBox = homeIconBox
export const blitzHudCard = `${blitzCard} blitz-hero-shadow`

/** Full-width on mobile; scales up from sm */
export const blitzPrimaryBtn = `${homePrimaryButton} w-full px-5 py-3 text-base sm:w-auto sm:px-6 sm:text-lg`

export const blitzNestedRow = `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${landingRadiusLg} border border-brand-dark bg-bg-card px-3 py-3 sm:px-4`

export const blitzScoreTicker = `grid grid-cols-2 gap-3 ${landingRadiusLg} border border-brand-dark bg-brand-accent p-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1 sm:p-4`

export const blitzModeSwitch = `flex w-full ${landingRadiusLg} border border-brand-dark bg-bg-primary p-1 sm:inline-flex sm:w-auto`

export const blitzModeOption = (active: boolean) =>
  `flex min-h-11 flex-1 items-center justify-center gap-2 ${landingRadius} px-3 py-2.5 font-heading text-xs font-bold transition-colors sm:min-h-0 sm:flex-none sm:px-4 ${
    active ? 'bg-brand-dark text-white' : 'text-brand-dark hover:bg-bg-card'
  }`

/** @deprecated Use blitzCard or blitzHeroArena */
export const blitzGlassPanel = blitzCard
/** @deprecated Use blitzTile */
export const blitzGlassTile = blitzTile

export const blitzBgGrid = ''
export const blitzBgGlow = ''