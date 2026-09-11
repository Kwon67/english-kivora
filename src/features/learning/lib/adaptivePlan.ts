import { isCefrLevel, type CefrLevel } from '@/features/ai/lib/deckGeneration'

export type AdaptiveSkill = 'vocabulary' | 'listening' | 'speaking' | 'reading' | 'writing'
export type AdaptiveExerciseMode = 'srs' | 'listening' | 'speaking' | 'reading' | 'writing'
export type AdaptiveLearningInput = {
  level: CefrLevel | null
  confidence?: number
  assessing?: boolean
  dailyGoalMinutes?: number | null
  interests?: string[]
  goals?: string[]
  problemWords?: string[]
  dueReviewCount?: number
  pendingNewCards?: number
  skillSignals?: Array<{ skill: AdaptiveSkill; correct: number; total: number }>
  recentTopics?: string[]
  sequence?: number
}

export type AdaptiveLearningPlan = {
  level: CefrLevel
  focus: AdaptiveSkill | 'foundation' | 'repair'
  topic: string
  objective: string
  cardCount: number
  targetWords: string[]
  exerciseModes: AdaptiveExerciseMode[]
  reasons: string[]
  shouldGenerate: boolean
  generationBlockedReason?: 'review_backlog' | 'new_cards_pending'
  cefrGuidance: string
}

/** Product constraints for short, reusable practice cards, not a CEFR certification rubric. */
export const ADAPTIVE_LEVEL_LIMITS: Record<CefrLevel, { maxWords: number; maxCharacters: number; guidance: string; objective: string }> = {
  A1: { maxWords: 9, maxCharacters: 100, guidance: 'Frases de 3 a 7 palavras (máximo 9), uma ideia concreta, presente simples, perguntas básicas; sem idiomatismos opacos ou orações complexas.', objective: 'Entender e usar frases curtas para necessidades imediatas' },
  A2: { maxWords: 13, maxCharacters: 150, guidance: 'Frases curtas de até 13 palavras, situações familiares, passado simples, planos e pedidos; no máximo uma subordinada simples.', objective: 'Trocar informações e descrever situações familiares' },
  B1: { maxWords: 19, maxCharacters: 210, guidance: 'Até 19 palavras; relatos, planos, opiniões com motivos e conectivos comuns; vocabulário cotidiano em contexto.', objective: 'Relatar experiências e explicar opiniões com clareza' },
  B2: { maxWords: 25, maxCharacters: 280, guidance: 'Até 25 palavras; argumentação, hipóteses e nuances em situações reais. Estruturas complexas são um teto, nunca obrigatórias.', objective: 'Sustentar opiniões e compreender nuances em conversas e textos' },
  C1: { maxWords: 32, maxCharacters: 360, guidance: 'Até 32 palavras; registro, inferência, atenuação, colocação e significados implícitos. Evite linguagem artificialmente rebuscada.', objective: 'Interpretar intenções implícitas e ajustar precisão e registro' },
  C2: { maxWords: 40, maxCharacters: 450, guidance: 'Até 40 palavras; precisão idiomática, ambiguidade, ironia e sutileza estilística com contexto suficiente. Não faça da complexidade um fim.', objective: 'Interpretar e expressar distinções sutis com flexibilidade' },
}

const TOPICS: Record<string, string[]> = {
  everyday: ['Rotina e necessidades do dia a dia', 'Compras e escolhas no cotidiano', 'Pessoas, lugares e pequenas histórias', 'Resolver imprevistos do cotidiano'],
  travel: ['Pedir informações durante uma viagem', 'Hospedagem e necessidades no hotel', 'Restaurantes e experiências de viagem', 'Resolver um imprevisto em viagem'],
  work: ['Apresentações e conversas no trabalho', 'Combinar tarefas e prazos', 'Explicar ideias e dar feedback no trabalho', 'Negociar soluções em uma reunião'],
  conversation: ['Conhecer pessoas e manter uma conversa', 'Expressar preferências e fazer convites', 'Contar experiências e ouvir o outro', 'Discordar com respeito e esclarecer intenções'],
  grammar: ['Perguntas e respostas em situações reais', 'Descrever hábitos, acontecimentos e planos', 'Conectar ideias para explicar decisões', 'Escolher estruturas pelo significado desejado'],
  exam: ['Compreender a ideia central de um texto', 'Identificar detalhes e justificar respostas', 'Comparar argumentos e evidências', 'Resumir e expressar uma opinião fundamentada'],
  culture: ['Conversar sobre livros, filmes e música', 'Descrever personagens e acontecimentos', 'Interpretar opiniões e referências culturais', 'Discutir escolhas e intenções de um autor'],
  reading: ['Acompanhar uma pequena história', 'Entender descrições e relações entre ideias', 'Interpretar intenção e ponto de vista', 'Explorar o significado de trechos de livros'],
}

const SKILL_LABELS: Record<AdaptiveSkill, string> = {
  vocabulary: 'vocabulário', listening: 'escuta', speaking: 'fala', reading: 'leitura', writing: 'escrita',
}

function boundedCount(value: number | undefined, max = 10_000): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value!))) : 0
}

/** Only short lexical difficulties go to the provider; never names, profile prose or transcripts. */
export function sanitizeAdaptiveTargetWords(words: string[] = []): string[] {
  return [...new Set(words
    .filter((word) => typeof word === 'string')
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && word.length <= 36 && /^[a-z]+(?:[' -][a-z]+){0,2}$/.test(word))
    .filter((word) => !/\b(system|assistant|prompt|password|apikey|ignore|instructions)\b/.test(word)))]
    .slice(0, 5)
}

export function buildAdaptiveLearningPlan(input: AdaptiveLearningInput): AdaptiveLearningPlan {
  // The planner never awards a level. It uses the assessment or starts conservatively at A1.
  const level = isCefrLevel(input.level) ? input.level : 'A1'
  const confidence = Math.min(100, boundedCount(input.confidence ?? 0, 100))
  const provisional = !input.level || input.assessing === true || confidence < 60
  const due = boundedCount(input.dueReviewCount)
  const pending = boundedCount(input.pendingNewCards)
  const minutes = input.dailyGoalMinutes && Number.isFinite(input.dailyGoalMinutes)
    ? Math.min(60, Math.max(5, input.dailyGoalMinutes)) : 10
  const baseCount = minutes <= 5 ? 4 : 8
  const sequence = boundedCount(input.sequence, 1_000_000)
  const targetWords = sanitizeAdaptiveTargetWords(input.problemWords)
  const signals = (input.skillSignals ?? [])
    .filter((signal) => signal.skill in SKILL_LABELS && Number.isFinite(signal.total) && signal.total >= 6 && Number.isFinite(signal.correct))
    .map((signal) => ({ ...signal, accuracy: Math.max(0, Math.min(signal.total, signal.correct)) / signal.total }))
    .sort((a, b) => a.accuracy - b.accuracy)
  const weakest = signals[0]
  const rotatedSkill = (['listening', 'speaking', 'reading', 'writing'] as const)[sequence % 4]
  const focus: AdaptiveLearningPlan['focus'] = targetWords.length > 0 ? 'repair'
    : weakest && weakest.accuracy < 0.8 ? weakest.skill
      : provisional ? 'foundation' : rotatedSkill

  // These are IDs from onboarding, not arbitrary instructions or personal account data.
  const tracks = [...new Set([...(input.interests ?? []), ...(input.goals ?? [])])]
    .filter((id) => Object.hasOwn(TOPICS, id))
  const track = tracks[sequence % Math.max(tracks.length, 1)] ?? 'everyday'
  const candidates = TOPICS[track]
  const recent = new Set(input.recentTopics ?? [])
  const rotated = candidates.map((_, index) => candidates[(index + Math.floor(sequence / Math.max(tracks.length, 1))) % candidates.length])
  const topic = rotated.find((candidate) => !recent.has(candidate)) ?? rotated[0]
  const generationBlockedReason = due >= 20 ? 'review_backlog' as const
    : pending >= baseCount ? 'new_cards_pending' as const : undefined
  const cardCount = generationBlockedReason ? 0 : Math.min(baseCount, due >= 10 || targetWords.length >= 4 ? 4 : baseCount)
  const focusMode = focus === 'foundation' || focus === 'repair' || focus === 'vocabulary' ? 'srs' : focus
  const exerciseModes = [...new Set<AdaptiveExerciseMode>([focusMode, 'srs', 'listening', 'speaking', 'reading', 'writing'])]
  const reasons = [
    provisional
      ? `Nível de trabalho ${level}; ainda precisamos de evidências para confirmar sua proficiência.`
      : `Conteúdo calibrado para ${level}, com base no nivelamento e nas atividades registradas.`,
    ...(targetWords.length ? [`Novos contextos para ${targetWords.length} dificuldade${targetWords.length === 1 ? '' : 's'} recente${targetWords.length === 1 ? '' : 's'}.`] : []),
    ...(weakest && weakest.accuracy < 0.8 ? [`Prioridade em ${SKILL_LABELS[weakest.skill]}: ${Math.round(weakest.accuracy * 100)}% de acerto em ${Math.floor(weakest.total)} respostas recentes.`] : []),
    generationBlockedReason === 'review_backlog' ? 'Revise o conteúdo acumulado antes de acrescentar frases.'
      : generationBlockedReason === 'new_cards_pending' ? 'Você já tem frases novas prontas para praticar.'
        : `${cardCount} frases novas para uma meta de ${minutes} minutos por dia.`,
  ]
  return {
    level, focus, topic,
    objective: `${ADAPTIVE_LEVEL_LIMITS[level].objective}${focus === 'repair' ? ', recuperando dificuldades em novos contextos' : ''}.`,
    cardCount, targetWords, exerciseModes, reasons,
    shouldGenerate: generationBlockedReason === undefined,
    ...(generationBlockedReason ? { generationBlockedReason } : {}),
    cefrGuidance: ADAPTIVE_LEVEL_LIMITS[level].guidance,
  }
}
