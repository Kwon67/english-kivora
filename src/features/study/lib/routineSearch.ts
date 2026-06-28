export type RoutineSearchCard = {
  english_phrase?: string | null
  portuguese_translation?: string | null
  accepted_translations?: string[] | null
}

export type RoutineSearchAssignment = {
  id: string
  pack_id: string
  game_mode: string
  packs: {
    name?: string | null
    description?: string | null
    category?: string | null
    level?: string | null
  } | null
  searchCards?: RoutineSearchCard[]
}

type SearchField = {
  text: string
  weight: number
}

const MIN_FUZZY_TOKEN_LENGTH = 4

export function normalizeRoutineSearchText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function tokenize(value: string) {
  return normalizeRoutineSearchText(value)
    .split(' ')
    .filter((token) => token.length > 0)
}

function acronymFor(words: string[]) {
  return words.map((word) => word[0]).join('')
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  const current = Array.from({ length: b.length + 1 }, () => 0)

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      )
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[b.length]
}

function fuzzyTokenScore(queryToken: string, words: string[]) {
  let best = 0

  for (const word of words) {
    if (word === queryToken) best = Math.max(best, 24)
    else if (word.startsWith(queryToken)) best = Math.max(best, 18)
    else if (word.includes(queryToken)) best = Math.max(best, 12)
    else if (
      queryToken.length >= MIN_FUZZY_TOKEN_LENGTH &&
      word.length >= MIN_FUZZY_TOKEN_LENGTH &&
      levenshteinDistance(queryToken, word) <= (queryToken.length <= 6 ? 1 : 2)
    ) {
      best = Math.max(best, 8)
    }
  }

  return best
}

function scoreField(field: SearchField, normalizedQuery: string, queryTokens: string[]) {
  const normalizedText = normalizeRoutineSearchText(field.text)
  if (!normalizedText) return 0

  const words = normalizedText.split(' ')
  let score = 0

  if (normalizedText === normalizedQuery) score += 150
  else if (normalizedText.includes(normalizedQuery)) score += 95

  const acronym = acronymFor(words)
  if (acronym === normalizedQuery) score += 70
  else if (acronym.startsWith(normalizedQuery)) score += 42

  let matchedTokens = 0
  for (const token of queryTokens) {
    const tokenScore = fuzzyTokenScore(token, words)
    if (tokenScore > 0) matchedTokens += 1
    score += tokenScore
  }

  if (queryTokens.length > 1 && matchedTokens === queryTokens.length) {
    score += 55
  }

  return score * field.weight
}

function getSearchFields(assignment: RoutineSearchAssignment): SearchField[] {
  const cards = assignment.searchCards || []

  return [
    { text: assignment.packs?.name || '', weight: 1.4 },
    { text: assignment.packs?.category || '', weight: 1.2 },
    { text: assignment.packs?.description || '', weight: 0.8 },
    { text: assignment.packs?.level || '', weight: 0.75 },
    { text: assignment.game_mode, weight: 0.6 },
    ...cards.flatMap((card) => [
      { text: card.english_phrase || '', weight: 1 },
      { text: card.portuguese_translation || '', weight: 1 },
      { text: (card.accepted_translations || []).join(' '), weight: 0.85 },
    ]),
  ]
}

export function getRoutineSearchScore(
  assignment: RoutineSearchAssignment,
  query: string
) {
  const normalizedQuery = normalizeRoutineSearchText(query)
  if (!normalizedQuery) return 0

  const queryTokens = tokenize(normalizedQuery)
  if (queryTokens.length === 0) return 0

  return getSearchFields(assignment).reduce(
    (total, field) => total + scoreField(field, normalizedQuery, queryTokens),
    0
  )
}

export function getRoutinePackNameSearchScore(
  assignment: RoutineSearchAssignment,
  query: string
) {
  const normalizedQuery = normalizeRoutineSearchText(query)
  if (!normalizedQuery) return 0

  const queryTokens = tokenize(normalizedQuery)
  if (queryTokens.length === 0) return 0

  return scoreField(
    { text: assignment.packs?.name || '', weight: 1 },
    normalizedQuery,
    queryTokens
  )
}

export function filterRoutineAssignmentsBySmartQuery<T extends RoutineSearchAssignment>(
  assignments: T[],
  query: string
) {
  const normalizedQuery = normalizeRoutineSearchText(query)
  if (!normalizedQuery) return assignments

  return assignments
    .map((assignment, index) => ({
      assignment,
      index,
      score: getRoutineSearchScore(assignment, normalizedQuery),
      nameScore: getRoutinePackNameSearchScore(assignment, normalizedQuery),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.nameScore - a.nameScore || b.score - a.score || a.index - b.index)
    .map((result) => result.assignment)
}
