import { landingRadiusLg } from '@/lib/landingStyles'
import {
  homeCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'

/** Wizard shell — fills the safe viewport on mobile/PWA and has no fixed bottom nav. */
export const onboardingShellClass = `${homeShellClass} !min-h-[calc(100svh-3.75rem)] pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] sm:!min-h-[calc(100svh-4.75rem)] sm:pb-10`

export const onboardingCardClass = `${homeCardClass} min-w-0`

export const onboardingPrimaryButton = `${homePrimaryButton} w-full min-h-11 touch-manipulation px-5 py-3 text-base sm:w-auto sm:min-h-0 sm:px-6 sm:text-lg`

export const onboardingSecondaryButton = `${homeSecondaryButton} w-full min-h-11 touch-manipulation sm:w-auto sm:min-h-0`

export const onboardingMethodOptionClass = `flex w-full min-h-[4.5rem] min-w-0 touch-manipulation items-start gap-3 rounded-control border border-brand-dark bg-bg-primary p-4 text-left transition hover:bg-brand-accent/30 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-4 sm:min-h-[4.75rem]`

export const onboardingMethodOptionDisabledClass = `${onboardingMethodOptionClass} cursor-not-allowed opacity-55 hover:bg-bg-primary`

export const onboardingLevelOptionClass = `flex w-full min-h-11 min-w-0 touch-manipulation items-center justify-between gap-3 rounded-control border border-brand-dark bg-bg-primary px-4 py-3 text-left transition hover:bg-brand-accent/30 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[3.25rem]`

export const onboardingLevelLabelClass = 'flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2'

export const onboardingComingSoonPill = `inline-flex w-fit shrink-0 items-center rounded-full border border-brand-dark/40 bg-bg-card px-2 py-0.5 font-heading text-[0.625rem] font-bold uppercase tracking-widest text-brand-secondary`

export const onboardingAiBadge = `inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-brand-dark/40 bg-brand-accent/60 px-2 py-0.5 font-heading text-[0.625rem] font-bold uppercase tracking-widest text-brand-dark`

export const onboardingProgressStrip = `flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden ${landingRadiusLg} border border-brand-dark bg-brand-accent/55 px-4 py-3`

export const onboardingInterestChip = (selected: boolean) =>
  `inline-flex min-h-10 min-w-0 touch-manipulation items-center justify-center rounded-full border px-4 py-2 font-heading text-sm font-bold transition ${
    selected
      ? 'border-brand-dark bg-brand-accent text-brand-dark'
      : 'border-brand-dark bg-bg-primary text-brand-dark hover:bg-brand-accent/30'
  }`

export const onboardingGoalOptionClass = (selected: boolean) =>
  `flex w-full min-h-11 min-w-0 touch-manipulation items-center justify-between gap-3 rounded-control border px-4 py-3 text-left transition sm:min-h-[3.25rem] ${
    selected
      ? 'border-brand-dark bg-brand-accent text-brand-dark'
      : 'border-brand-dark bg-bg-primary text-brand-dark hover:bg-brand-accent/30'
  }`

export const onboardingGoalLabelClass =
  'min-w-0 flex-1 font-heading text-sm font-bold leading-snug sm:text-base'

export const onboardingGoalMinutesClass = 'shrink-0 text-sm font-semibold text-brand-secondary'

export const onboardingPackCardClass = `${homeCardClass} min-w-0 overflow-hidden`

export const onboardingPackMetaPill = `${homeSmallPillClass} max-w-full min-w-0 truncate`

export const onboardingPackSuggestOption = (selected: boolean) =>
  `flex w-full min-h-11 min-w-0 touch-manipulation items-center justify-between gap-3 rounded-control border px-4 py-3 text-left transition ${
    selected
      ? 'border-brand-dark bg-brand-accent text-brand-dark'
      : 'border-brand-dark bg-bg-primary text-brand-dark hover:bg-brand-accent/30'
  }`

export const onboardingActionRow = 'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'

// Mesmo material do skeleton do resto do site (.skeleton-block em globals.css).
export const onboardingPackSkeletonBlock = 'skeleton-block rounded-container'

export const homeWelcomePrimaryButton = `${homePrimaryButton} w-full min-h-11 touch-manipulation sm:w-auto sm:min-h-0`

export const homeWelcomeSecondaryButton = `${homeSecondaryButton} w-full min-h-11 touch-manipulation sm:w-auto sm:min-h-0`

export const onboardingPlacementPromptClass =
  'break-words font-heading text-base font-bold leading-snug text-brand-dark sm:text-lg'

export const onboardingPlacementContextClass = 'text-sm leading-relaxed text-brand-secondary'

export const onboardingPlacementOptionClass = (selected: boolean) =>
  `flex w-full min-w-0 touch-manipulation items-start rounded-control border px-4 py-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
    selected
      ? 'border-brand-dark bg-brand-accent text-brand-dark'
      : 'border-brand-dark bg-bg-primary text-brand-dark hover:bg-brand-accent/30'
  }`

export const onboardingPlacementOptionTextClass =
  'block min-w-0 flex-1 break-words font-heading text-sm font-bold leading-snug sm:text-base'

export const onboardingPlacementResultCard =
  'min-w-0 rounded-control border border-brand-dark bg-brand-accent/40 px-5 py-6 text-center'
