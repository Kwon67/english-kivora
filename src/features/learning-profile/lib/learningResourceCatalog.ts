import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

export type LearningResourceKind = 'video' | 'series' | 'reading' | 'shadowing' | 'listening'

export type LearningResource = {
  id: string
  title: string
  description: string
  actionLabel: string
  href: string
  external?: boolean
  level: LearnerCefrLevel
  kind: LearningResourceKind
  interests: string[]
  priority: number
}

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export const LEARNING_RESOURCE_CATALOG: LearningResource[] = [
  {
    id: 'a1-youtube-short-story',
    title: 'YouTube curto A1 com legenda',
    description: 'Histórias e diálogos lentos para reconhecer vocabulário básico sem sobrecarga.',
    actionLabel: 'Buscar vídeo',
    href: youtubeSearchUrl('english listening practice A1 short story subtitles'),
    external: true,
    level: 'A1',
    kind: 'video',
    interests: ['conversation', 'culture'],
    priority: 95,
  },
  {
    id: 'a1-picture-dictionary',
    title: 'Leitura visual para vocabulário essencial',
    description: 'Use textos muito curtos com imagem e repita frases prontas em voz alta.',
    actionLabel: 'Abrir método',
    href: '/tutor',
    level: 'A1',
    kind: 'reading',
    interests: ['grammar', 'travel', 'work'],
    priority: 86,
  },
  {
    id: 'a1-netflix-micro-scenes',
    title: 'Netflix em cenas de 2 minutos',
    description: 'Cena curta, legenda em português primeiro, depois legenda em inglês para repetir 3 frases.',
    actionLabel: 'Ver método',
    href: '/tutor',
    level: 'A1',
    kind: 'series',
    interests: ['culture', 'conversation'],
    priority: 82,
  },
  {
    id: 'a2-youtube-conversation',
    title: 'YouTube A2: conversa curta',
    description: 'Diálogos simples para treinar escuta guiada e vocabulário de rotina.',
    actionLabel: 'Buscar vídeo',
    href: youtubeSearchUrl('english listening practice A2 short conversation subtitles'),
    external: true,
    level: 'A2',
    kind: 'video',
    interests: ['conversation', 'travel', 'work'],
    priority: 94,
  },
  {
    id: 'a2-graded-reading',
    title: 'Leitura graduada A2',
    description: 'Texto curto com vocabulário familiar para sair da tradução palavra por palavra.',
    actionLabel: 'Abrir leitura',
    href: '/explore',
    level: 'A2',
    kind: 'reading',
    interests: ['exam', 'grammar', 'culture'],
    priority: 88,
  },
  {
    id: 'a2-series-light-scenes',
    title: 'Séries leves com legenda em inglês',
    description: 'Trechos de 3 a 5 minutos para ouvir duas vezes e capturar expressões úteis.',
    actionLabel: 'Ver método',
    href: '/tutor',
    level: 'A2',
    kind: 'series',
    interests: ['culture', 'conversation'],
    priority: 84,
  },
  {
    id: 'b1-youtube-shadowing',
    title: 'YouTube B1 para shadowing',
    description: 'Trechos de 60 a 90 segundos para copiar ritmo, entonação e chunks naturais.',
    actionLabel: 'Buscar shadowing',
    href: youtubeSearchUrl('english shadowing practice B1 short video'),
    external: true,
    level: 'B1',
    kind: 'shadowing',
    interests: ['conversation', 'work', 'culture'],
    priority: 96,
  },
  {
    id: 'b1-extensive-reading',
    title: 'Leitura extensa B1',
    description: 'Leia por blocos maiores e anote expressões que você realmente usaria.',
    actionLabel: 'Explorar packs',
    href: '/explore',
    level: 'B1',
    kind: 'reading',
    interests: ['exam', 'work', 'grammar'],
    priority: 89,
  },
  {
    id: 'b1-series-shadowing',
    title: 'Série com reassistir + shadowing',
    description: 'Assista uma cena, volte no trecho mais útil e faça três passadas de repetição.',
    actionLabel: 'Ver método',
    href: '/tutor',
    level: 'B1',
    kind: 'series',
    interests: ['culture', 'conversation'],
    priority: 87,
  },
  {
    id: 'b2-youtube-natural-speech',
    title: 'YouTube B2 com fala natural',
    description: 'Conteúdo autêntico para treinar velocidade, nuance e vocabulário em contexto.',
    actionLabel: 'Buscar vídeo',
    href: youtubeSearchUrl('english conversation advanced B2 natural speech subtitles'),
    external: true,
    level: 'B2',
    kind: 'video',
    interests: ['conversation', 'culture', 'work'],
    priority: 94,
  },
  {
    id: 'b2-interview-summary',
    title: 'Entrevista + resumo falado',
    description: 'Assista sem legenda, confirme com legenda em inglês e grave um resumo de 2 minutos.',
    actionLabel: 'Praticar fala',
    href: '/tutor',
    level: 'B2',
    kind: 'listening',
    interests: ['work', 'exam', 'conversation'],
    priority: 90,
  },
  {
    id: 'b2-series-no-subtitles',
    title: 'Série sem legenda por blocos',
    description: 'Trechos curtos sem legenda para testar compreensão, depois revisão pontual com legenda.',
    actionLabel: 'Ver método',
    href: '/tutor',
    level: 'B2',
    kind: 'series',
    interests: ['culture', 'conversation'],
    priority: 86,
  },
]

export function getRecommendedLearningResources(options: {
  level: LearnerCefrLevel
  interests: string[]
  limit?: number
  excludeResourceIds?: string[]
}) {
  const interests = new Set(options.interests)
  const excluded = new Set(options.excludeResourceIds ?? [])

  const ranked = LEARNING_RESOURCE_CATALOG
    .filter((resource) => resource.level === options.level)
    .map((resource) => {
      const interestScore = resource.interests.reduce(
        (score, interest) => score + (interests.has(interest) ? 12 : 0),
        0
      )

      return {
        ...resource,
        score: resource.priority + interestScore,
      }
    })
    .sort((a, b) => b.score - a.score)

  const limit = options.limit ?? 2
  const freshResources = ranked.filter((resource) => !excluded.has(resource.id)).slice(0, limit)

  if (freshResources.length >= limit) return freshResources

  return [
    ...freshResources,
    ...ranked.filter((resource) => excluded.has(resource.id)).slice(0, limit - freshResources.length),
  ]
}
