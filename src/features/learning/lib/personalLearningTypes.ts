import type { AdaptiveLearningPlan } from './adaptivePlan'

export type PersonalLearningState = 'queued' | 'generating' | 'audio' | 'ready' | 'deferred' | 'failed'

export type PersonalLearningCard = {
  id: string
  en: string
  pt: string
  audioUrl?: string
}

/** Kept on the server. Lease tokens and drafts never enter a browser response. */
export type PersonalLearningJob = {
  id: string
  user_id: string
  plan_date: string
  status: PersonalLearningState
  plan: AdaptiveLearningPlan | null
  cards: PersonalLearningCard[]
  pack_id: string | null
  attempts: number
  lease_token: string | null
  lease_until: string | null
  next_attempt_at: string
  error_code: string | null
  created_at: string
  updated_at: string
}

export type PersonalLearningStatus = {
  status: PersonalLearningState | 'unavailable' | 'disabled'
  level?: string
  objective?: string
  reasons?: string[]
  cardCount?: number
  audioReady?: number
  packId?: string
  activityId?: string
  retryable?: boolean
  message: string
}

export function personalLearningStatus(job: PersonalLearningJob): PersonalLearningStatus {
  const messages: Record<PersonalLearningState, string> = {
    queued: 'Seu próximo treino está sendo preparado a partir do seu aprendizado.',
    generating: 'Criando frases novas para o seu nível e suas dificuldades.',
    audio: 'Preparando os áudios das suas novas frases.',
    ready: 'Seu treino pessoal está pronto, com frases novas e áudio.',
    deferred: job.plan?.generationBlockedReason === 'review_backlog'
      ? 'Hoje vamos consolidar suas revisões antes de acrescentar novas frases.'
      : 'Você já tem frases novas para estudar. O próximo pack virá conforme avançar.',
    failed: 'Não conseguimos concluir seu novo treino agora. Suas atividades e revisões continuam disponíveis.',
  }
  return {
    status: job.status,
    level: job.plan?.level,
    objective: job.plan?.objective,
    reasons: job.plan?.reasons,
    cardCount: job.cards?.length || job.plan?.cardCount || 0,
    audioReady: job.cards?.filter((card) => card.audioUrl).length || 0,
    ...(job.pack_id ? { packId: job.pack_id } : {}),
    retryable: job.status === 'failed' && job.attempts < 3,
    message: messages[job.status],
  }
}
