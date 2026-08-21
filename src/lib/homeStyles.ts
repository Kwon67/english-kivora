import {
  landingCtaCardShadow,
  landingHeroCardClass,
  landingRadius,
  landingRadiusLg,
  landingSurfaceClass,
} from '@/lib/landingStyles'

/** Flat card — border + radius, no offset shadow */
export const homeCardClass = `${landingSurfaceClass} bg-bg-card`

/** Hero card — only surface on /home that uses offset shadow */
export const homeHeroCardClass = `${landingHeroCardClass} ${landingCtaCardShadow}`

/** Desktop footer card — offset shadow on the closing surface */
export const homeFooterCardClass = `${homeCardClass} ${landingCtaCardShadow}`

export const homeNestedCardClass = `${landingRadiusLg} border border-brand-dark bg-bg-card`

/** Shell minus the vertical bleed, so the two variants below can choose their own. */
const homeShellBase =
  'home-mobile-optimized landing-light relative -mx-4 min-h-0 overflow-x-hidden bg-bg-primary px-4 py-6 pb-4 font-body text-brand-dark sm:-mx-6 sm:min-h-[calc(100vh-5rem)] sm:px-6 sm:py-8 sm:pb-10'

/** Full bleed: cancels <main>'s padding on all four sides. Use when the shell is main's only child. */
export const homeShellClass = `${homeShellBase} -my-6 sm:-my-8`

/**
 * Same bleed, except at the top. For pages that render something above the shell — a breadcrumb,
 * typically: the upward pull of `-my-*` drags the shell's tinted background over that content and
 * clips it. A trailing `mt-0` cannot fix it, since `my-*` and `mt-*` have equal specificity and
 * Tailwind emits `my-*` last, so the negative margin wins regardless of class order.
 * `shell-bleed-bottom` is a plain rule in globals.css — see the comment there for why.
 */
export const homeShellBelowContentClass = `${homeShellBase} shell-bleed-bottom`

export const homePrimaryButton =
  'inline-flex items-center justify-center gap-2 rounded-control border border-brand-dark bg-brand-accent px-6 py-3 font-heading text-lg font-bold text-brand-dark transition-all hover:opacity-90'

export const homeSecondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-control border border-brand-dark bg-bg-card px-5 py-2.5 font-heading text-sm font-bold text-brand-dark transition-all hover:bg-brand-dark hover:text-white'

export const homeCardButton =
  'inline-flex items-center justify-center gap-2 rounded-control border border-brand-dark bg-bg-card px-4 py-2 font-heading text-sm font-bold text-brand-dark transition-all hover:bg-brand-dark hover:text-white'

/**
 * Square icon-only button. Exists because `homeCardButton` carries `px-4 py-2`, sized for a
 * text label: forcing it into a 36px square left an 8px content box, and the glyph — which
 * flex is free to shrink — collapsed to 6px wide while staying 18px tall. Icon buttons get
 * their size from the box, so this one has no padding at all.
 */
export const homeIconButton =
  'inline-flex shrink-0 items-center justify-center rounded-control border border-brand-dark bg-bg-card p-0 text-brand-dark transition-all hover:bg-brand-dark hover:text-white'

/** Lime icon tile — fixed size, padding, and clip so glyphs never bleed past the border */
// Caixa de ÍCONE (32–44px) e PÍLULA são controles: ficam no raio de 13px.
export const homeIconBoxBase = `box-border flex shrink-0 items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-brand-accent text-brand-dark`

export const homeIconBox = `h-10 w-10 p-2 ${homeIconBoxBase}`
export const homeIconBoxSm = `h-9 w-9 p-1.5 ${homeIconBoxBase}`
export const homeIconBoxLg = `h-11 w-11 p-2.5 ${homeIconBoxBase}`

/** The project's icon scale — two steps, and every glyph should use one of them.
 *  Named for the tiles they were introduced for, but they are the general scale:
 *  Sm (14px) for icons sitting inside a line of text, the other (16px) for icons
 *  that stand next to a label in a control.
 *  `shrink-0` on both: these live in flex rows, and an icon without it is the first
 *  thing the browser squashes when space runs short — that is how the Explore card's
 *  chevron ended up 6px wide inside a 40px button. */
export const homeIconGlyphSm = 'h-3.5 w-3.5 shrink-0'
export const homeIconGlyph = 'h-4 w-4 shrink-0'

export const homePillClass =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'

export const homeSmallPillClass =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-2.5 py-1 font-heading text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark'

/** Pill for text that can wrap. `rounded-full` resolves to half the box height, so a two- or
 *  three-line pill balloons to a ~28px radius and stops matching the 13px used everywhere else.
 *  Use this whenever the label is content-driven and its length is not known up front. */
export const homeWrapPillClass = `${landingRadius} inline-flex items-center border border-brand-dark bg-bg-primary px-2.5 py-1 text-left font-heading text-[0.65rem] font-bold uppercase leading-relaxed tracking-widest text-brand-dark`

/** Lighter lime — pack already in routine */
export const homeSubscribedPillClass =
  'inline-flex items-center justify-center gap-2 rounded-control border border-brand-dark bg-brand-accent-soft px-4 py-2 font-heading text-xs font-semibold text-brand-dark sm:text-sm'

export const homeMetricCardClass = `min-w-[280px] shrink-0 snap-start ${homeCardClass} p-6 md:min-w-0`

export const homeSectionTitleClass = 'font-section text-2xl font-semibold leading-[1.1] text-brand-dark sm:text-3xl'

export const homeAssignmentCardClass =
  'home-assignment-card flex flex-col gap-4 rounded-container border border-brand-dark bg-bg-card p-4 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between'
