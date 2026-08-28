import {
  LEARNER_CEFR_LEVELS,
  getCefrLevelWeight,
  normalizePackLevel,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'

/**
 * Decide QUAL conteúdo o aluno pode ver, a partir do nível estimado dele.
 *
 * A regra de produto é assimétrica de propósito: olhar para trás é sempre livre
 * (rever A1 estando no B1 consolida), olhar para frente é conquistado. Um aluno
 * A2 que recebe um pack C1 não aprende — desiste. Então o teto é o nível atual,
 * e o nível seguinte só abre quando o estimador tem evidência de que ele já está
 * empurrando essa fronteira.
 *
 * Estrutural por escolha: recebe só os campos de que precisa, e não o
 * `UserCefrProfile` inteiro, para não arrastar o cliente Supabase para dentro de
 * um módulo que roda no browser e é testado sem banco.
 */
export type LevelGateInput = {
  level: LearnerCefrLevel | null
  confidence: number
  progressToNext: number | null
  nextLevel: LearnerCefrLevel | null
}

/**
 * Confiança mínima no nível atual antes de esticar para o próximo.
 *
 * Abaixo disso o estimador ainda está decidindo quem é o aluno, e esticar
 * significaria apostar conteúdo difícil em cima de um palpite.
 */
export const STRETCH_MIN_CONFIDENCE = 70

/**
 * Progresso mínimo rumo ao próximo nível antes de liberá-lo como desafio.
 *
 * `progressToNext` já combina tentativas, acerto e pré-requisito
 * (`estimateUserLevel`), então 65 significa "está claramente batendo na porta",
 * não "acertou algumas por sorte".
 */
export const STRETCH_MIN_PROGRESS = 65

export type LevelGate = {
  /** Tudo que o aluno pode receber hoje, do A1 até o teto. */
  allowed: LearnerCefrLevel[]
  /** Teto de consolidação: o nível estimado (ou A1 enquanto avalia). */
  current: LearnerCefrLevel
  /** Nível de desafio já conquistado, se houver. `null` na maioria dos dias. */
  stretch: LearnerCefrLevel | null
}

/**
 * Aluno sem nível estimado ainda (conta nova, antes do teste) começa no A1.
 *
 * É o único palpite seguro: errar para baixo custa um dia de conteúdo fácil,
 * errar para cima custa o aluno.
 *
 * Divergência deliberada do Blitz: `BLITZ_LEVEL_WHILE_ASSESSING` é A2, não A1.
 * As duas regras são o mesmo teto (A1 até o nível atual) e diferem só neste
 * padrão, porque o custo de errar é diferente. Uma partida de Blitz precisa de
 * volume para existir, e o A1 puro a deixaria quase vazia; o plano do dia não
 * tem esse problema — se só houver material A1, três atividades A1 é um dia
 * legítimo. Ao mexer numa das duas, confira a outra.
 */
const DEFAULT_ENTRY_LEVEL: LearnerCefrLevel = 'A1'

export function getLevelGate(input: LevelGateInput): LevelGate {
  const current = input.level ?? DEFAULT_ENTRY_LEVEL
  const ceiling = getCefrLevelWeight(current)

  const allowed = LEARNER_CEFR_LEVELS.filter(
    (level) => getCefrLevelWeight(level) <= ceiling
  )

  const stretch =
    input.nextLevel &&
    input.level &&
    input.confidence >= STRETCH_MIN_CONFIDENCE &&
    (input.progressToNext ?? 0) >= STRETCH_MIN_PROGRESS
      ? input.nextLevel
      : null

  return {
    allowed: stretch ? [...allowed, stretch] : allowed,
    current,
    stretch,
  }
}

/** O nível de um pack do catálogo é liberado para este aluno? */
export function isPackLevelAllowed(
  packLevel: string | null | undefined,
  gate: LevelGate
): boolean {
  return gate.allowed.includes(normalizePackLevel(packLevel))
}

/**
 * Por que este pack está trancado, na voz do produto.
 *
 * Retorna `null` quando está liberado, para o chamador poder usar direto como
 * "tem cadeado?". A frase nomeia o nível que falta, porque um cadeado sem
 * critério lê como punição — com critério, lê como meta.
 */
export function getPackLockReason(
  packLevel: string | null | undefined,
  gate: LevelGate
): string | null {
  const level = normalizePackLevel(packLevel)
  if (gate.allowed.includes(level)) return null

  const distance = getCefrLevelWeight(level) - getCefrLevelWeight(gate.current)

  if (distance === 1) {
    return `Falta pouco: continue praticando no ${gate.current} para liberar o ${level}.`
  }

  return `Disponível a partir do ${level}. Você está no ${gate.current}.`
}

/**
 * Ordem em que o motor deve preferir os níveis liberados ao montar o dia.
 *
 * O nível atual vem primeiro (é onde o aprendizado acontece), depois o
 * imediatamente anterior (consolidação barata que sustenta a confiança), e só
 * então o resto, do mais recente para o mais antigo. O nível de desafio entra
 * por último: ele existe para provocar, não para dominar o plano.
 */
export function getLevelPriority(gate: LevelGate): LearnerCefrLevel[] {
  const currentWeight = getCefrLevelWeight(gate.current)

  const consolidation = gate.allowed
    .filter((level) => getCefrLevelWeight(level) < currentWeight)
    .sort((a, b) => getCefrLevelWeight(b) - getCefrLevelWeight(a))

  return [
    gate.current,
    ...consolidation,
    ...(gate.stretch ? [gate.stretch] : []),
  ]
}
