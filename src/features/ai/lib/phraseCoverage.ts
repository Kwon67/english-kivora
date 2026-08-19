/**
 * Cobertura do acervo: saber o que já existe antes de gerar mais.
 *
 * O gerador de IA sempre foi uma caixa de texto em branco — pedir "restaurante" duas vezes
 * produz as mesmas frases duas vezes, e foi assim que 12 frases repetidas entraram no banco.
 * Este módulo é a memória que faltava: normaliza cada frase, compara contra tudo que já está
 * cadastrado e separa o que é material realmente novo do que é repetição disfarçada.
 *
 * Lógica pura de propósito — roda sem banco e sem API, então pode ser testada de graça e
 * chamada tanto pelo salvamento de um deck quanto pela semeadura em lote.
 */

/** Acima disso, duas frases são o mesmo item de prática. Ver `phraseSimilarity`. */
export const NEAR_DUPLICATE_THRESHOLD = 0.8

/**
 * Reduz a frase à sua forma comparável: sem acento, sem pontuação, sem caixa, sem espaço dobrado.
 *
 * Contrações são preservadas de propósito. "I'm gonna" e "I am going to" são pontos de ensino
 * diferentes — o pack B2 de fala existe justamente para isso —, então expandir aqui apagaria
 * conteúdo legítimo.
 */
export function normalizePhrase(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenizePhrase(raw: string): string[] {
  const normalized = normalizePhrase(raw)
  return normalized ? normalized.split(' ') : []
}

/**
 * Semelhança de Jaccard sobre os tokens: interseção dividida pela união, de 0 a 1.
 *
 * Sem remover palavras funcionais. Em frases curtas de conversação a maior parte do sinal está
 * justamente nelas ("can I get that to go"), e descartá-las colapsaria frases que não têm
 * nada a ver uma com a outra.
 */
export function phraseSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenizePhrase(a))
  const tokensB = new Set(tokenizePhrase(b))

  if (tokensA.size === 0 || tokensB.size === 0) return 0

  let intersection = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1
  }

  return intersection / (tokensA.size + tokensB.size - intersection)
}

export function isNearDuplicate(a: string, b: string, threshold = NEAR_DUPLICATE_THRESHOLD): boolean {
  const normalizedA = normalizePhrase(a)
  const normalizedB = normalizePhrase(b)

  if (!normalizedA || !normalizedB) return false
  if (normalizedA === normalizedB) return true

  return phraseSimilarity(a, b) >= threshold
}

export type CoverageIndex = {
  /** Frases normalizadas, para o descarte imediato do que é idêntico. */
  exact: Set<string>
  /** Tokens de cada frase, pré-calculados para não retokenizar a cada comparação. */
  tokenSets: Set<string>[]
  size: number
}

export function buildCoverageIndex(existingPhrases: string[]): CoverageIndex {
  const exact = new Set<string>()
  const tokenSets: Set<string>[] = []

  for (const phrase of existingPhrases) {
    const normalized = normalizePhrase(phrase)
    if (!normalized || exact.has(normalized)) continue

    exact.add(normalized)
    tokenSets.push(new Set(normalized.split(' ')))
  }

  return { exact, tokenSets, size: exact.size }
}

/**
 * A frase já está coberta pelo acervo?
 *
 * O corte por tamanho antes de comparar não é microotimização: se a menor das duas frases tem
 * metade dos tokens da maior, a semelhança de Jaccard não pode passar de 0,5, então nem vale
 * contar a interseção. Isso mantém a semeadura em lote barata mesmo com milhares de frases.
 */
export function isCovered(
  phrase: string,
  index: CoverageIndex,
  threshold = NEAR_DUPLICATE_THRESHOLD
): boolean {
  const normalized = normalizePhrase(phrase)
  if (!normalized) return false
  if (index.exact.has(normalized)) return true

  const tokens = new Set(normalized.split(' '))
  if (tokens.size === 0) return false

  for (const existing of index.tokenSets) {
    const maior = Math.max(tokens.size, existing.size)
    const menor = Math.min(tokens.size, existing.size)
    if (menor / maior < threshold) continue

    let intersection = 0
    for (const token of tokens) {
      if (existing.has(token)) intersection += 1
    }

    if (intersection / (tokens.size + existing.size - intersection) >= threshold) return true
  }

  return false
}

export type CoverageCandidate = {
  en: string
  pt: string
}

export type CoverageSplit<T extends CoverageCandidate> = {
  /** Material novo de verdade, na ordem em que chegou. */
  fresh: T[]
  /** Descartadas por já existirem no acervo ou por repetirem outra do próprio lote. */
  rejected: Array<{ card: T; reason: 'catalogo' | 'lote' }>
}

/**
 * Separa um lote gerado em material novo e repetição.
 *
 * O índice cresce enquanto percorre: uma frase aprovada passa a bloquear as seguintes, senão
 * a IA poderia devolver a mesma frase três vezes no mesmo lote e as três entrariam.
 */
export function splitByCoverage<T extends CoverageCandidate>(
  candidates: T[],
  existingPhrases: string[],
  threshold = NEAR_DUPLICATE_THRESHOLD
): CoverageSplit<T> {
  const index = buildCoverageIndex(existingPhrases)
  const doLote = buildCoverageIndex([])
  const fresh: T[] = []
  const rejected: CoverageSplit<T>['rejected'] = []

  for (const card of candidates) {
    if (isCovered(card.en, index, threshold)) {
      rejected.push({ card, reason: 'catalogo' })
      continue
    }

    if (isCovered(card.en, doLote, threshold)) {
      rejected.push({ card, reason: 'lote' })
      continue
    }

    const normalized = normalizePhrase(card.en)
    doLote.exact.add(normalized)
    doLote.tokenSets.push(new Set(normalized.split(' ')))
    doLote.size += 1
    fresh.push(card)
  }

  return { fresh, rejected }
}

/**
 * As frases do acervo mais próximas de um tema, para caber no prompt.
 *
 * Mandar o catálogo inteiro como lista de proibição funciona com 200 frases e deixa de
 * funcionar com 5000 — o prompt estoura e o custo sobe a cada geração. Como a IA só tende a
 * repetir dentro do assunto pedido, basta mostrar a ela a vizinhança do tema: as frases que
 * dividem palavras com ele. As demais não correm risco de serem reinventadas.
 */
export function selectRelevantPhrases(topic: string, phrases: string[], limit = 60): string[] {
  const topicTokens = new Set(tokenizePhrase(topic))
  if (topicTokens.size === 0) return phrases.slice(0, limit)

  return phrases
    .map((phrase) => {
      const tokens = new Set(tokenizePhrase(phrase))
      let overlap = 0
      for (const token of tokens) {
        if (topicTokens.has(token)) overlap += 1
      }
      return { phrase, overlap }
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((entry) => entry.phrase)
}
