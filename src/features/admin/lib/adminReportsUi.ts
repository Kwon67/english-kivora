import { homeNestedCardClass, homeSmallPillClass } from '@/lib/homeStyles'
import {
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

export const adminReportsShell = `${adminDashboardShell} admin-intel-lab`

export const adminReportsHero = adminDashboardHero
export const adminReportsPanel = adminDashboardPanel
export const adminReportsTile = adminDashboardTile
export const adminReportsPill = homeSmallPillClass
export const adminReportsSoftBtn = adminDashboardSoftBtn
export const adminReportsPrimaryBtn = adminDashboardPrimaryBtn
export const adminReportsIconBox = adminDashboardIconBox
export const adminReportsSectionTitle = adminDashboardSectionTitle
export const adminReportsSectionHeader = adminDashboardSectionHeader
export const adminReportsTelemetryBand = adminDashboardTelemetryBand
export const adminReportsTelemetryCell = adminDashboardTelemetryCell
export const adminReportsStatusPill = adminDashboardStatusPill

export const adminReportsNested = homeNestedCardClass
export const adminReportsInsightCard = 'admin-intel-insight'

export const adminReportsAccentPill = `inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-2.5 py-1 font-heading text-2xs font-bold uppercase tracking-widest text-brand-dark`

export const adminReportsNeutralPill = `${adminReportsStatusPill} bg-bg-primary text-brand-secondary`

export const adminReportsSectionDivider = 'border-b border-brand-dark/15'

export const adminReportsTableHead = 'border-b border-brand-dark/15 bg-bg-primary font-heading text-2xs font-bold uppercase tracking-[0.1em] text-brand-secondary'

export const adminReportsTableRow = 'admin-intel-row transition-colors hover:bg-bg-primary'

export const adminReportsTableDivider = 'divide-y divide-brand-dark/10'

export const adminReportsRankBadge = `flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-brand-dark bg-bg-primary font-heading text-sm font-bold text-brand-dark`

export const adminReportsRankBadgeTop = 'border-brand-dark bg-brand-accent text-brand-dark'

export const adminReportsLeaderboardRow = `flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-bg-primary sm:flex-row sm:items-center sm:justify-between sm:px-6`

/** Flat aliases */
export const accentBadge = adminReportsAccentPill
export const neutralBadge = adminReportsNeutralPill
export const nestedCardClass = adminReportsNested
export const iconClass = adminReportsIconBox
export const glassTile = adminReportsPanel
export const sectionDivider = adminReportsSectionDivider
export const tableHeadRow = adminReportsTableHead
export const tableBodyRow = adminReportsTableRow
export const tableDivider = adminReportsTableDivider
export const primaryBtn = adminReportsPrimaryBtn