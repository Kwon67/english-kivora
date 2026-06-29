/**
 * Shared Tailwind class strings — use theme tokens only.
 * Hex allowed only in globals.css / brandColors.ts.
 */

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-5 py-3 font-montserrat text-sm font-bold text-on-primary shadow-[0_10px_22px_rgba(28, 25, 21,0.22)] transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60'

export const primaryBtnLg =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-bold text-on-primary shadow-[0_16px_34px_rgba(28, 25, 21,0.22)] transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50'

export const softBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border border-border-muted/20 bg-primary-light px-4 py-2.5 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-hero-lime dark:border-border-accent/20 dark:bg-primary/8 dark:text-primary dark:hover:bg-primary/16'

export const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'

export const selectedPill = 'bg-primary text-on-primary shadow-sm'

export const successAlert =
  'border-primary/20 bg-primary-light text-primary dark:border-primary/20 dark:bg-primary/10'

/** Inline auth feedback (login, MFA) — accent feedback using design tokens */
export const authErrorAlert =
  'border-primary/20 bg-primary-light text-primary dark:border-primary/25 dark:bg-primary/12 dark:text-primary'

export const navActiveLight = 'text-primary'
export const navActiveMobile = 'bg-primary-light text-primary dark:bg-primary/10'

export const authInput =
  'Input self-stretch py-3 bg-surface/50 rounded-xl border border-dashed border-border-muted/24 inline-flex justify-center items-start overflow-hidden w-full transition-all focus-within:border-solid focus-within:border-primary focus-within:shadow-[0_0_14px_rgba(28, 25, 21,0.12)] focus-within:bg-card/90 dark:bg-primary/8 dark:border-border-accent/24 dark:focus-within:border-solid dark:focus-within:border-primary dark:focus-within:bg-surface-container-lowest/90 dark:focus-within:shadow-[0_0_14px_rgba(213, 224, 107,0.12)]'

export const authSubmitBtn =
  'inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-primary py-3.5 font-montserrat text-lg font-bold leading-7 text-on-primary border border-dashed border-primary-container/50 shadow-[0px_8px_15px_0px_rgba(28, 25, 21,0.15)] transition-colors hover:bg-primary-dark dark:border-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50'

export const linkPrimary = 'font-semibold text-primary hover:underline'

export const textPrimaryHover = 'hover:text-primary'

/** Labels on solid primary hero cards (landing mockup, home dashboard tile) */
export const onPrimaryCardKicker =
  '!text-hero-lime dark:!text-primary'

/** Headings and values on solid primary hero cards — ! beats global h1–h6 color in globals.css */
export const onPrimaryCardTitle =
  '!text-on-primary dark:!text-primary'

/** Muted labels on solid primary hero cards */
export const onPrimaryCardMuted =
  '!text-hero-lime/80 dark:!text-primary/80'

/** Lime panel on dark hero — heatmap / study load */
export const heroLimePanel =
  'rounded-2xl border border-on-primary/12 bg-hero-lime p-3 text-primary dark:bg-primary dark:text-on-primary'

export const heroGridCellActive = 'bg-primary dark:bg-on-primary'
export const heroGridCellInactive = 'bg-primary/14 dark:bg-on-primary/22'