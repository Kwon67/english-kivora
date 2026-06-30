import { landingHeroCardClass, landingRadius } from '@/lib/landingStyles'
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

export const settingsShell = `${homeShellClass} settings-console pb-20 sm:pb-10`

/** Hero — offset shadow only, no macOS chrome */
export const settingsHero = `${landingHeroCardClass} settings-hero-shadow relative overflow-hidden rounded-[13px] sm:rounded-[20px]`

export const settingsCard = homeCardClass
export const settingsTile = `${homeNestedCardClass} p-4 sm:p-6`
export const settingsPill = homeSmallPillClass
export const settingsSoftBtn = homeSecondaryButton
export const settingsPrimaryBtn = `${homePrimaryButton} px-5 py-3 text-base sm:text-lg`
export const settingsIconBox = homeIconBox
export const settingsSectionTitle = homeSectionTitleClass
export const settingsPanel = `${settingsCard} p-5 sm:p-7`

export const settingsProtectionStrip = `flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between ${landingRadius} border border-brand-dark bg-brand-accent/40 px-4 py-3 sm:gap-4`

export const settingsTelemetryBand = `grid grid-cols-2 gap-2 sm:grid-cols-3 ${landingRadius} border border-brand-dark bg-bg-card p-2 sm:gap-3 sm:p-3`

export const settingsTelemetryCell = `flex min-w-0 flex-col gap-0.5 ${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5 sm:px-4 sm:py-3`

export const settingsSectionHeader = `flex items-start gap-4 border-b border-brand-dark/15 pb-5`

export const settingsNoteBox = `rounded-[13px] border border-dashed border-brand-dark/30 bg-bg-primary px-4 py-3.5`