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

const studyFrostedSurface = 'home-frosted-surface home-frosted-surface-soft'

/** The ruled desk remains visible through every surface, making the blur legible without green blobs. */
export const studyHero = `${landingHeroCardClass} ${studyFrostedSurface} relative overflow-hidden`

export const studyCard = `${homeCardClass} ${studyFrostedSurface}`
export const studySectionTitle = homeSectionTitleClass
export const studyTile = `${homeNestedCardClass} home-frosted-subtle p-4`
export const studyPill = homeSmallPillClass
export const studyDonePill = homeSubscribedPillClass
export const studyPrimaryBtn = `${homePrimaryButton} px-5 py-3 text-base sm:text-lg`
export const studySoftBtn = homeSecondaryButton
export const studyIconBox = homeIconBox

export const studySearchInput = `min-h-11 w-full rounded-control border border-brand-dark bg-bg-primary/55 px-10 py-3 font-body text-sm font-medium text-brand-dark outline-none backdrop-blur-sm transition-all placeholder:text-brand-secondary focus:bg-white/70 focus:shadow-offset-accent`

export const studyAssignmentCard = `${studyCard} flex flex-col gap-4 p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 sm:p-6`

/** Finished work is reference, not a task: one line, no description, no primary-weight button. */
export const studyCompletedRow = `${homeCardClass} home-frosted-subtle flex min-w-0 items-center gap-3 p-3 transition-colors hover:bg-bg-primary/70`
