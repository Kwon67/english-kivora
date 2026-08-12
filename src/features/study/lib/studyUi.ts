import { landingHeroCardClass } from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeSectionTitleClass,
  homeShellClass,
  homeSmallPillClass,
  homeSubscribedPillClass,
} from '@/lib/homeStyles'

export const studyShell = `${homeShellClass} study-desk pb-20 sm:pb-10`

/** Hero — offset shadow only, no macOS chrome */
export const studyHero = `${landingHeroCardClass} study-hero-shadow relative overflow-hidden rounded-[13px] sm:rounded-[20px]`

export const studyCard = homeCardClass
export const studySectionTitle = homeSectionTitleClass
export const studyTile = `${homeNestedCardClass} p-4`
export const studyPill = homeSmallPillClass
export const studyDonePill = homeSubscribedPillClass
export const studyPrimaryBtn = `${homePrimaryButton} px-5 py-3 text-base sm:text-lg`
export const studySoftBtn = homeSecondaryButton
export const studyIconBox = homeIconBox

export const studySearchInput = `min-h-11 w-full rounded-[13px] border border-brand-dark bg-bg-primary px-10 py-3 font-body text-sm font-medium text-brand-dark outline-none transition-all placeholder:text-brand-secondary focus:bg-white focus:shadow-[4px_4px_0_#D5E06B]`

export const studyAssignmentCard = `${homeCardClass} flex flex-col gap-4 p-4 transition-transform hover:-translate-y-0.5 sm:p-6`