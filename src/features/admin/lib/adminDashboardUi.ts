import { landingHeroCardClass , landingRadiusLg} from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeIconBoxLg,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeSmallPillClass,
  homeSectionTitleClass,
} from '@/lib/homeStyles'

export const adminDashboardShell = 'relative min-w-0'

/** Hero — offset shadow only */
export const adminDashboardHero = `${landingHeroCardClass} admin-hero-shadow relative overflow-hidden `

export const adminDashboardCard = homeCardClass
export const adminDashboardTile = `${homeNestedCardClass} p-4 sm:p-6`
export const adminDashboardPill = homeSmallPillClass
export const adminDashboardSoftBtn = homeSecondaryButton
export const adminDashboardPrimaryBtn = `${homePrimaryButton} px-5 py-2.5 text-sm font-bold sm:text-base`
export const adminDashboardIconBox = homeIconBox
export const adminDashboardIconBoxLg = homeIconBoxLg
export const adminDashboardSectionTitle = homeSectionTitleClass
export const adminDashboardPanel = `${adminDashboardCard} p-5 sm:p-7`

export const adminDashboardMetricStrip = `flex w-full min-w-0 flex-col gap-2.5 overflow-hidden md:flex-row md:items-center md:justify-between ${landingRadiusLg} border border-brand-dark bg-brand-accent/40 px-4 py-3 md:gap-4`

export const adminDashboardMetricStripTrack =
  'flex w-full min-w-0 items-center gap-2.5 md:w-36 md:shrink-0 md:flex-none'

export const adminDashboardMetricStripBar =
  'h-2 min-w-0 flex-1 overflow-hidden rounded-full border border-brand-dark bg-bg-card'

export const adminDashboardMetricStripPct =
  'w-9 shrink-0 text-right font-heading text-sm font-bold tabular-nums text-brand-dark'

export const adminDashboardTelemetryBand = `grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 ${landingRadiusLg} border border-brand-dark bg-bg-card p-2 sm:gap-3 sm:p-3`

export const adminDashboardTelemetryCell = `flex min-w-0 flex-col gap-0.5 ${landingRadiusLg} border border-brand-dark/25 bg-bg-primary px-3 py-2.5 sm:px-4 sm:py-3`

export const adminDashboardSectionHeader = `flex flex-col gap-4 border-b border-brand-dark/15 pb-5 sm:flex-row sm:items-center sm:justify-between`

export const adminDashboardActionTile = `group flex min-h-[56px] items-center justify-between ${landingRadiusLg} border border-brand-dark bg-bg-card px-4 py-3.5 font-heading text-sm font-bold text-brand-dark transition hover:bg-brand-dark hover:text-white`

export const adminDashboardField = `w-full rounded-container border border-brand-dark bg-bg-primary py-2.5 pl-11 pr-11 font-body text-sm font-semibold text-brand-dark outline-none transition focus:shadow-[0_0_0_3px_rgba(213,224,107,0.45)] [appearance:none] [-webkit-appearance:none]`

export const adminDashboardSpotlightCard = `${landingRadiusLg} border border-brand-dark bg-bg-primary px-3 py-3 sm:px-4 sm:py-3.5`

export const adminDashboardMemberAvatar = `relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-control border border-brand-dark bg-brand-accent font-heading text-sm font-bold text-brand-dark`

export const adminDashboardStatusPill = `inline-flex items-center gap-1.5 rounded-full border border-brand-dark px-2.5 py-1 font-heading text-2xs font-bold uppercase tracking-widest`

/** Admin chrome — flat sidebar aligned with ops deck */
export const adminSidebarShell =
  'flex w-full shrink-0 flex-col overflow-hidden rounded-container border border-brand-dark bg-bg-card p-3 sm:p-4 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:max-h-[calc(100svh-2.5rem)] lg:w-[15.5rem] lg:overflow-y-auto'

export const adminSidebarHeader = 'border-b border-brand-dark/15 pb-4'

export const adminSidebarProfile = `rounded-container border border-brand-dark/25 bg-bg-primary px-3 py-3`

export const adminSidebarAvatar = `box-border flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-control border border-brand-dark bg-brand-accent font-heading text-xs font-bold text-brand-dark`

export const adminSidebarBadge = `inline-flex items-center gap-1.5 rounded-full border border-brand-dark bg-brand-accent px-2.5 py-1 font-heading text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark`

// Link de navegação é CONTROLE: com 38px de altura, 20px de raio o transformava em cápsula.
export const adminSidebarNavLink =
  'group flex items-center gap-2 rounded-control border border-transparent px-3 py-2 font-heading text-sm font-bold text-brand-secondary transition hover:border-brand-dark/30 hover:bg-bg-primary hover:text-brand-dark'

export const adminSidebarNavLinkActive =
  'border-brand-dark bg-brand-dark text-white hover:border-brand-dark hover:bg-brand-dark hover:text-white'

export const adminSidebarFooter = 'mt-3 border-t border-brand-dark/15 pt-3'

export const adminSidebarGeneratorBtn = `${homeSecondaryButton} w-full min-h-10 justify-start px-4 py-2.5 text-sm`