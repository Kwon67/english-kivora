import { landingHeroCardClass , landingRadiusLg} from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'
import {
  adminDashboardMetricStrip,
  adminDashboardMetricStripBar,
  adminDashboardMetricStripPct,
  adminDashboardMetricStripTrack,
} from '@/features/admin/lib/adminDashboardUi'

export const reviewShell = `${homeShellClass} review-retention-lab min-h-[calc(100vh-5rem)] min-h-[calc(100svh-5rem)] pb-20 sm:pb-10`

export const reviewHero = `${landingHeroCardClass} review-hero-shadow relative overflow-hidden `

export const reviewPanel = `${homeCardClass} p-4 sm:p-5`
export const reviewPracticePanel = `${homeCardClass} relative overflow-hidden p-3 sm:p-5 lg:p-6`

export const reviewTile = homeNestedCardClass
export const reviewPill = homeSmallPillClass
export const reviewSoftBtn = homeSecondaryButton
export const reviewPrimaryBtn = `${homePrimaryButton} px-5 py-2.5 text-sm font-bold sm:text-base`
export const reviewIconBox = homeIconBox

export const reviewRetentionStrip = adminDashboardMetricStrip
export const reviewRetentionStripTrack = adminDashboardMetricStripTrack
export const reviewRetentionStripBar = adminDashboardMetricStripBar
export const reviewRetentionStripPct = adminDashboardMetricStripPct

export const reviewTelemetryBand = `grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-6 ${landingRadiusLg} border border-brand-dark bg-bg-card p-2 sm:gap-3 sm:p-3`

export const reviewTelemetryCell = `flex min-w-0 flex-col gap-0.5 ${landingRadiusLg} border border-brand-dark/25 bg-bg-primary px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3`

export const reviewBreadcrumbClass = 'mb-2 hidden sm:block'

export const reviewMobileActionRow = 'flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'

export const reviewMobileSwipeHint = `lg:hidden ${landingRadiusLg} border border-brand-dark/25 bg-bg-primary px-3 py-2 text-center font-body text-[11px] font-semibold leading-snug text-brand-secondary`

export const reviewPhraseTitle =
  'mx-auto max-w-[20ch] text-balance font-heading text-2xl font-bold leading-[1.15] text-brand-dark sm:max-w-[16ch] sm:text-3xl md:text-5xl'

export const reviewProgressBar = 'h-2 w-full overflow-hidden rounded-full border border-brand-dark bg-bg-card'

export const reviewProgressFill = 'h-full rounded-full bg-brand-dark transition-all duration-300 ease-out'

export const reviewKicker = reviewPill

export const reviewSessionBanner = `${landingRadiusLg} border border-brand-dark bg-brand-accent/40 px-4 py-3`

export const reviewCloseBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-brand-dark bg-bg-card text-brand-dark transition-colors hover:bg-brand-dark hover:text-white'

export const reviewStatRow = `flex items-center justify-between rounded-[20px] border border-brand-dark/25 bg-bg-primary px-4 py-3`

export const reviewStatRowAccent = `flex items-center justify-between rounded-[20px] border border-brand-dark bg-brand-accent/40 px-4 py-3`

export const reviewKbd = 'rounded-[11px] border border-brand-dark bg-bg-primary px-2 py-1 font-heading text-xs font-bold text-brand-dark'

export const reviewMeaningCard = `mx-auto w-full max-w-xl select-text rounded-[20px] border border-brand-dark bg-bg-primary px-4 py-3 text-left sm:px-6 sm:py-4`

export const reviewQualityBtnBase =
  'flex min-h-[4rem] flex-col items-center justify-center gap-0.5 rounded-[13px] border px-1 py-2 text-center font-body transition-all active:scale-[0.97] disabled:opacity-60 sm:min-h-24 sm:gap-1 sm:px-3 sm:py-3'

/**
 * Weight rises with the grade: failing is a quiet outline, the ease-neutral "Bom" is the filled
 * default your thumb lands on, and "Fácil" is the accent. Keyed to the REVIEW_GRADE values.
 */
export function getReviewQualityBtnClass(quality: number) {
  if (quality === 0) {
    return `${reviewQualityBtnBase} border-brand-dark/40 bg-bg-card text-brand-secondary hover:border-brand-dark hover:text-brand-dark active:bg-bg-primary`
  }
  if (quality === 3) {
    return `${reviewQualityBtnBase} border-brand-dark bg-bg-card text-brand-dark hover:bg-bg-primary active:bg-bg-primary`
  }
  if (quality === 5) {
    return `${reviewQualityBtnBase} border-brand-dark bg-brand-accent text-brand-dark hover:opacity-90 active:brightness-95`
  }
  return `${reviewQualityBtnBase} border-brand-dark bg-brand-dark text-white hover:opacity-90 active:brightness-95`
}

export const reviewInnerMax = 'relative z-10 mx-auto w-full min-w-0 max-w-5xl animate-fade-in'