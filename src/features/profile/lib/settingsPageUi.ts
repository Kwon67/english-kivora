import { landingHeroCardClass, landingRadiusLg } from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'

export const settingsShell = `${homeShellClass} settings-console pb-20 sm:pb-10`

export const settingsFrostedSurface = 'home-frosted-surface home-frosted-surface-soft'
export const settingsFrostedSubtle = 'home-frosted-subtle'

/** Hero — offset shadow only, no macOS chrome */
export const settingsHero = `${landingHeroCardClass} ${settingsFrostedSurface} settings-hero-shadow relative overflow-hidden`

export const settingsCard = `${homeCardClass} ${settingsFrostedSurface}`
export const settingsTile = `${homeNestedCardClass} ${settingsFrostedSubtle} p-4 sm:p-6`
export const settingsPill = homeSmallPillClass
export const settingsSoftBtn = homeSecondaryButton
export const settingsPrimaryBtn = `${homePrimaryButton} px-5 py-3 text-base sm:text-lg`
export const settingsIconBox = homeIconBox

export const settingsProtectionStrip = `flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between ${landingRadiusLg} border border-brand-dark bg-brand-accent/40 px-4 py-3 sm:gap-4 ${settingsFrostedSubtle}`

export const settingsTelemetryBand = `grid grid-cols-2 gap-2 ${landingRadiusLg} border border-brand-dark bg-bg-card p-2 sm:gap-3 sm:p-3 ${settingsFrostedSurface}`

export const settingsTelemetryCell = `flex min-w-0 flex-col gap-0.5 ${landingRadiusLg} border border-brand-dark/25 bg-bg-primary px-3 py-2.5 sm:px-4 sm:py-3 ${settingsFrostedSubtle}`

export const settingsNoteBox = `rounded-container border border-dashed border-brand-dark/30 bg-bg-primary px-4 py-3.5 ${settingsFrostedSubtle}`

/* ─── iOS-style grouped list (Settings.app pattern) ───
 * A small-caps label sits above a single rounded, flat card ("group").
 * Rows inside the group are divided by hairlines instead of each row
 * carrying its own border/shadow — mirrors how iOS Ajustes groups items. */

export const settingsGroupLabel =
  'px-1 font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary'

export const settingsGroup = `${homeCardClass} ${settingsFrostedSurface} divide-y divide-brand-dark/12 overflow-hidden`

export const settingsRow = 'flex items-center gap-3 px-4 py-3.5 sm:px-5'

/** Compact leading icon swatch — iOS app-icon proportions (smaller radius than homeIconBox) */
export const settingsRowIcon =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-brand-dark bg-brand-accent text-brand-dark'
