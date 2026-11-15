import {
  landingCtaCardShadow,
  landingHeroCardClass,
  landingRadiusLg,
  landingSurfaceClass,
} from '@/lib/landingStyles'

/**
 * Translucent material shared by the app-shell surfaces (offline, error, loading fallbacks).
 * Same string the feature libs repeat; exported here so the shell pages have one source.
 */
export const homeFrostedSurface = 'home-frosted-surface home-frosted-surface-soft'

/** Material mais leve, para painel ANINHADO dentro de uma superfície frosted. */
export const homeFrostedSubtle = 'home-frosted-subtle'

/** Material de diálogo: frosted preservando a sombra offset que dá peso ao modal. */
export const homeFrostedModal = 'home-frosted-modal'

/** Flat card — border + radius, no offset shadow */
export const homeCardClass = `${landingSurfaceClass} bg-bg-card`

/** Hero card — only surface on /home that uses offset shadow */
export const homeHeroCardClass = `${landingHeroCardClass} ${landingCtaCardShadow}`

/** Desktop footer card — offset shadow on the closing surface */
export const homeFooterCardClass = `${homeCardClass} ${landingCtaCardShadow}`

export const homeNestedCardClass = `${landingRadiusLg} border border-brand-border bg-bg-card`

export const homeShellClass =
  'home-mobile-optimized landing-light relative min-w-0 bg-bg-primary pb-4 font-body text-brand-dark sm:pb-10'

// Both variants now share the page gutters without negative margin compensation.
export const homeShellBelowContentClass = homeShellClass

export const homePrimaryButton = 'premium-primary'

export const homeSecondaryButton = 'workspace-button workspace-button-outline'

export const homeCardButton = 'workspace-button workspace-button-quiet'

/**
 * Square icon-only button. Exists because `homeCardButton` carries `px-4 py-2`, sized for a
 * text label: forcing it into a 36px square left an 8px content box, and the glyph — which
 * flex is free to shrink — collapsed to 6px wide while staying 18px tall. Icon buttons get
 * their size from the box, so this one has no padding at all.
 */
export const homeIconButton =
  'inline-flex shrink-0 items-center justify-center rounded-control border border-brand-border bg-bg-card p-0 text-brand-dark transition-colors hover:bg-primary-light hover:text-primary-dark'

export const homeIconBoxBase = 'workspace-icon box-border flex shrink-0 items-center justify-center overflow-hidden'

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

export const homePillClass = 'workspace-chip text-xs'
export const homeSmallPillClass = 'workspace-chip text-[11px]'
export const homeWrapPillClass = 'workspace-chip text-left text-xs leading-relaxed'

export const homeSubscribedPillClass =
  'inline-flex items-center justify-center gap-2 rounded-control border border-brand-border bg-brand-accent-soft px-4 py-2 font-heading text-xs font-semibold text-brand-dark sm:text-sm'

export const homeMetricCardClass = `min-w-0 ${homeCardClass} p-3.5 sm:p-5 md:min-w-0`

export const homeSectionTitleClass = 'font-section text-xl font-medium leading-tight tracking-tight text-brand-dark sm:text-2xl'

export const homeAssignmentCardClass =
  'home-assignment-card flex flex-col gap-4 rounded-container border border-brand-border bg-bg-card p-4 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between'
