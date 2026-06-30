/** Bugster-aligned landing surfaces: 1px borders, ~13px radius, larger CTAs. */
export const landingRadius = 'rounded-[13px]'
export const landingRadiusLg = 'rounded-[20px]'
export const landingBorder = 'border border-brand-dark'

export const landingSurfaceClass = `${landingBorder} ${landingRadius}`
export const landingHeroCardClass = `${landingBorder} ${landingRadiusLg} bg-bg-card`

/** Offset shadow — solid black, matches brand-dark */
export const landingCtaCardShadow = 'shadow-[6px_6px_0_#1C1915]'

/** Auth inputs and nested panels */
export const landingInputClass =
  'rounded-[13px] border border-brand-dark bg-bg-primary transition-all focus-within:bg-white/50 focus-within:shadow-[4px_4px_0_#D5E06B]'