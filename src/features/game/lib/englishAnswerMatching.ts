import { normalizeSpeechPhrase, scoreSpeechTranscript } from '@/features/game/lib/speech-scoring'

/**
 * Corretor da frase em INGLÊS digitada a partir do português (produção, PT → EN).
 *
 * Até aqui nenhum modo pedia isso: múltipla escolha, flashcard e digitação mostravam o inglês e
 * cobravam o português; escuta era ditado; fala era leitura em voz alta. O intervalo do SRS media
 * se a pessoa ENTENDIA a frase, nunca se conseguia dizê-la. Este é o corretor do modo que fecha
 * essa lacuna.
 *
 * Reaproveita o alinhamento palavra a palavra do corretor de fala, que já resolve o que mais
 * importa aqui: contrações ("I don't" = "I do not"), números por extenso e pontuação. Em cima
 * disso, a régua da escrita:
 * - exato: a mesma frase depois de normalizar;
 * - quase: as palavras certas com erro de digitação pequeno em palavra longa, ou UM artigo (a/an/
 *   the) a mais ou a menos. Passa raspando: conta como "Difícil" na revisão, não como acerto;
 * - errado: qualquer palavra de conteúdo faltando, sobrando ou trocada. "Monday" por "Friday"
 *   é errado com uma só palavra — a régua é QUAL palavra, não quantas.
 */
export type EnglishAnswerMatchKind = 'exact' | 'partial' | 'wrong'

const ARTICLES = new Set(['a', 'an', 'the'])
const MAX_ARTICLE_SLIPS = 1

/** Palavras que nunca aceitam aproximação: trocar uma letra nelas vira OUTRA palavra ou inverte a frase. */
const NO_TYPO_WORDS = new Set([
  'not', 'no', 'never', 'nothing', 'nobody', 'none', 'nor', 'neither',
  'yes', 'do', 'did', 'does', 'is', 'are', 'was', 'were', 'am', 'be',
  'can', 'cannot', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'he', 'she', 'it', 'we', 'you', 'they', 'i', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their', 'this', 'that', 'these', 'those',
  'in', 'on', 'at', 'to', 'of', 'for', 'from', 'by', 'with', 'up', 'down', 'out', 'off',
])

/** Damerau/OSA: transposição de duas letras é UM erro de teclado. */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) d[i][0] = i
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

function maxTypoDistance(word: string): number {
  if (NO_TYPO_WORDS.has(word)) return 0
  if (word.length < 5) return 0
  if (word.length < 8) return 1
  return 2
}

function isTypoOf(typed: string, expected: string): boolean {
  const allowed = Math.min(maxTypoDistance(typed), maxTypoDistance(expected))
  if (allowed === 0) return false
  return editDistance(typed, expected) <= allowed
}

export function matchEnglishAnswer(input: string, expectedPhrase: string): EnglishAnswerMatchKind {
  const normalizedInput = normalizeSpeechPhrase(input)
  const normalizedExpected = normalizeSpeechPhrase(expectedPhrase)
  if (!normalizedInput || !normalizedExpected) return 'wrong'
  if (normalizedInput === normalizedExpected) return 'exact'

  const result = scoreSpeechTranscript(expectedPhrase, input)

  // Artigo a menos, a mais ou trocado por outro artigo ("a" ↔ "the"): deslize, não erro.
  const isArticleSwap = (pair: { expected: string; transcript: string }) =>
    ARTICLES.has(pair.expected) && ARTICLES.has(pair.transcript)
  const articleSlips =
    result.deletedWords.filter((word) => ARTICLES.has(word)).length +
    result.insertedWords.filter((word) => ARTICLES.has(word)).length +
    result.substitutedWords.filter(isArticleSwap).length

  const contentMissing = result.deletedWords.some((word) => !ARTICLES.has(word))
  const contentExtra = result.insertedWords.some((word) => !ARTICLES.has(word))
  if (contentMissing || contentExtra || articleSlips > MAX_ARTICLE_SLIPS) return 'wrong'

  const allSubstitutionsAreTypos = result.substitutedWords.every(
    (pair) => isArticleSwap(pair) || isTypoOf(pair.transcript, pair.expected)
  )
  if (!allSubstitutionsAreTypos) return 'wrong'

  return 'partial'
}
