import { landingRadius } from '@/lib/landingStyles'
import {
  adminDashboardField,
  adminDashboardHero,
  adminDashboardMemberAvatar,
  adminDashboardPanel,
  adminDashboardPill,
  adminDashboardPrimaryBtn,
  adminDashboardSectionHeader,
  adminDashboardSectionTitle,
  adminDashboardShell,
  adminDashboardSoftBtn,
  adminDashboardStatusPill,
  adminDashboardMetricStrip,
  adminDashboardTelemetryBand,
  adminDashboardTelemetryCell,
  adminDashboardTile,
} from '@/features/admin/lib/adminDashboardUi'

export const adminMembersShell = `${adminDashboardShell} admin-roster`

export const adminMembersHero = adminDashboardHero
export const adminMembersPanel = adminDashboardPanel
export const adminMembersTile = adminDashboardTile
export const adminMembersPill = adminDashboardPill
export const adminMembersSoftBtn = adminDashboardSoftBtn
export const adminMembersPrimaryBtn = adminDashboardPrimaryBtn
export const adminMembersField = adminDashboardField
export const adminMembersSectionTitle = adminDashboardSectionTitle
export const adminMembersSectionHeader = adminDashboardSectionHeader
export const adminMembersTelemetryBand = adminDashboardTelemetryBand
export const adminMembersTelemetryCell = adminDashboardTelemetryCell
export const adminMembersMemberAvatar = adminDashboardMemberAvatar
export const adminMembersStatusPill = adminDashboardStatusPill

export const adminMembersRosterStrip = adminDashboardMetricStrip

export const adminMembersSpotlightCard = `${landingRadius} border border-brand-dark bg-bg-primary px-3 py-3 sm:px-4 sm:py-3.5`

export const adminMembersFilterPill = `rounded-full border border-brand-dark px-3 py-1.5 font-heading text-[10px] font-bold uppercase tracking-widest transition`

export const adminMembersFilterPillActive = 'bg-brand-dark text-white'

export const adminMembersFilterPillIdle = 'bg-bg-primary text-brand-secondary hover:bg-bg-card hover:text-brand-dark'

export const adminMembersRowAction = `inline-flex items-center justify-center rounded-[13px] border border-brand-dark bg-bg-card p-2 text-brand-secondary transition hover:bg-brand-dark hover:text-white`

export const adminMembersDangerAction = `inline-flex items-center gap-1.5 rounded-[13px] border border-brand-dark bg-bg-card px-2.5 py-1.5 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-700 disabled:opacity-60`