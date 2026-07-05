import type { UserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import type { OnboardingDailyGoalMinutes } from '@/features/onboarding/lib/onboardingInterests'
import type { ReviewQueueSummary } from '@/features/review/lib/reviewQueue'
import { getRecommendedLearningResources } from '@/features/learning-profile/lib/learningResourceCatalog'

export type LearningFocus =
  | 'diagnostic'
  | 'vocabulary'
  | 'srs-repair'
  | 'listening'
  | 'shadowing'
  | 'reading'
  | 'fluency'

export type LearningProfileRecommendation = {
  id: string
  title: string
  description: string
  actionLabel: string
  href: string
  external?: boolean
  level?: LearnerCefrLevel
  kind?: string
}

export type LearningProfilePlan = {
  stage: LearningFocus
  level: LearnerCefrLevel | null
  headline: string
  summary: string
  primaryAction: LearningProfileRecommendation
  focusAreas: string[]
  studySteps: string[]
  resources: LearningProfileRecommendation[]
  signals: string[]
}

export type LearningProfileInput = {
  cefrProfile: UserCefrProfile
  reviewStats: ReviewQueueSummary
  problemWordsCount: number
  pendingAssignmentsCount: number
  completedReviewsToday: number
  streakStatus: 'normal' | 'risk' | 'lost'
  dailyGoalMinutes: OnboardingDailyGoalMinutes | null
  interests: string[]
}

const LEVEL_FOCUS: Record<LearnerCefrLevel, Pick<LearningProfilePlan, 'headline' | 'summary' | 'focusAreas' | 'studySteps'>> = {
  A1: {
    headline: 'Construir base com vocabulário e frases curtas',
    summary:
      'Seu melhor avanço agora vem de retenção diária: poucas frases, muita repetição e escuta curta com legenda.',
    focusAreas: ['SRS diário', 'Vocabulário essencial', 'Escuta lenta', 'Frases prontas'],
    studySteps: [
      'Faça uma sessão curta de SRS antes de qualquer conteúdo novo.',
      'Repita em voz alta 5 frases úteis do dia, sem tentar decorar gramática isolada.',
      'Assista um vídeo curto com legenda em inglês e anote apenas 3 palavras novas.',
    ],
  },
  A2: {
    headline: 'Transformar vocabulário em compreensão real',
    summary:
      'Você já pode alternar SRS, listening guiado e leitura simples para reconhecer frases fora dos cards.',
    focusAreas: ['SRS de manutenção', 'Listening guiado', 'Leitura graduada', 'Shadowing leve'],
    studySteps: [
      'Revise os cards vencidos e limite palavras novas se houver acúmulo.',
      'Ouça uma conversa curta duas vezes: uma com legenda e outra acompanhando em voz baixa.',
      'Leia um texto curto e destaque expressões que você usaria numa conversa real.',
    ],
  },
  B1: {
    headline: 'Ganhar velocidade com shadowing e leitura extensa',
    summary:
      'O foco passa a ser ritmo: consumir blocos maiores, imitar fala natural e usar o vocabulário em contexto.',
    focusAreas: ['Shadowing', 'Leitura extensa', 'Listening natural', 'Produção oral'],
    studySteps: [
      'Escolha um trecho de 60 a 90 segundos e faça shadowing em três passadas.',
      'Leia um conteúdo do seu interesse sem traduzir palavra por palavra.',
      'Registre 3 expressões novas e transforme cada uma em uma frase sua.',
    ],
  },
  B2: {
    headline: 'Refinar fluência, precisão e repertório',
    summary:
      'Agora o ganho vem de conteúdo autêntico, fala mais longa, nuances de vocabulário e revisão dos erros recorrentes.',
    focusAreas: ['Fluência oral', 'Conteúdo autêntico', 'Precisão', 'Vocabulário avançado'],
    studySteps: [
      'Assista um trecho autêntico sem legenda e depois confirme pontos perdidos com legenda em inglês.',
      'Faça um resumo falado de 2 minutos usando novas expressões do conteúdo.',
      'Revise erros recorrentes para remover vícios antes de acumular conteúdo novo.',
    ],
  },
}

function chooseStage(input: LearningProfileInput): LearningFocus {
  const { cefrProfile, reviewStats, problemWordsCount } = input

  if (cefrProfile.assessing || !cefrProfile.level) return 'diagnostic'
  if (reviewStats.totalBacklogDue >= 12 || problemWordsCount >= 8) return 'srs-repair'
  if (cefrProfile.level === 'A1') return 'vocabulary'
  if (cefrProfile.level === 'A2') return 'listening'
  if (cefrProfile.level === 'B1') return 'shadowing'
  return 'fluency'
}

function getPrimaryAction(input: LearningProfileInput, stage: LearningFocus): LearningProfileRecommendation {
  if (input.reviewStats.totalDue > 0) {
    return {
      id: 'review',
      title: 'Revisar antes de avançar',
      description: `${input.reviewStats.totalDue} frase${input.reviewStats.totalDue === 1 ? '' : 's'} estão prontas para fortalecer retenção.`,
      actionLabel: 'Abrir SRS',
      href: '/review',
    }
  }

  if (input.problemWordsCount > 0 && (stage === 'srs-repair' || input.problemWordsCount >= 4)) {
    return {
      id: 'problem-words',
      title: 'Corrigir palavras que estão travando',
      description: `${input.problemWordsCount} termo${input.problemWordsCount === 1 ? '' : 's'} apareceram em erros recentes.`,
      actionLabel: 'Ver dificuldades',
      href: '/problem-words',
    }
  }

  if (input.pendingAssignmentsCount > 0) {
    return {
      id: 'study',
      title: 'Continuar a rotina guiada',
      description: `${input.pendingAssignmentsCount} atividade${input.pendingAssignmentsCount === 1 ? '' : 's'} ainda esperam no plano.`,
      actionLabel: 'Abrir plano',
      href: '/study',
    }
  }

  if (stage === 'diagnostic') {
    return {
      id: 'placement',
      title: 'Calibrar seu nível',
      description: 'Complete o nivelamento para o app recomendar conteúdo com mais precisão.',
      actionLabel: 'Fazer diagnóstico',
      href: '/onboarding',
    }
  }

  return {
    id: 'explore',
    title: 'Adicionar conteúdo no nível certo',
    description: 'Escolha um pack alinhado ao seu nível e interesses para alimentar a rotina.',
    actionLabel: 'Explorar packs',
    href: '/explore',
  }
}

function getResources(level: LearnerCefrLevel | null, interests: string[]): LearningProfileRecommendation[] {
  const safeLevel = level ?? 'A1'
  return getRecommendedLearningResources({ level: safeLevel, interests, limit: 2 }).map((resource) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description,
    actionLabel: resource.actionLabel,
    href: resource.href,
    external: resource.external,
    level: resource.level,
    kind: resource.kind,
  }))
}

function getSignals(input: LearningProfileInput, stage: LearningFocus): string[] {
  const signals = stage === 'srs-repair'
    ? ['Prioridade: reduzir acúmulo antes de consumir conteúdo novo']
    : []

  signals.push(
    input.cefrProfile.level
      ? `Nível detectado: ${input.cefrProfile.level} com ${input.cefrProfile.confidence}% de confiança`
      : 'Nível ainda em avaliação',
    `${input.reviewStats.totalDue} revisão${input.reviewStats.totalDue === 1 ? '' : 'ões'} para hoje`
  )

  if (input.problemWordsCount > 0) {
    signals.push(`${input.problemWordsCount} dificuldade${input.problemWordsCount === 1 ? '' : 's'} recente${input.problemWordsCount === 1 ? '' : 's'}`)
  }

  if (input.dailyGoalMinutes) {
    signals.push(`Meta declarada: ${input.dailyGoalMinutes} min/dia`)
  }

  if (input.streakStatus === 'risk') {
    signals.push('Sequência em risco hoje')
  } else if (input.streakStatus === 'lost') {
    signals.push('Sequência precisa ser retomada')
  }

  return signals.slice(0, 4)
}

export function getLearningProfilePlan(input: LearningProfileInput): LearningProfilePlan {
  const stage = chooseStage(input)
  const level = input.cefrProfile.level
  const safeLevel = level ?? 'A1'
  const levelPlan = LEVEL_FOCUS[safeLevel]
  const primaryAction = getPrimaryAction(input, stage)

  if (stage === 'diagnostic') {
    return {
      stage,
      level,
      headline: 'Entender seu ponto de partida',
      summary:
        'Ainda faltam sinais suficientes para distinguir seu nível com segurança. O app vai priorizar diagnóstico, SRS leve e conteúdo A1 curto.',
      primaryAction,
      focusAreas: ['Nivelamento', 'SRS leve', 'Listening curto', 'Hábito diário'],
      studySteps: [
        'Complete o nivelamento ou faça algumas atividades para gerar sinais reais.',
        'Use SRS com poucas frases novas para não criar acúmulo.',
        'Assista um vídeo A1 curto e marque o que foi fácil ou difícil.',
      ],
      resources: getResources(level, input.interests),
      signals: getSignals(input, stage),
    }
  }

  if (stage === 'srs-repair') {
    return {
      stage,
      level,
      headline: 'Consolidar antes de colocar conteúdo novo',
      summary:
        'Há sinais de acúmulo ou erros recorrentes. A recomendação é reduzir carga nova e recuperar retenção com SRS focado.',
      primaryAction,
      focusAreas: ['SRS focado', 'Erros recentes', 'Revisão curta', 'Pouco conteúdo novo'],
      studySteps: [
        'Faça a fila de revisão antes de iniciar qualquer lição nova.',
        'Revise as palavras problemáticas e fale cada frase em voz alta.',
        'Só adicione conteúdo novo depois de baixar o acúmulo do dia.',
      ],
      resources: getResources(level, input.interests),
      signals: getSignals(input, stage),
    }
  }

  return {
    stage,
    level,
    headline: levelPlan.headline,
    summary: levelPlan.summary,
    primaryAction,
    focusAreas: levelPlan.focusAreas,
    studySteps: levelPlan.studySteps,
    resources: getResources(level, input.interests),
    signals: getSignals(input, stage),
  }
}
