import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import AdminBadge from '@/components/ui/SectionBadge'

export const pageRoot = 'admin-section-root landing-light relative overflow-x-hidden font-body text-brand-dark'
export const pageInner = 'relative z-10 space-y-8 pb-8 animate-fade-in'

export const glassTile =
  'home-frosted-surface home-frosted-surface-soft render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark shadow-[6px_6px_0_var(--color-brand-dark)] transition-all duration-300'
export const nestedCardClass =
  'home-frosted-subtle rounded-container border-2 border-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'
export const innerPanelClass =
  'home-frosted-subtle rounded-container border-2 border-brand-dark p-4 shadow-[3px_3px_0_var(--color-brand-dark)]'
export const softKicker =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
export const accentBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
export const neutralBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-2.5 py-1 font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary'
export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-4 py-2 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60'
export const ghostBtn =
  'group inline-flex w-fit items-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-60'
export const dangerBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-60'
export const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'
export const quickLinkClass =
  'home-frosted-subtle group flex min-h-[52px] items-center justify-between rounded-2xl border-2 border-brand-dark px-4 py-3 font-body text-sm font-semibold text-brand-dark shadow-[4px_4px_0_var(--color-brand-dark)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-brand-dark)]'
export const fieldClass =
  'w-full rounded-lg border-2 border-brand-dark bg-bg-primary px-4 py-3 font-body text-sm font-semibold text-brand-dark placeholder:text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/40'
export const fieldLabel =
  'font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary'
export const tableHeadRow =
  'home-frosted-subtle border-b-2 border-brand-dark/15 font-heading text-2xs font-bold uppercase tracking-[0.1em] text-brand-secondary'
export const tableBodyRow = 'transition-colors hover:bg-bg-primary'
export const tableDivider = 'divide-y-2 divide-brand-dark/10'
export const sectionDivider = 'border-b-2 border-brand-dark/15'
export const modalShell = `${glassTile} relative my-auto w-full overflow-hidden`

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
    <article className={`${glassTile} group/stat p-5 hover:-translate-y-1`}>
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div>
          <AdminBadge label={label} />
          <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{value}</p>
        </div>
        <div className={`${iconClass} transition-transform duration-300 group-hover/stat:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {subtitle ? (
        <p className="relative z-10 mt-4 font-body text-sm text-brand-secondary">{subtitle}</p>
      ) : null}
    </article>
  )
}
