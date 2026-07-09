export const LANDING_CHAPTERS = [
  { id: 'produto', label: 'Produto' },
  { id: 'para-quem', label: 'Para você' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'precos', label: 'Planos' },
  { id: 'depoimentos', label: 'Histórias' },
  { id: 'faq', label: 'FAQ' },
] as const

export type LandingChapterId = (typeof LANDING_CHAPTERS)[number]['id']
