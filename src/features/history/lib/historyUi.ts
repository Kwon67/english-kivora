import { landingHeroCardClass , landingRadiusLg} from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeShellClass,
  homeSmallPillClass,
  homeSectionTitleClass,
} from '@/lib/homeStyles'

export const historyShell = `${homeShellClass} history-vault pb-20 sm:pb-10`

/** Hero — offset shadow only, no macOS chrome */
export const historyHero = `${landingHeroCardClass} history-hero-shadow relative overflow-hidden `

export const historyCard = homeCardClass
export const historyTile = `${homeNestedCardClass} p-4 sm:p-6`
export const historyPill = homeSmallPillClass
export const historySoftBtn = homeSecondaryButton
export const historyPrimaryBtn = `${homePrimaryButton} px-5 py-3 text-base sm:text-lg`
export const historyIconBox = homeIconBox
export const historySectionTitle = homeSectionTitleClass
export const historyPanel = `${historyCard} p-5 sm:p-7`

export const historyTelemetryBand = `grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 ${landingRadiusLg} border border-brand-dark bg-bg-card p-2 sm:gap-3 sm:p-3`

export const historyTelemetryCell = `flex min-w-0 flex-col gap-0.5 ${landingRadiusLg} border border-brand-dark/25 bg-bg-primary px-3 py-2.5 sm:px-4 sm:py-3`

export const historyCefrTrack = `grid gap-4 sm:grid-cols-2 ${landingRadiusLg} border border-brand-dark bg-bg-card p-4 sm:p-6`

export const historyMilestoneBar = `mt-3 h-2 overflow-hidden rounded-full border border-brand-dark bg-bg-primary`

export const historyChartBadge = `inline-flex shrink-0 items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1.5 font-heading text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark sm:px-4 sm:py-2 sm:text-xs`