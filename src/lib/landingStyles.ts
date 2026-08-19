/** Bugster-aligned landing surfaces: 1px borders, ~13px radius, larger CTAs. */
export const landingRadius = 'rounded-[20px]'
export const landingRadiusLg = 'rounded-[20px]'
export const landingBorder = 'border border-brand-dark'

/**
 * Raio único de container em todo o site: 20px.
 *
 * Antes convivíamos com dois — os cards de herói usavam 20px e todo o resto 13px, então na área
 * admin a barra do topo (13px) ficava visivelmente menos arredondada que o header logo abaixo
 * (20px), lado a lado.
 *
 * `landingRadius` (13px) CONTINUA existindo, e de propósito: ele veste os controles — botões,
 * caixas de ícone, pílulas. Num botão de 40px de altura, 20px de raio é exatamente metade da
 * altura, ou seja, vira cápsula. A regra é: container 20px, controle 13px.
 */
export const landingSurfaceClass = `${landingBorder} ${landingRadiusLg}`
export const landingHeroCardClass = `${landingBorder} ${landingRadiusLg} bg-bg-card`

/** Offset shadow — solid black, matches brand-dark */
export const landingCtaCardShadow = 'shadow-[6px_6px_0_#1C1915]'

/** Auth inputs and nested panels */
export const landingInputClass =
  'rounded-[20px] border border-brand-dark bg-bg-primary transition-all focus-within:bg-white/50 focus-within:shadow-[4px_4px_0_#D5E06B]'