import {
  LEARNER_CEFR_LEVELS,
  getCefrLevelWeight,
  normalizePackLevel,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'

/**
 * Escopo de conteúdo do Blitz padrão (sem IA).
 *
 * O Blitz IA pergunta a dificuldade porque gera o conteúdo na hora. O padrão não pergunta nada —
 * e por isso vinha misturando A1 com B2 na mesma partida. Sem uma pergunta na tela, o único sinal
 * honesto de qual conteúdo serve é o nível CEFR do próprio usuário.
 *
 * A regra é um TETO, não um alvo: quem está no B1 joga com A1, A2 e B1. Frase de B2 fica de fora.
 * Teto e não igualdade porque o nível é o que a pessoa alcança, não o único lugar onde ela treina —
 * revisar A1 no B1 é normal; encarar B2 no B1 é a partida que estava estragada.
 */

/**
 * Teto usado enquanto o nível ainda está em avaliação (conta nova, sem interações suficientes).
 *
 * A2 e não A1: o A1 puro deixaria a partida quase vazia para quem já tem packs gerais na
 * biblioteca, e A2 é o mesmo padrão que `normalizePackLevel` usa para pack sem nível declarado.
 */
export const BLITZ_LEVEL_WHILE_ASSESSING: LearnerCefrLevel = 'A2'

export function blitzLevelCeiling(
  userLevel: LearnerCefrLevel | null | undefined
): LearnerCefrLevel {
  return userLevel ?? BLITZ_LEVEL_WHILE_ASSESSING
}

/** Faixa completa liberada para o usuário: do A1 até o nível dele. */
export function blitzLevelsInScope(
  userLevel: LearnerCefrLevel | null | undefined
): LearnerCefrLevel[] {
  const ceilingWeight = getCefrLevelWeight(blitzLevelCeiling(userLevel))
  return LEARNER_CEFR_LEVELS.filter((level) => getCefrLevelWeight(level) <= ceilingWeight)
}

/**
 * `packLevel` é o `packs.level` cru do banco — pode vir null, "intermediate" ou "B1".
 * `normalizePackLevel` resolve os três casos antes da comparação.
 */
export function isPackLevelInScope(
  packLevel: string | null | undefined,
  userLevel: LearnerCefrLevel | null | undefined
): boolean {
  return (
    getCefrLevelWeight(normalizePackLevel(packLevel)) <=
    getCefrLevelWeight(blitzLevelCeiling(userLevel))
  )
}

/**
 * Filtra qualquer coleção que saiba dizer o nível do pack de onde o item veio.
 *
 * Genérico porque as três fontes do Blitz têm formatos diferentes: item da fila de revisão, card
 * de assignment e card de pack público. Cada chamador passa o próprio leitor de nível.
 */
export function filterToLevelScope<T>(
  items: T[],
  readPackLevel: (item: T) => string | null | undefined,
  userLevel: LearnerCefrLevel | null | undefined
): T[] {
  return items.filter((item) => isPackLevelInScope(readPackLevel(item), userLevel))
}

/**
 * Quantas frases pedir de cada nível quando a IA monta a partida.
 *
 * O Blitz IA perguntava a dificuldade e gerava tudo num nível só. Perguntar já era ruim (quem não
 * conhece CEFR não sabe responder), mas o pior era o resultado: nada garantia que a escolha
 * batesse com o nível real da pessoa — dava para pedir C2-ish estando no A1.
 *
 * Agora ninguém escolhe. A partida cobre a faixa do A1 até o nível do usuário, concentrada no
 * topo: é lá que ela está aprendendo. Os níveis abaixo entram em dose menor porque revisar o que
 * já foi visto é o que sustenta o que está sendo aprendido — mas revisão não pode ocupar a
 * partida inteira.
 *
 * O peso cai pela METADE a cada nível que desce a partir do teto (1, 0.5, 0.25...). É uma curva,
 * não uma tabela: funciona igual para quem tem um nível na faixa e para quem tem quatro, sem
 * precisar de um caso especial por tamanho.
 */
const DECAIMENTO_POR_NIVEL = 0.5

export type BlitzAiLevelPlan = { level: LearnerCefrLevel; count: number }[]

export function planBlitzAiLevels(
  count: number,
  userLevel: LearnerCefrLevel | null | undefined
): BlitzAiLevelPlan {
  const total = Math.max(Math.trunc(count) || 0, 0)
  // Do teto para baixo: o primeiro da lista é o nível do usuário, que leva o maior peso.
  const doTopoParaBaixo = [...blitzLevelsInScope(userLevel)].reverse()
  if (total === 0 || doTopoParaBaixo.length === 0) return []

  const pesos = doTopoParaBaixo.map((_, index) => DECAIMENTO_POR_NIVEL ** index)
  const somaDosPesos = pesos.reduce((soma, peso) => soma + peso, 0)

  // Arredonda para baixo e devolve a sobra ao topo: com 32 frases em três níveis, o floor perde
  // uma ou duas: elas vão para o nível que a pessoa está aprendendo, não para a revisão.
  const plano = doTopoParaBaixo.map((level, index) => ({
    level,
    count: Math.floor((total * pesos[index]) / somaDosPesos),
  }))
  plano[0].count += total - plano.reduce((soma, item) => soma + item.count, 0)

  return plano.filter((item) => item.count > 0)
}
