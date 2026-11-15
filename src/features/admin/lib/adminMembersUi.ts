import { landingRadiusLg } from '@/lib/landingStyles'
import {
  adminDashboardField,
  adminFrostedSubtle,
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
  adminDashboardTelemetryBand,
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
export const adminMembersMemberAvatar = adminDashboardMemberAvatar
export const adminMembersStatusPill = adminDashboardStatusPill

export const adminMembersSpotlightCard = `${landingRadiusLg} ${adminFrostedSubtle} border border-brand-dark px-3 py-3 sm:px-4 sm:py-3.5`

export const adminMembersFilterPill = `min-h-11 rounded-control border border-brand-dark px-3 py-1.5 font-heading text-2xs font-bold uppercase tracking-widest transition`

export const adminMembersFilterPillActive = 'bg-primary-light text-brand-dark'

export const adminMembersFilterPillIdle = `${adminFrostedSubtle} text-brand-secondary hover:bg-bg-card hover:text-brand-dark`

export const adminMembersRowAction = `inline-flex items-center justify-center min-h-11 min-w-11 rounded-control border border-brand-dark bg-bg-card p-2 text-brand-secondary transition hover:bg-brand-dark hover:text-white`

export const adminMembersDangerAction = `inline-flex min-h-11 items-center gap-1.5 rounded-control border border-brand-dark bg-bg-card px-2.5 py-1.5 font-heading text-2xs font-bold uppercase tracking-widest text-brand-dark transition hover:border-error/30 hover:bg-error-soft hover:text-error disabled:opacity-60`
