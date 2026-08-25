export type SpeechScoreDetails = {
  similarity: number
  missingWords: string[]
  extraWords: string[]
  alignment: SpeechScoreAlignment
}

export type SpeechSubstitution = {
  expected: string
  transcript: string
}

export type SpeechScoreResult = SpeechScoreDetails & {
  score: number
  accepted: boolean
  normalizedExpected: string
  normalizedTranscript: string
  /**
   * `missingWords`/`extraWords` juntam deleção e substituição num balde só, o que serve para
   * mostrar na tela mas não para decidir acerto: omitir "the" e trocar "Friday" por "Monday"
   * chegam iguais lá. Estes três campos separam os casos para quem precisa julgar.
   */
  deletedWords: string[]
  insertedWords: string[]
  substitutedWords: SpeechSubstitution[]
}

export type SpeechWordAlignment = {
  word: string
  isCorrect: boolean
}

export type SpeechScoreAlignment = {
  expected: SpeechWordAlignment[]
  transcript: SpeechWordAlignment[]
}

export const DEFAULT_ACCEPTANCE_THRESHOLD = 100

const CONTRACTION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bi'm\b/g, 'i am'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bthere's\b/g, 'there is'],
  [/\bwhat's\b/g, 'what is'],
  [/\blet's\b/g, 'let us'],
  [/\bgonna\b/g, 'going to'],
  [/\bwanna\b/g, 'want to'],
  [/\bgotta\b/g, 'got to'],
  [/\bgimme\b/g, 'give me'],
  [/\blemme\b/g, 'let me'],
  [/\bkinda\b/g, 'kind of'],
  [/\boutta\b/g, 'out of'],
  [/\b([a-z]+)n't\b/g, '$1 not'],
  [/\b([a-z]+)'re\b/g, '$1 are'],
  [/\b([a-z]+)'ve\b/g, '$1 have'],
  [/\b([a-z]+)'ll\b/g, '$1 will'],
  [/\b([a-z]+)'d\b/g, '$1 would'],
  [/\b([a-z]+)'s\b/g, '$1 is'],
]

/**
 * Número por extenso vira dígito.
 *
 * O reconhecedor devolve "2" onde o card escreveu "two", e a comparação palavra a palavra
 * marcava a frase como errada — punindo quem falou certo. Como os dois lados passam por aqui,
 * basta convergir para uma forma só; qual das duas é indiferente.
 *
 * Ordinal fica em "1st" em vez de virar "1": juntar "first" com "one" apagaria uma diferença
 * real entre duas frases distintas, que é exatamente o que este arquivo existe para detectar.
 */
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
}

const TENS_WORDS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

const ORDINAL_WORDS: Record<string, string> = {
  first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th', sixth: '6th',
  seventh: '7th', eighth: '8th', ninth: '9th', tenth: '10th', eleventh: '11th', twelfth: '12th',
  thirteenth: '13th', fourteenth: '14th', fifteenth: '15th', sixteenth: '16th',
  seventeenth: '17th', eighteenth: '18th', nineteenth: '19th', twentieth: '20th',
  thirtieth: '30th',
}

function convertNumberWords(tokens: string[]): string[] {
  const output: string[] = []
  let index = 0

  while (index < tokens.length) {
    const token = tokens[index]
    const ordinal = ORDINAL_WORDS[token]

    if (ordinal) {
      output.push(ordinal)
      index += 1
      continue
    }

    if (token in TENS_WORDS) {
      // "twenty five" é um número só, não dois. Sem juntar, o ASR devolvendo "25" viraria erro.
      const unit = NUMBER_WORDS[tokens[index + 1]]
      if (unit !== undefined && unit >= 1 && unit <= 9) {
        output.push(String(TENS_WORDS[token] + unit))
        index += 2
        continue
      }

      output.push(String(TENS_WORDS[token]))
      index += 1
      continue
    }

    if (token in NUMBER_WORDS) {
      const next = tokens[index + 1]
      if (next === 'hundred' || next === 'thousand') {
        output.push(String(NUMBER_WORDS[token] * (next === 'hundred' ? 100 : 1000)))
        index += 2
        continue
      }

      output.push(String(NUMBER_WORDS[token]))
      index += 1
      continue
    }

    if (token === 'hundred' || token === 'thousand') {
      const previous = output[output.length - 1]
      if (previous === 'a' || previous === 'an') {
        output[output.length - 1] = token === 'hundred' ? '100' : '1000'
        index += 1
        continue
      }
    }

    output.push(token)
    index += 1
  }

  return output
}

export function normalizeSpeechPhrase(phrase: string) {
  let lower = phrase
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’´`]/g, "'")
    .trim()

  lower = lower
    .replace(/\b(\d+):00\b/g, '$1')
    .replace(/\ba\.m\.?/g, 'am')
    .replace(/\bp\.m\.?/g, 'pm')

  const expanded = CONTRACTION_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    lower
  )

  const cleaned = expanded
    .replace(/(\d)(st|nd|rd|th)\b/g, '$1$2')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return ''

  return convertNumberWords(cleaned.split(' ')).join(' ')
}

function tokenize(phrase: string) {
  const normalized = normalizeSpeechPhrase(phrase)
  return normalized ? normalized.split(' ') : []
}

type EditOperation =
  | { type: 'match'; expected: string; transcript: string }
  | { type: 'substitute'; expected: string; transcript: string }
  | { type: 'delete'; expected: string }
  | { type: 'insert'; transcript: string }

function alignWords(expectedWords: string[], transcriptWords: string[]) {
  const rows = expectedWords.length + 1
  const columns = transcriptWords.length + 1
  const distances: number[][] = Array.from({ length: rows }, () => Array(columns).fill(0))

  for (let row = 0; row < rows; row += 1) distances[row][0] = row
  for (let column = 0; column < columns; column += 1) distances[0][column] = column

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitutionCost = expectedWords[row - 1] === transcriptWords[column - 1] ? 0 : 1
      distances[row][column] = Math.min(
        distances[row - 1][column] + 1,
        distances[row][column - 1] + 1,
        distances[row - 1][column - 1] + substitutionCost
      )
    }
  }

  const operations: EditOperation[] = []
  let row = expectedWords.length
  let column = transcriptWords.length

  while (row > 0 || column > 0) {
    if (row > 0 && column > 0) {
      const substitutionCost = expectedWords[row - 1] === transcriptWords[column - 1] ? 0 : 1
      if (distances[row][column] === distances[row - 1][column - 1] + substitutionCost) {
        operations.push(
          substitutionCost === 0
            ? { type: 'match', expected: expectedWords[row - 1], transcript: transcriptWords[column - 1] }
            : { type: 'substitute', expected: expectedWords[row - 1], transcript: transcriptWords[column - 1] }
        )
        row -= 1
        column -= 1
        continue
      }
    }

    if (row > 0 && distances[row][column] === distances[row - 1][column] + 1) {
      operations.push({ type: 'delete', expected: expectedWords[row - 1] })
      row -= 1
      continue
    }

    if (column > 0) {
      operations.push({ type: 'insert', transcript: transcriptWords[column - 1] })
      column -= 1
    }
  }

  operations.reverse()
  return { distance: distances[expectedWords.length][transcriptWords.length], operations }
}

function buildWordAlignment(operations: EditOperation[]): SpeechScoreAlignment {
  const expected: SpeechWordAlignment[] = []
  const transcript: SpeechWordAlignment[] = []

  operations.forEach((operation) => {
    if (operation.type === 'match') {
      expected.push({ word: operation.expected, isCorrect: true })
      transcript.push({ word: operation.transcript, isCorrect: true })
    } else if (operation.type === 'substitute') {
      expected.push({ word: operation.expected, isCorrect: false })
      transcript.push({ word: operation.transcript, isCorrect: false })
    } else if (operation.type === 'delete') {
      expected.push({ word: operation.expected, isCorrect: false })
    } else {
      transcript.push({ word: operation.transcript, isCorrect: false })
    }
  })

  return { expected, transcript }
}

function buildEmptyAlignment(expectedWords: string[], transcriptWords: string[]): SpeechScoreAlignment {
  return {
    expected: expectedWords.map((word) => ({ word, isCorrect: false })),
    transcript: transcriptWords.map((word) => ({ word, isCorrect: false })),
  }
}

export function scoreSpeechTranscript(
  expectedPhrase: string,
  transcript: string,
  acceptanceThreshold = DEFAULT_ACCEPTANCE_THRESHOLD
): SpeechScoreResult {
  const normalizedExpected = normalizeSpeechPhrase(expectedPhrase)
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  const expectedWords = tokenize(expectedPhrase)
  const transcriptWords = tokenize(transcript)

  if (expectedWords.length === 0) {
    const score = transcriptWords.length === 0 ? 100 : 0
    return {
      score,
      accepted: score >= acceptanceThreshold,
      similarity: score / 100,
      missingWords: [],
      extraWords: transcriptWords,
      alignment: buildEmptyAlignment(expectedWords, transcriptWords),
      normalizedExpected,
      normalizedTranscript,
      deletedWords: [],
      insertedWords: transcriptWords,
      substitutedWords: [],
    }
  }

  if (transcriptWords.length === 0) {
    return {
      score: 0,
      accepted: false,
      similarity: 0,
      missingWords: expectedWords,
      extraWords: [],
      alignment: buildEmptyAlignment(expectedWords, transcriptWords),
      normalizedExpected,
      normalizedTranscript,
      deletedWords: expectedWords,
      insertedWords: [],
      substitutedWords: [],
    }
  }

  const { distance, operations } = alignWords(expectedWords, transcriptWords)
  const denominator = Math.max(expectedWords.length, transcriptWords.length, 1)
  const similarity = Math.max(0, Math.min(1, 1 - distance / denominator))
  const score = Math.max(0, Math.min(100, Math.round(similarity * 100)))
  const missingWords: string[] = []
  const extraWords: string[] = []
  const deletedWords: string[] = []
  const insertedWords: string[] = []
  const substitutedWords: SpeechSubstitution[] = []

  operations.forEach((operation) => {
    if (operation.type === 'delete') {
      missingWords.push(operation.expected)
      deletedWords.push(operation.expected)
    } else if (operation.type === 'insert') {
      extraWords.push(operation.transcript)
      insertedWords.push(operation.transcript)
    } else if (operation.type === 'substitute') {
      missingWords.push(operation.expected)
      extraWords.push(operation.transcript)
      substitutedWords.push({ expected: operation.expected, transcript: operation.transcript })
    }
  })

  return {
    score,
    accepted: score >= acceptanceThreshold,
    similarity,
    missingWords,
    extraWords,
    alignment: buildWordAlignment(operations),
    normalizedExpected,
    normalizedTranscript,
    deletedWords,
    insertedWords,
    substitutedWords,
  }
}

export function isSpeechTranscriptReadyForEvaluation(
  expectedPhrase: string,
  transcript: string,
  acceptanceThreshold = DEFAULT_ACCEPTANCE_THRESHOLD
) {
  const result = scoreSpeechTranscript(expectedPhrase, transcript, acceptanceThreshold)

  if (!result.normalizedTranscript) return false
  if (result.accepted) return true

  return result.alignment.transcript.length >= Math.max(1, Math.ceil(result.alignment.expected.length * 0.85))
}
