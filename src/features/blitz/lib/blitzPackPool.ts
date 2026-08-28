import { normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { blitzLevelsInScope, filterToLevelScope, planBlitzAiLevels } from './blitzLevelScope'

/**
 * De quais packs do CATÁLOGO a partida padrão vai tirar as frases.
 *
 * O Blitz padrão puxava do catálogo só como último recurso: primeiro a fila de revisão, depois os
 * packs atribuídos, e o catálogo apenas `if (collected.length < candidateTarget)`. Para quem tem
 * rotina cheia, os dois primeiros já enchiam a cota e o terceiro nunca rodava — a partida virava
 * releitura da própria rotina, sempre as mesmas frases. E quando rodava, olhava só os 20 packs
 * mais recentes.
 *
 * Agora o catálogo inteiro é a fonte, limitado pelo nível. Quem decide a partida continua sendo o
 * modelo do aluno (`rankCards`); esta função só monta o material sobre o qual ele decide.
 */

/**
 * Quantos packs entram no sorteio de cada partida.
 *
 * Não é o catálogo todo de propósito: buscar cards de 105 packs para escolher 40 frases é caro, e
 * um pool grande demais dilui os sinais do aluno num mar de frases inéditas. Uma dúzia dá variedade
 * entre partidas sem transformar a consulta num varredor de tabela.
 */
export const BLITZ_PACK_POOL_SIZE = 12

/**
 * Distribui as vagas do pool entre os níveis e sorteia os packs dentro de cada um.
 *
 * A distribuição é a MESMA do Blitz IA (`planBlitzAiLevels`): concentra no nível do aluno e cai
 * pela metade a cada degrau abaixo. Ter duas curvas diferentes para a mesma pergunta — "quanto de
 * cada nível?" — seria a origem óbvia de as duas modalidades divergirem com o tempo.
 *
 * O sorteio dentro do nível é o que faz a partida de amanhã não ser a de hoje. Sem ele, um pool
 * determinístico devolveria sempre os mesmos packs e o catálogo continuaria efetivamente invisível,
 * só que por outro motivo.
 */
export function selectBlitzPackPool<T>(
  packs: T[],
  options: {
    readLevel: (pack: T) => string | null | undefined
    userLevel: LearnerCefrLevel | null | undefined
    poolSize?: number
    random?: () => number
  }
): T[] {
  const poolSize = Math.max(0, Math.trunc(options.poolSize ?? BLITZ_PACK_POOL_SIZE))
  if (poolSize === 0) return []

  const random = options.random ?? Math.random
  const inScope = filterToLevelScope(packs, options.readLevel, options.userLevel)
  if (inScope.length === 0) return []

  const porNivel = new Map<LearnerCefrLevel, T[]>()
  for (const pack of inScope) {
    const level = normalizePackLevel(options.readLevel(pack))
    const bucket = porNivel.get(level)
    if (bucket) bucket.push(pack)
    else porNivel.set(level, [pack])
  }

  for (const bucket of porNivel.values()) {
    shuffle(bucket, random)
  }

  const plano = planBlitzAiLevels(poolSize, options.userLevel)
  const escolhidos: T[] = []

  for (const { level, count } of plano) {
    const bucket = porNivel.get(level)
    if (!bucket) continue
    escolhidos.push(...bucket.splice(0, count))
  }

  /**
   * Sobra de vagas quando um nível tem menos packs que a cota.
   *
   * Acontece o tempo todo num catálogo real — o A1 costuma ter menos coleções que o B1. Sem este
   * preenchimento a partida sairia menor do que devia justamente para quem tem menos material, que
   * é quem menos pode perder frase. Preenche do topo para baixo: o nível do aluno herda a sobra.
   */
  if (escolhidos.length < poolSize) {
    const doTopoParaBaixo = [...blitzLevelsInScope(options.userLevel)].reverse()
    for (const level of doTopoParaBaixo) {
      if (escolhidos.length >= poolSize) break
      const bucket = porNivel.get(level)
      if (!bucket?.length) continue
      escolhidos.push(...bucket.splice(0, poolSize - escolhidos.length))
    }
  }

  return escolhidos
}

/** Fisher-Yates no próprio array: os buckets são locais, ninguém observa a ordem original. */
function shuffle<T>(items: T[], random: () => number): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
}
