/**
 * Corretor da resposta em português no modo de digitação (EN → PT).
 *
 * A versão anterior aprovava por SUBSTRING ou por 60% das palavras de conteúdo. Medido contra o
 * catálogo inteiro: 253/253 frases com negação eram aceitas SEM a negação ("Eu não sei" ← "Eu
 * sei"), 294/294 com o sujeito trocado (eu ↔ você) e 1912/1912 com a última palavra cortada. Ou
 * seja: confete e acerto no SRS para uma resposta que dizia o contrário da frase.
 *
 * A regra agora é a mesma do corretor de fala (`speech-scoring.ts`), que já era rigoroso: alinhar
 * palavra a palavra e perguntar QUAIS diferem, não quantas. Cada palavra de conteúdo esperada
 * precisa aparecer — igual, como apelido conhecido, ou com um erro de digitação pequeno —, e uma
 * palavra de polaridade (não, nunca, nada…) nunca é opcional nem tolera erro de digitação, porque
 * é exatamente ela que inverte o sentido.
 *
 * O que continua flexível, de propósito: acento e pontuação; artigos e preposições dos dois
 * lados; sujeito OMITIDO ("Não sei" vale por "Eu não sei" — português deixa o pronome cair), mas
 * sujeito TROCADO não ("Você não sei" ≠ "Eu não sei"); e apelidos coloquiais (tá/está, vc/você).
 */

const PORTUGUESE_FILLER_WORDS = new Set([
  'a',
  'as',
  'ao',
  'aos',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'por',
  'pra',
  'pro',
  'um',
  'uma',
  'uns',
  'umas',
])

/**
 * Palavras que invertem ou negam o sentido. Nunca são opcionais, nunca casam por aproximação, e
 * uma a mais ou a menos entre resposta e gabarito reprova sozinha.
 */
const POLARITY_WORDS = new Set(['nao', 'nunca', 'nada', 'ninguem', 'jamais', 'nem', 'nenhum', 'nenhuma', 'sem', 'sim'])

/**
 * Sujeito pode ser omitido de um dos lados (português deixa o pronome cair), mas se os dois lados
 * têm sujeito e ele difere, é outra frase: "I need more time" não vira "Você preciso de mais tempo".
 */
const SUBJECT_PRONOUNS = new Set(['eu', 'voce', 'voces', 'vc', 'tu', 'ele', 'ela', 'nohs', 'eles', 'elas', 'gente'])

/**
 * Depois de preposição o pronome é OBJETO ("com você", "para ele") e faz parte do sentido: "Eu
 * concordo com" não é "Eu concordo com você". Só o pronome em posição de sujeito pode cair.
 */
const OBJECT_MARKING_PREPOSITIONS = new Set(['com', 'de', 'para', 'pra', 'pro', 'em', 'a', 'ao', 'sem', 'por', 'sobre', 'entre', 'contra'])

const PORTUGUESE_PHRASE_ALIAS_GROUPS = [
  ['com licenca', 'licenca', 'desculpe', 'desculpa', 'perdao'],
  ['oi', 'ola'],
  ['tchau', 'adeus', 'ate logo', 'ate mais'],
  ['por favor', 'faz favor'],
  ['obrigado', 'obrigada', 'valeu'],
  ['como vai', 'como esta', 'como voce esta', 'como vai voce', 'tudo bem', 'beleza'],
]

/**
 * Apelidos que são a MESMA palavra em outro registro. A lista antiga juntava "está", "vai" e "bem"
 * num grupo só, e "te" com "você" — isso fazia "Ela vai" valer por "Ela está bem".
 */
const PORTUGUESE_TOKEN_ALIAS_GROUPS = [
  ['esta', 'ta'],
  ['estou', 'to'],
  ['voce', 'vc', 'tu'],
  ['oi', 'ola'],
  ['obrigado', 'obrigada', 'valeu'],
  ['pra', 'para'],
  // "é"/"nós" viram "eh"/"nohs" na normalização; quem digita sem acento manda "e"/"nos". Só entram
  // em jogo quando um dos lados tem a forma acentuada (ver `judgeContent`).
  ['eh', 'e'],
  ['nohs', 'nos'],
]

/**
 * Palavras cujo acento é a única coisa que as separa de um filler: "é" (verbo) de "e" (conjunção),
 * "nós" (pronome) de "nos" (em + os). Ganham uma grafia própria ANTES de tirar os acentos.
 */
const ACCENT_SENSITIVE_WORDS: Array<[RegExp, string]> = [
  [/(^|[^\p{L}])é(?=[^\p{L}]|$)/giu, '$1eh'],
  [/(^|[^\p{L}])nós(?=[^\p{L}]|$)/giu, '$1nohs'],
]
const BARE_FORMS: Record<string, string> = { eh: 'e', nohs: 'nos' }

export type TranslationMatchKind = 'exact' | 'equivalent' | 'close' | 'wrong'

/**
 * Distância de edição com transposição (Damerau/OSA): trocar duas letras de lugar ("qeuro") conta
 * como UM erro de digitação, que é o que ele é no teclado.
 */
function editDistance(a: string, b: string): number {
  const rows = a.length + 1
  const columns = b.length + 1
  const d: number[][] = Array.from({ length: rows }, () => Array<number>(columns).fill(0))

  for (let i = 0; i < rows; i++) d[i][0] = i
  for (let j = 0; j < columns; j++) d[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < columns; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }

  return d[a.length][b.length]
}

export function normalizeTranslationText(value: string): string {
  return ACCENT_SENSITIVE_WORDS.reduce((text, [pattern, marker]) => text.replace(pattern, marker), value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9\s/|;(),-]/g, ' ')
    .replace(/[-/|;(),]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Um gabarito pode listar alternativas separadas por "/" ou "|" ("Com licença / Desculpe").
 *
 * ";" e " ou " NÃO separam mais: "Desculpe, não entendi; pode repetir?" virava dois gabaritos, e
 * "Você fala português ou inglês?" aceitava só "inglês" como resposta exata.
 */
function buildTranslationVariants(value: string): string[] {
  const sources = new Set<string>([
    value,
    value.replace(/\([^)]*\)/g, ' '),
  ])
  const variants = new Set<string>()

  for (const source of sources) {
    const normalizedSource = normalizeTranslationText(source)
    if (normalizedSource) variants.add(normalizedSource)

    for (const part of source.split(/\s*(?:\/|\|)\s*/)) {
      const normalizedPart = normalizeTranslationText(part)
      if (normalizedPart) variants.add(normalizedPart)
    }
  }

  return [...variants]
}

/**
 * Gera as variantes que um grupo de apelidos autoriza: se o gabarito contém "como você está", a
 * resposta pode trazer "como vai você" ou "tudo bem" no lugar. A troca respeita fronteira de
 * palavra ("oi" não casa dentro de "oito") e vale como EQUIVALENTE, nunca como exata.
 */
function expandPhraseAliases(variants: string[]): string[] {
  const expanded = new Set<string>()

  for (const variant of variants) {
    for (const group of PORTUGUESE_PHRASE_ALIAS_GROUPS) {
      for (const member of group) {
        const pattern = new RegExp(`(^|\\s)${member}(?=\\s|$)`, 'g')
        if (!pattern.test(variant)) continue

        for (const replacement of group) {
          if (replacement === member) continue
          expanded.add(variant.replace(pattern, `$1${replacement}`).replace(/\s+/g, ' ').trim())
        }
      }
    }
  }

  for (const variant of variants) expanded.delete(variant)
  return [...expanded]
}

function tokenize(value: string): string[] {
  return normalizeTranslationText(value).split(' ').filter(Boolean)
}

function isPolarity(token: string) {
  return POLARITY_WORDS.has(token)
}

function isSubject(token: string) {
  return SUBJECT_PRONOUNS.has(token)
}

type ContentToken = {
  text: string
  /** Pronome em posição de sujeito: pode faltar de um lado sem mudar a frase. */
  droppable: boolean
}

/**
 * Palavras que carregam sentido: tudo que não é artigo/preposição/conjunção. O pronome só é
 * dispensável quando está em posição de sujeito — não depois de preposição, não no fim da frase.
 */
function contentTokens(tokens: string[], keepBare: Set<string> = new Set()): ContentToken[] {
  const result: ContentToken[] = []
  tokens.forEach((token, index) => {
    if (PORTUGUESE_FILLER_WORDS.has(token) && !keepBare.has(token)) return
    const previous = tokens[index - 1]
    const isLast = index === tokens.length - 1
    const droppable =
      isSubject(token) && !isLast && !(previous !== undefined && OBJECT_MARKING_PREPOSITIONS.has(previous))
    result.push({ text: token, droppable })
  })
  return result
}

function shareTokenAlias(left: string, right: string): boolean {
  if (left === right) return true

  return PORTUGUESE_TOKEN_ALIAS_GROUPS.some(
    (group) => group.includes(left) && group.includes(right)
  )
}

/**
 * Quanto erro de digitação uma palavra tolera.
 *
 * Palavras curtas não toleram nenhum: com 4 letras, uma troca já é outra palavra ("casa"/"cama",
 * "fome"/"sono", "pode"/"deve"). A partir de 5, uma letra; a partir de 8, duas. Polaridade e
 * sujeito nunca toleram — são as palavras que mudam quem faz o quê e se faz ou não.
 */
function maxTypoDistance(token: string): number {
  if (isPolarity(token) || isSubject(token)) return 0
  if (token.length < 5) return 0
  if (token.length < 8) return 1
  return 2
}

type TokenMatch = 'exact' | 'typo' | 'none'

function matchToken(inputToken: string, correctToken: string): TokenMatch {
  if (shareTokenAlias(inputToken, correctToken)) return 'exact'

  const allowed = Math.min(maxTypoDistance(inputToken), maxTypoDistance(correctToken))
  if (allowed === 0) return 'none'

  return editDistance(inputToken, correctToken) <= allowed ? 'typo' : 'none'
}

type AlignmentOp =
  | { type: 'match'; expected: ContentToken; input: ContentToken; how: TokenMatch }
  | { type: 'substitute'; expected: ContentToken; input: ContentToken }
  | { type: 'delete'; expected: ContentToken }
  | { type: 'insert'; input: ContentToken }

/**
 * Alinhamento palavra a palavra (Levenshtein sobre tokens), igual ao do corretor de fala.
 * A saída diz o que faltou, o que sobrou e o que foi trocado — é isso que decide o acerto.
 */
function alignTokens(expected: ContentToken[], input: ContentToken[]): AlignmentOp[] {
  const rows = expected.length + 1
  const columns = input.length + 1
  const cost: number[][] = Array.from({ length: rows }, () => Array<number>(columns).fill(0))
  const how: TokenMatch[][] = Array.from({ length: rows }, () => Array<TokenMatch>(columns).fill('none'))

  for (let row = 0; row < rows; row += 1) cost[row][0] = row
  for (let column = 0; column < columns; column += 1) cost[0][column] = column

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const match = matchToken(input[column - 1].text, expected[row - 1].text)
      how[row][column] = match
      const substitutionCost = match === 'none' ? 1 : 0
      cost[row][column] = Math.min(
        cost[row - 1][column] + 1,
        cost[row][column - 1] + 1,
        cost[row - 1][column - 1] + substitutionCost
      )
    }
  }

  const ops: AlignmentOp[] = []
  let row = expected.length
  let column = input.length

  while (row > 0 || column > 0) {
    if (row > 0 && column > 0) {
      const match = how[row][column]
      const substitutionCost = match === 'none' ? 1 : 0
      if (cost[row][column] === cost[row - 1][column - 1] + substitutionCost) {
        ops.push(
          match === 'none'
            ? { type: 'substitute', expected: expected[row - 1], input: input[column - 1] }
            : { type: 'match', expected: expected[row - 1], input: input[column - 1], how: match }
        )
        row -= 1
        column -= 1
        continue
      }
    }

    if (row > 0 && cost[row][column] === cost[row - 1][column] + 1) {
      ops.push({ type: 'delete', expected: expected[row - 1] })
      row -= 1
      continue
    }

    if (column > 0) {
      ops.push({ type: 'insert', input: input[column - 1] })
      column -= 1
    }
  }

  return ops.reverse()
}

type ContentVerdict = 'exact' | 'typo' | 'wrong'

/**
 * Decide o acerto olhando QUAIS palavras de conteúdo diferem.
 *
 * Reprova: qualquer palavra de conteúdo faltando ou trocada; qualquer palavra de polaridade a mais
 * ou a menos; sujeito presente dos dois lados e diferente. Tolera: sujeito omitido de um lado,
 * artigos e preposições, e erro de digitação pequeno em palavra longa (vira "typo", não "exact").
 */
function judgeContent(input: string, correct: string): ContentVerdict {
  const inputRaw = tokenize(input)
  const correctRaw = tokenize(correct)
  // Se algum lado tem "é"/"nós" (marcados "eh"/"nohs"), o "e"/"nos" solto do outro lado pode ser a
  // mesma palavra digitada sem acento — então deixa de ser filler nos DOIS lados e casa por apelido.
  const keepBare = new Set<string>()
  for (const [marker, bare] of Object.entries(BARE_FORMS)) {
    if (inputRaw.includes(marker) || correctRaw.includes(marker)) keepBare.add(bare)
  }
  const inputTokens = contentTokens(inputRaw, keepBare)
  const correctTokens = contentTokens(correctRaw, keepBare)

  if (!inputTokens.length || !correctTokens.length) return 'wrong'

  // Polaridade é checada como conjunto ANTES do alinhamento: "Não, obrigado" vs "Sim, obrigado"
  // tem uma polaridade trocada, e isso reprova independentemente de como o resto casa.
  const inputPolarity = inputTokens.map((token) => token.text).filter(isPolarity).sort().join(' ')
  const correctPolarity = correctTokens.map((token) => token.text).filter(isPolarity).sort().join(' ')
  if (inputPolarity !== correctPolarity) return 'wrong'

  let hadTypo = false

  for (const op of alignTokens(correctTokens, inputTokens)) {
    if (op.type === 'match') {
      if (op.how === 'typo') hadTypo = true
      continue
    }

    if (op.type === 'substitute') {
      // Sujeito trocado por sujeito é outra frase. Sujeito trocado por palavra de conteúdo
      // também reprova (a palavra de conteúdo esperada não apareceu).
      return 'wrong'
    }

    if (op.type === 'delete') {
      // Português omite o sujeito à vontade; qualquer outra palavra de conteúdo faltando é erro.
      if (op.expected.droppable) continue
      return 'wrong'
    }

    // insert: uma palavra a mais. Sujeito explícito onde o gabarito omitiu é normal;
    // qualquer outra palavra a mais muda a frase.
    if (op.input.droppable) continue
    return 'wrong'
  }

  return hadTypo ? 'typo' : 'exact'
}

/**
 * Verdadeiro quando as duas frases dizem a mesma coisa: todas as palavras de conteúdo presentes
 * (aceitando apelido e erro de digitação pequeno), mesma polaridade, mesmo sujeito quando ambos
 * o declaram. Mantido como API pública por compatibilidade; `classifyTranslationAnswer` é a
 * porta de entrada do modo de digitação.
 */
export function areTranslationsEquivalent(input: string, correct: string): boolean {
  const normalizedInput = normalizeTranslationText(input)
  const normalizedCorrect = normalizeTranslationText(correct)

  if (!normalizedInput || !normalizedCorrect) return false
  if (normalizedInput === normalizedCorrect) return true

  const candidates = [normalizedCorrect, ...expandPhraseAliases([normalizedCorrect])]
  return candidates.some((candidate) => judgeContent(normalizedInput, candidate) !== 'wrong')
}

export function classifyTranslationAnswer(
  input: string,
  acceptedAnswers: string[]
): TranslationMatchKind {
  const normalizedInput = normalizeTranslationText(input)
  if (!normalizedInput) return 'wrong'

  const variants = acceptedAnswers.flatMap((answer) => buildTranslationVariants(answer))

  if (variants.some((variant) => normalizedInput === variant)) {
    return 'exact'
  }

  const candidates = [...variants, ...expandPhraseAliases(variants)]
  const verdicts = candidates.map((candidate) => judgeContent(normalizedInput, candidate))

  // Mesmas palavras, só com apelido coloquial ou sujeito omitido: vale como resposta certa.
  if (verdicts.includes('exact')) {
    return 'equivalent'
  }

  // Todas as palavras certas mas com erro de digitação: passa, sinalizado como "quase".
  if (verdicts.includes('typo')) {
    return 'close'
  }

  return 'wrong'
}

export function isAcceptedTranslationAnswer(
  input: string,
  acceptedAnswers: string[]
): boolean {
  const result = classifyTranslationAnswer(input, acceptedAnswers)
  return result === 'exact' || result === 'equivalent'
}
