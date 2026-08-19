/**
 * Shared Tailwind class strings — use theme tokens only.
 * Hex allowed only in globals.css / brandColors.ts.
 */

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-5 py-3 font-montserrat text-sm font-bold text-on-primary shadow-[0_10px_22px_rgba(28, 25, 21,0.22)] transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60'

export const primaryBtnLg =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-bold text-on-primary shadow-[0_16px_34px_rgba(28, 25, 21,0.22)] transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50'

export const softBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border border-border-muted/20 bg-primary-light px-4 py-2.5 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-hero-lime'

export const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary'

export const selectedPill = 'bg-primary text-on-primary shadow-sm'

export const successAlert =
  'border-primary/20 bg-primary-light text-primary'

/** Inline auth feedback (login, MFA) — accent feedback using design tokens */
export const authErrorAlert =
  'border-primary/20 bg-primary-light text-primary'

export const navActiveLight = 'text-primary'
export const navActiveMobile = 'bg-primary-light text-primary'

export const authInput =
  'Input self-stretch py-3 bg-surface/50 rounded-[20px] border border-dashed border-border-muted/24 inline-flex justify-center items-start overflow-hidden w-full transition-all focus-within:border-solid focus-within:border-primary focus-within:shadow-[0_0_14px_rgba(28, 25, 21,0.12)] focus-within:bg-card/90'

export const authSubmitBtn =
  'inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-primary py-3.5 font-montserrat text-lg font-bold leading-7 text-on-primary border border-dashed border-primary-container/50 shadow-[0px_8px_15px_0px_rgba(28, 25, 21,0.15)] transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50'

export const linkPrimary = 'font-semibold text-primary hover:underline'

export const textPrimaryHover = 'hover:text-primary'

/** Labels on solid primary hero cards (landing mockup, home dashboard tile) */
export const onPrimaryCardKicker =
  '!text-hero-lime'

/** Headings and values on solid primary hero cards — ! beats global h1–h6 color in globals.css */
export const onPrimaryCardTitle =
  '!text-on-primary'

/** Muted labels on solid primary hero cards */
export const onPrimaryCardMuted =
  '!text-hero-lime/80'

/** Lime panel on dark hero — heatmap / study load */
export const heroLimePanel =
  'rounded-2xl border border-on-primary/12 bg-hero-lime p-3 text-primary'

export const heroGridCellActive = 'bg-primary'
export const heroGridCellInactive = 'bg-primary/14'