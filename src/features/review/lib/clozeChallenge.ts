/** Build a prompt from an existing sentence; no generated content is saved. */
export type ClozeChallenge = { segments: string[]; answers: string[]; options: string[] }

const COMMON = new Set('a an the i you he she it we they me him her us them my your his its our their am is are was were be been being do does did have has had can could would should will shall may might must to of in on at for with from by as and or but if than that this these those what where when who why how not no yes very just there here'.split(' '))
const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*/g
const GRAMMAR_OPTIONS: Record<string, string[]> = { am: ['is', 'are'], is: ['am', 'are'], are: ['am', 'is'], was: ['is', 'were'], were: ['was', 'are'], has: ['have', 'had'], have: ['has', 'had'], had: ['has', 'have'], do: ['does', 'did'], does: ['do', 'did'], did: ['do', 'does'] }

export function buildClozeChallenge(sentence: string, otherSentences: readonly string[]): ClozeChallenge | null {
  const matches = [...sentence.matchAll(WORD)]
  if (matches.length < 3) return null
  const original = new Set(matches.map(match => match[0].toLowerCase()))
  const candidates = matches.slice(1, -1).filter(match => match[0].length >= 4 && !COMMON.has(match[0].toLowerCase()) && !match[0].includes("'") && !match[0].includes('’') && matches.filter(m => m[0].toLowerCase() === match[0].toLowerCase()).length === 1)
  const pool = new Map<string, string>()
  for (const phrase of otherSentences) for (const match of phrase.matchAll(WORD)) {
    const word = match[0].toLowerCase()
    if (word.length >= 4 && !COMMON.has(word) && !original.has(word) && !word.includes("'") && !word.includes('’')) pool.set(word, word)
  }
  const middle = (sentence.length - 1) / 2
  const closestToMiddle = (words: RegExpExecArray[]) => words.reduce((best, current) => Math.abs(current.index - middle) < Math.abs(best.index - middle) ? current : best)
  const maxGaps = matches.length >= 12 ? 3 : matches.length >= 6 ? 2 : 1
  let targets = candidates.length ? [closestToMiddle(candidates)] : []
  // Leave a visible word between gaps, and preserve the beginning and end for context.
  const distance = (candidate: RegExpExecArray) => Math.min(...targets.map(target => Math.abs(matches.indexOf(candidate) - matches.indexOf(target))))
  while (targets.length && targets.length < maxGaps) {
    const remaining = candidates.filter(candidate => distance(candidate) >= 2)
    if (!remaining.length) break
    targets.push(remaining.reduce((best, candidate) => distance(candidate) > distance(best) ? candidate : best))
  }
  let distractors: string[]
  if (!targets.length || targets.length === 1 && pool.size < 2) {
    const grammar = matches.slice(1, -1).filter(match => GRAMMAR_OPTIONS[match[0].toLowerCase()]?.every(option => !original.has(option)))
    if (!grammar.length) return null
    targets = [closestToMiddle(grammar)]
    distractors = GRAMMAR_OPTIONS[targets[0][0].toLowerCase()]
  } else {
    const lengthDistance = (word: string) => Math.min(...targets.map(target => Math.abs(word.length - target[0].length)))
    distractors = [...pool.values()].sort((a, b) => lengthDistance(a) - lengthDistance(b) || a.localeCompare(b)).slice(0, 2)
  }
  targets.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  const answers = targets.map(target => target[0])
  const segments: string[] = []
  let cursor = 0
  for (const target of targets) {
    segments.push(sentence.slice(cursor, target.index))
    cursor = (target.index ?? 0) + target[0].length
  }
  segments.push(sentence.slice(cursor))
  const options = [...answers, ...distractors]
  // Stable shuffle so the word bank does not reveal the order of the answers.
  let seed = [...sentence].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0)
  for (let i = options.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  return { segments, answers, options }
}
