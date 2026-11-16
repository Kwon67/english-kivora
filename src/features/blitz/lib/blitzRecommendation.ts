import type { BlitzMiss } from './blitzMisses'

export function getBlitzStudyRecommendation(misses: BlitzMiss[]) {
  if (misses.length < 2) return null

  if (misses.filter(miss => miss.wasNew).length >= 2) {
    return {
      title: 'Conheça mais frases do seu nível',
      detail: 'Alguns desafios usaram frases novas. Pratique uma lição da sua trilha antes de voltar ao Blitz.',
      action: 'Abrir minha trilha',
      href: '/courses#trilha',
    }
  }

  const skill = (['listening', 'typing', 'speaking'] as const).find(mode => misses.filter(miss => miss.mode === mode).length >= 2)
  if (skill) {
    const labels = { listening: 'escuta', typing: 'escrita', speaking: 'fala' }
    return {
      title: `Dê atenção à ${labels[skill]}`,
      detail: `Em uma revisão guiada, pratique no seu ritmo e dê mais atenção aos exercícios de ${labels[skill]}.`,
      action: 'Abrir revisão guiada',
      href: '/review?mode=guided',
    }
  }

  return {
    title: 'Retome o que você já estudou',
    detail: 'Faça a revisão do dia para recuperar o vocabulário antes de jogar de novo.',
    action: 'Abrir revisão do dia',
    href: '/review',
  }
}
