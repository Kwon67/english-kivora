import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { homePrimaryButton, homeSecondaryButton } from '@/lib/homeStyles'
import AdminBadge from '@/components/ui/SectionBadge'

export const pageRoot = 'admin-section-root relative isolate min-w-0 font-body text-brand-dark'
export const pageInner = 'relative z-10 mx-auto w-full min-w-0 max-w-full space-y-5 pb-6'

export const glassTile =
  'home-frosted-surface home-frosted-surface-soft render-contained relative overflow-hidden rounded-2xl border border-brand-border shadow-sm transition-all duration-300'
export const nestedCardClass =
  'home-frosted-subtle rounded-container border border-brand-border shadow-sm'
export const innerPanelClass =
  'home-frosted-subtle rounded-container border border-brand-border p-4 shadow-sm'
export const softKicker =
  'inline-flex items-center rounded-label border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
export const accentBadge =
  'inline-flex items-center rounded-label border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
export const neutralBadge =
  'inline-flex items-center rounded-label border border-brand-dark bg-bg-primary px-2.5 py-1 font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary'
export const primaryBtn = `${homePrimaryButton} disabled:cursor-not-allowed disabled:opacity-60`
export const ghostBtn = `${homeSecondaryButton} min-h-11 disabled:cursor-not-allowed disabled:opacity-60`
export const dangerBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-error/20 bg-error-soft px-4 py-2 font-body text-sm font-semibold text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60'
export const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-accent text-brand-dark shadow-sm'
export const quickLinkClass =
  'home-frosted-subtle group flex min-h-[52px] items-center justify-between rounded-2xl border border-brand-border px-4 py-3 font-body text-sm font-semibold text-brand-dark transition-colors hover:bg-primary-light hover:text-brand-dark'
export const fieldClass =
  'w-full rounded-lg border border-brand-border bg-bg-primary px-4 py-3 font-body text-sm font-semibold text-brand-dark placeholder:text-brand-secondary focus:outline-none focus:ring-2 focus:ring-primary/20'
export const fieldLabel =
  'font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary'
export const tableHeadRow =
  'home-frosted-subtle border-b border-brand-dark/15 font-heading text-2xs font-bold uppercase tracking-[0.1em] text-brand-secondary'
export const tableBodyRow = 'transition-colors hover:bg-bg-primary'
export const tableDivider = 'divide-y divide-brand-dark/10'
export const sectionDivider = 'border-b border-brand-dark/15'
export const modalShell = `${glassTile} admin-dialog relative my-auto w-full overflow-hidden`

export { AdminBadge }

export function AdminPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <article className={`${glassTile} ${className}`}>{children}</article>
}

export function AdminStatCard({
  label,
  value,
  subtitle,
  icon: Icon,
}: {
  label: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
}) {
  return (
    <article className={`${glassTile} group/stat p-5`}>
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div>
          <AdminBadge label={label} />
          <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{value}</p>
        </div>
        <div className={`${iconClass} `}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {subtitle ? (
        <p className="relative z-10 mt-4 font-body text-sm text-brand-secondary">{subtitle}</p>
      ) : null}
    </article>
  )
}
