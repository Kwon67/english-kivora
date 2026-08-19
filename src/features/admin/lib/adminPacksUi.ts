import AdminBadge from '@/components/ui/SectionBadge'
import { landingRadiusLg } from '@/lib/landingStyles'
import { homeNestedCardClass, homeSmallPillClass } from '@/lib/homeStyles'
import {
  adminDashboardField,
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

export const adminPacksShell = `${adminDashboardShell} admin-content-vault`

export const adminPacksHero = adminDashboardHero
export const adminPacksPanel = adminDashboardPanel
export const adminPacksTile = adminDashboardTile
export const adminPacksPill = homeSmallPillClass
export const adminPacksSoftBtn = adminDashboardSoftBtn
export const adminPacksPrimaryBtn = adminDashboardPrimaryBtn
export const adminPacksField = adminDashboardField
export const adminPacksIconBox = adminDashboardIconBox
export const adminPacksSectionTitle = adminDashboardSectionTitle
export const adminPacksSectionHeader = adminDashboardSectionHeader
export const adminPacksTelemetryBand = adminDashboardTelemetryBand
export const adminPacksTelemetryCell = adminDashboardTelemetryCell
export const adminPacksStatusPill = adminDashboardStatusPill

export const adminPacksNested = homeNestedCardClass
export const adminPacksInnerPanel = `${landingRadiusLg} border border-brand-dark/25 bg-bg-primary p-4 sm:p-5`
export const adminPacksFolderSpine = 'admin-pack-spine'
export const adminPacksModalShell = `${adminPacksPanel} relative my-auto w-full overflow-hidden`

export const adminPacksKicker = `inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark`

export const adminPacksAccentPill = `inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark`

export const adminPacksFieldLabel = 'font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary'

export const adminPacksSectionDivider = 'border-b border-brand-dark/15'

export const adminPacksImportDropzone = `flex w-full items-center justify-center gap-3 rounded-[20px] border border-dashed border-brand-dark bg-bg-card px-5 py-6 font-body text-sm font-semibold text-brand-secondary transition hover:border-brand-accent hover:bg-bg-primary hover:text-brand-dark`

export const adminPacksChoiceCard = `rounded-[20px] border px-4 py-4 text-left transition-all`

export const adminPacksChoiceCardActive = 'border-brand-dark bg-brand-accent text-brand-dark'

export const adminPacksChoiceCardIdle = 'border-brand-dark/30 bg-bg-card text-brand-secondary hover:border-brand-dark/50'

/** Flat aliases — keeps legacy import names working inside packs tooling */
export const fieldClass = `w-full rounded-[20px] border border-brand-dark bg-bg-primary px-4 py-3 font-body text-sm font-semibold text-brand-dark placeholder:text-brand-secondary outline-none transition focus:shadow-[0_0_0_3px_rgba(213,224,107,0.45)]`
export const fieldLabel = adminPacksFieldLabel
export const ghostBtn = adminPacksSoftBtn
export const primaryBtn = adminPacksPrimaryBtn
export const nestedCardClass = adminPacksNested
export const innerPanelClass = adminPacksInnerPanel
export const softKicker = adminPacksKicker
export const accentBadge = adminPacksAccentPill
export const neutralBadge = `${adminPacksStatusPill} bg-bg-primary text-brand-secondary`
export const iconClass = adminPacksIconBox
export const sectionDivider = adminPacksSectionDivider
export const modalShell = adminPacksModalShell
export const glassTile = adminPacksPanel

export { AdminBadge }