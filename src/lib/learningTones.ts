export type LearningTone =
  | 'grammar'
  | 'vocabulary'
  | 'speaking'
  | 'listening'
  | 'writing'
  | 'reading'
  | 'review'
  | 'tutor'
  | 'streak'
  | 'achievement'

export type StatusTone = 'success' | 'warning' | 'error' | 'info'

const categoryTones: Readonly<Record<string, LearningTone>> = {
  gramática: 'grammar',
  vocabulário: 'vocabulary',
  conversação: 'speaking',
  fala: 'speaking',
  pronúncia: 'speaking',
  escuta: 'listening',
  listening: 'listening',
  escrita: 'writing',
  leitura: 'reading',
  revisão: 'review',
}

export function getCategoryTone(
  category?: string | null,
): LearningTone | undefined {
  if (!category) return undefined
  const key = category.trim().toLocaleLowerCase('pt-BR')
  return Object.hasOwn(categoryTones, key) ? categoryTones[key] : undefined
}
