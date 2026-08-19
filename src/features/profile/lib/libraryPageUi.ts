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

export const libraryShell = `${homeShellClass} library-archive pb-20 sm:pb-10`

/** Hero — offset shadow only, no macOS chrome */
export const libraryHero = `${landingHeroCardClass} library-hero-shadow relative overflow-hidden `

export const libraryCard = homeCardClass
export const libraryTile = `${homeNestedCardClass} p-4 sm:p-6`
export const libraryPill = homeSmallPillClass
export const librarySoftBtn = homeSecondaryButton
export const libraryPrimaryBtn = `${homePrimaryButton} px-5 py-3 text-base sm:text-lg`
export const libraryIconBox = homeIconBox
export const librarySectionTitle = homeSectionTitleClass
export const libraryPanel = `${libraryCard} p-5 sm:p-7`

export const libraryFolderSpine = 'library-folder-spine'

export const libraryTelemetryBand = `grid grid-cols-3 gap-2 ${landingRadiusLg} border border-brand-dark bg-bg-card p-2 sm:gap-3 sm:p-3`

export const libraryTelemetryCell = `flex min-w-0 flex-col gap-0.5 ${landingRadiusLg} border border-brand-dark/25 bg-bg-primary px-3 py-2.5 sm:px-4 sm:py-3`

export { accountNavWrap as libraryAccountNavWrap } from '@/features/profile/lib/accountPageUi'