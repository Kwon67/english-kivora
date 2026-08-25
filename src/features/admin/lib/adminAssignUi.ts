import AdminBadge from '@/components/ui/SectionBadge'
import { landingRadiusLg } from '@/lib/landingStyles'
import { homeNestedCardClass, homeSmallPillClass } from '@/lib/homeStyles'
import {
  adminDashboardField,
  adminFrostedSubtle,
  adminDashboardHero,
  adminDashboardIconBox,
  adminDashboardPanel,
  adminDashboardPrimaryBtn,
  adminDashboardSectionHeader,
  adminDashboardSectionTitle,
  adminDashboardShell,
  adminDashboardSoftBtn,
  adminDashboardStatusPill,
  adminDashboardTelemetryBand,
  adminDashboardTelemetryCell,
  adminDashboardTile,
} from '@/features/admin/lib/adminDashboardUi'

export const adminAssignShell = `${adminDashboardShell} admin-dispatch`

export const adminAssignHero = adminDashboardHero
export const adminAssignPanel = adminDashboardPanel
export const adminAssignTile = adminDashboardTile
export const adminAssignPill = homeSmallPillClass
export const adminAssignSoftBtn = adminDashboardSoftBtn
export const adminAssignPrimaryBtn = adminDashboardPrimaryBtn
export const adminAssignField = adminDashboardField
export const adminAssignIconBox = adminDashboardIconBox
export const adminAssignSectionTitle = adminDashboardSectionTitle
export const adminAssignSectionHeader = adminDashboardSectionHeader
export const adminAssignTelemetryBand = adminDashboardTelemetryBand
export const adminAssignTelemetryCell = adminDashboardTelemetryCell
export const adminAssignStatusPill = adminDashboardStatusPill

export const adminAssignNested = `${homeNestedCardClass} ${adminFrostedSubtle}`
export const adminAssignInnerPanel = `${landingRadiusLg} ${adminFrostedSubtle} border border-brand-dark/25 p-4 sm:p-5`
export const adminAssignTicket = 'admin-dispatch-ticket'

export const adminAssignKicker = `inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark`

export const adminAssignAccentPill = `inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-2.5 py-1 font-heading text-2xs font-bold uppercase tracking-widest text-brand-dark`

export const adminAssignFieldLabel = 'font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary'

export const adminAssignSectionDivider = 'border-b border-brand-dark/15'

export const adminAssignModeCardActive = `min-h-24 rounded-control border border-brand-dark bg-brand-accent p-3 transition-colors`

export const adminAssignModeCardIdle = `min-h-24 rounded-control border border-brand-dark/30 ${adminFrostedSubtle} p-3 transition-colors hover:border-brand-dark/50 hover:bg-bg-primary`

export const adminAssignWeekdayActive = `flex h-10 items-center justify-center rounded-control border border-brand-dark bg-brand-accent font-heading text-xs font-semibold text-brand-dark transition-colors`

export const adminAssignWeekdayIdle = `flex h-10 items-center justify-center rounded-control border border-brand-dark/30 ${adminFrostedSubtle} font-heading text-xs font-semibold text-brand-secondary transition-colors hover:border-brand-dark/50 hover:bg-bg-primary`

export const adminAssignAlertError = `rounded-container border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-4 py-3 font-body text-sm font-bold text-[var(--color-error)]`

export const adminAssignAlertSuccess = `flex items-center gap-2 rounded-container border border-brand-dark bg-brand-accent/30 px-4 py-3 font-body text-sm font-bold text-brand-dark`

export const adminAssignDangerBtn = `inline-flex items-center justify-center gap-2 rounded-control border border-brand-dark bg-bg-card px-4 py-2 font-body text-sm font-semibold text-[var(--color-error)] transition hover:border-red-500/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60`

/** Flat aliases — keeps legacy import names working inside assign tooling */
export const fieldClass = `w-full rounded-container border border-brand-dark bg-bg-primary px-4 py-3 font-body text-sm font-semibold text-brand-dark placeholder:text-brand-secondary outline-none transition focus:shadow-[0_0_0_3px_rgba(213,224,107,0.45)]`
export const fieldLabel = adminAssignFieldLabel
export const ghostBtn = adminAssignSoftBtn
export const primaryBtn = adminAssignPrimaryBtn
export const nestedCardClass = adminAssignNested
export const innerPanelClass = adminAssignInnerPanel
export const softKicker = adminAssignKicker
export const accentBadge = adminAssignAccentPill
export const neutralBadge = `${adminAssignStatusPill} bg-bg-primary text-brand-secondary`
export const iconClass = adminAssignIconBox
export const sectionDivider = adminAssignSectionDivider
export const dangerBtn = adminAssignDangerBtn
export const glassTile = adminAssignPanel

export { AdminBadge }
