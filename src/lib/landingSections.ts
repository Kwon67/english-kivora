export const LANDING_CHAPTERS = [
  { id: 'produto', label: 'Início' },
  { id: 'seu-caminho', label: 'Seu caminho' },
  { id: 'como-funciona', label: 'Práticas' },
  { id: 'precos', label: 'Planos' },
  { id: 'faq', label: 'Dúvidas' },
] as const

export type LandingChapterId = (typeof LANDING_CHAPTERS)[number]['id']
