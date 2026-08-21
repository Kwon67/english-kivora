import type { ReactNode } from 'react'
import { landingInputClass , landingRadiusLg} from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeSmallPillClass,
} from '@/lib/homeStyles'

export const cardClass = homeCardClass
export const nestedCardClass = homeNestedCardClass
export const softKicker = homeSmallPillClass
export const accentBadge = `inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-2.5 py-1 font-heading text-2xs font-bold uppercase tracking-widest text-brand-dark`
export const neutralBadge = homeSmallPillClass
export const profileField = `w-full ${landingInputClass} px-4 py-3 font-body text-sm text-brand-dark placeholder:text-brand-secondary focus:outline-none`
export const primaryBtn = `${homePrimaryButton} px-4 py-2.5 text-sm`
export const ghostBtn = homeSecondaryButton
export const iconClass = homeIconBox
export const selectedPill = `rounded-[11px] bg-brand-dark font-heading text-xs font-bold uppercase tracking-widest text-white`
export const modeToggleWrap = `flex w-full gap-1 ${landingRadiusLg} border border-brand-dark bg-bg-primary p-1 sm:max-w-sm`
export const sectionScrollMt = 'scroll-mt-3 lg:scroll-mt-[7.5rem]'
export { libraryFolderSpine } from '@/features/profile/lib/libraryPageUi'

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