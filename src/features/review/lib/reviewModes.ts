import { isPlayableAssignmentGameMode, PLAYABLE_GAME_MODES } from '@/features/review/lib/reviewSchedules'
import type { GameMode } from '@/types/database.types'

/** @deprecated Use resolveReviewModesForCard with context instead. */
export const NORMAL_REVIEW_MODES: GameMode[] = ['listening']

export const NEW_CARD_MODE: GameMode = 'listening'
/**
 * Rodízio de um card em aprendizagem: escuta, digitação E fala.
 *
 * A fala ficava fora ("card sem saída sem microfone"). Isso já não é verdade: sem reconhecimento
 * de voz a atividade cai para escuta (speechSupport.ts). E sem ela aqui, a revisão — que é onde o
 * aluno passa a maior parte do tempo — nunca pedia que ele dissesse uma frase em voz alta.
 */
export const DEFAULT_ROTATION_MODES: GameMode[] = ['listening', 'typing', 'speaking']
export const MATURE_REPETITIONS_THRESHOLD = 3
export const MATURE_TOTAL_REVIEWS_THRESHOLD = 4

/**
 * Card maduro volta a ser cobrado de PRODUÇÃO a cada N revisões.
 *
 * Antes, maduro devolvia `[]` para sempre: passadas quatro revisões o card nunca mais pedia que
 * você escrevesse ou dissesse nada — só virava o flashcard e perguntava "lembrou?". Isso é
 * reconhecimento AUTOAVALIADO, e reconhecer uma frase que está na sua frente é muito mais fácil
 * do que produzi-la. Num baralho real, 127 de 139 cards (91%) já estavam nessa condição.
 *
 * A cadência é 1 em cada 2 porque o intervalo de um card maduro passa de 21 dias: na prática a
 * checagem de produção cai a cada mês e meio, o que mede sem transformar a revisão em prova.
 *
 * Usa `total_reviews`, que é estável durante a sessão — a escolha não pode mudar entre um
 * re-render e outro, senão o modo troca embaixo do usuário.
 */
export const MATURE_PRODUCTION_EVERY = 2

/**
 * As duas produções que o card maduro alterna: escrever a frase em inglês e dizê-la em voz alta.
 * Ver `getMatureProductionMode`.
 */
export const MATURE_PRODUCTION_MODES: readonly GameMode[] = ['typing', 'speaking']

/**
 * Para que lado a digitação vai em cada fase do card.
 *
 * Maduro → PRODUÇÃO (lê o português, escreve o inglês). Era o que a "produção" do card maduro
 * prometia e não entregava: a digitação mostrava o inglês e cobrava o português, ou seja,
 * "produção" em língua materna. Card ainda em aprendizagem → compreensão (vê o inglês, escreve o
 * sentido): produzir de memória uma frase vista duas vezes é pedir demais e só ensina a errar.
 */
export function getReviewTypingDirection(context: ReviewCardContext): 'pt-to-en' | 'en-to-pt' {
  return isMatureReviewCard(context) ? 'pt-to-en' : 'en-to-pt'
}

const REVIEW_MODE_ORDER: GameMode[] = PLAYABLE_GAME_MODES

export type ReviewCardContext = {
  cardId: string
  isNew?: boolean
  repetitions?: number
  total_reviews?: number
}

export function normalizeWeakModes(modes: Iterable<string>): GameMode[] {
  const unique = new Set<GameMode>()
  for (const mode of modes) {
    if (!isPlayableAssignmentGameMode(mode) || mode === 'flashcard') continue
    unique.add(mode)
  }
  return REVIEW_MODE_ORDER.filter((mode) => unique.has(mode))
}

export function isMatureReviewCard(context: ReviewCardContext): boolean {
  const repetitions = context.repetitions ?? 0
  const totalReviews = context.total_reviews ?? 0
  return repetitions >= MATURE_REPETITIONS_THRESHOLD || totalReviews >= MATURE_TOTAL_REVIEWS_THRESHOLD
}

export function pickRotatedPracticeMode(cardId: string): GameMode {
  if (DEFAULT_ROTATION_MODES.length === 0) return NEW_CARD_MODE
  let hash = 0
  for (let i = 0; i < cardId.length; i += 1) {
    hash = (hash * 31 + cardId.charCodeAt(i)) >>> 0
  }
  return DEFAULT_ROTATION_MODES[hash % DEFAULT_ROTATION_MODES.length] ?? NEW_CARD_MODE
}

/** Verdadeiro quando esta revisão do card maduro deve cobrar produção em vez de só reconhecer. */
export function shouldProduceOnMatureReview(context: ReviewCardContext): boolean {
  const totalReviews = context.total_reviews ?? 0
  return totalReviews > 0 && totalReviews % MATURE_PRODUCTION_EVERY === 0
}

/**
 * Nas vezes de produção, o card maduro alterna escrita e fala: a 2ª revisão escreve, a 4ª fala,
 * a 6ª escreve… Determinístico por `total_reviews`, pelo mesmo motivo do rodízio: a escolha não
 * pode mudar entre um re-render e outro.
 */
export function getMatureProductionMode(context: ReviewCardContext): GameMode {
  // 1ª vez de produção (total_reviews 2) → escrita, 2ª (4) → fala, e assim por diante.
  const turn = Math.max(0, Math.floor((context.total_reviews ?? 0) / MATURE_PRODUCTION_EVERY) - 1)
  return MATURE_PRODUCTION_MODES[turn % MATURE_PRODUCTION_MODES.length] ?? 'typing'
}

/**
 * Escolhe no máximo um modo de prática antes da avaliação de retenção.
 * - Maduro, na vez da produção → digitação ou fala, alternando (ou o modo fraco, se houver histórico)
 * - Maduro, fora da vez → nenhum (só avalia)
 * - Histórico de modo fraco → o modo mais fraco
 * - Card novo → escuta
 * - Aprendendo → um modo do rodízio (escuta / digitação / fala)
 */
export function resolveReviewModesForCard(
  weakModes: Iterable<string>,
  context: ReviewCardContext
): GameMode[] {
  const normalizedWeak = normalizeWeakModes(weakModes)

  if (isMatureReviewCard(context)) {
    if (!shouldProduceOnMatureReview(context)) return []
    // Um modo comprovadamente fraco diz mais que o padrão.
    return [normalizedWeak[0] ?? getMatureProductionMode(context)]
  }

  if (normalizedWeak.length > 0) {
    return [normalizedWeak[0]]
  }

  if (context.isNew) {
    return [NEW_CARD_MODE]
  }

  return [pickRotatedPracticeMode(context.cardId)]
}

export function getReviewModeLabel(mode: GameMode) {
  switch (mode) {
    case 'multiple_choice':
      return 'Múltipla escolha'
    case 'flashcard':
      return 'Flashcard'
    case 'typing':
      return 'Digitação'
    case 'matching':
      return 'Combinação'
    case 'listening':
      return 'Escuta'
    case 'speaking':
      return 'Fala'
    default:
      return mode
  }
}