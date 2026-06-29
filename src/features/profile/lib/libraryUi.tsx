import type { ReactNode } from 'react'

export const cardClass =
  'relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)]'
export const nestedCardClass =
  'rounded-xl border-2 border-brand-dark bg-bg-primary shadow-[3px_3px_0_var(--color-brand-dark)]'
export const softKicker =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
export const accentBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark'
export const neutralBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary'
export const profileField =
  'w-full rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-3 font-body text-sm text-brand-dark placeholder:text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent/40'
export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-4 py-2 font-body text-xs font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60'
export const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2 font-body text-xs font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-60'
export const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'
export const selectedPill =
  'border-2 border-brand-dark bg-brand-dark font-heading text-xs font-bold uppercase tracking-widest text-white shadow-[2px_2px_0_var(--color-brand-accent)]'
export const modeToggleWrap =
  'flex w-full gap-1.5 rounded-xl border-2 border-brand-dark bg-bg-primary p-1 sm:max-w-sm'
export const sectionScrollMt = 'scroll-mt-3 lg:scroll-mt-[7.5rem]'

export { default as LibraryBadge } from '@/components/ui/SectionBadge'

export function LibraryPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <article className={`${cardClass} ${className}`}>{children}</article>
}
