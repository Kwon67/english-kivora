export type SpeechScoreDetails = {
  similarity: number
  missingWords: string[]
  extraWords: string[]
}

export type SpeechScoreResult = SpeechScoreDetails & {
  score: number
  accepted: boolean
  normalizedExpected: string
  normalizedTranscript: string
}

const DEFAULT_ACCEPTANCE_THRESHOLD = 85

const CONTRACTION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bi'm\b/g, 'i am'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bthere's\b/g, 'there is'],
  [/\bwhat's\b/g, 'what is'],
  [/\blet's\b/g, 'let us'],
  [/\b([a-z]+)n't\b/g, '$1 not'],
  [/\b([a-z]+)'re\b/g, '$1 are'],
  [/\b([a-z]+)'ve\b/g, '$1 have'],
  [/\b([a-z]+)'ll\b/g, '$1 will'],
  [/\b([a-z]+)'d\b/g, '$1 would'],
  [/\b([a-z]+)'s\b/g, '$1 is'],
]

export function normalizeSpeechPhrase(phrase: string) {
  const lower = phrase
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const expanded = CONTRACTION_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    lower
  )

  return expanded
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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
      normalizedExpected,
      normalizedTranscript,
    }
  }

  if (transcriptWords.length === 0) {
    return {
      score: 0,
      accepted: false,
      similarity: 0,
      missingWords: expectedWords,
      extraWords: [],
      normalizedExpected,
      normalizedTranscript,
    }
  }

  const { distance, operations } = alignWords(expectedWords, transcriptWords)
  const denominator = Math.max(expectedWords.length, transcriptWords.length, 1)
  const similarity = Math.max(0, Math.min(1, 1 - distance / denominator))
  const score = Math.max(0, Math.min(100, Math.round(similarity * 100)))
  const missingWords: string[] = []
  const extraWords: string[] = []

  operations.forEach((operation) => {
    if (operation.type === 'delete') {
      missingWords.push(operation.expected)
    } else if (operation.type === 'insert') {
      extraWords.push(operation.transcript)
    } else if (operation.type === 'substitute') {
      missingWords.push(operation.expected)
      extraWords.push(operation.transcript)
    }
  })

  return {
    score,
    accepted: score >= acceptanceThreshold,
    similarity,
    missingWords,
    extraWords,
    normalizedExpected,
    normalizedTranscript,
  }
}
