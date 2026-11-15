/** Canonical number forms for ASR comparisons; never treats different values as typos. */
const SMALL = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ')
const TENS = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const ORDINALS = 'zeroth first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth'.split(' ')
const ORDINAL_TENS = ['twentieth', 'thirtieth', 'fortieth', 'fiftieth', 'sixtieth', 'seventieth', 'eightieth', 'ninetieth']
const SCALES: Record<string, number> = { thousand: 1_000, million: 1_000_000, billion: 1_000_000_000 }
type Parsed = { value: number; end: number; ordinal: boolean }

function underHundred(tokens: string[], start: number): Parsed | null {
  const token = tokens[start]
  if (!token) return null
  const small = SMALL.indexOf(token)
  if (small >= 0) return { value: small, end: start + 1, ordinal: false }
  const ordinal = ORDINALS.indexOf(token)
  if (ordinal >= 0) return { value: ordinal, end: start + 1, ordinal: true }
  const ordinalTen = ORDINAL_TENS.indexOf(token)
  if (ordinalTen >= 0) return { value: (ordinalTen + 2) * 10, end: start + 1, ordinal: true }
  const ten = TENS.indexOf(token)
  if (ten >= 0) {
    const next = underHundred(tokens, start + 1)
    if (next && next.value > 0 && next.value < 10) return { ...next, value: (ten + 2) * 10 + next.value }
    return { value: (ten + 2) * 10, end: start + 1, ordinal: false }
  }
  if (token === 'a' && /^(hundred|thousand|million|billion)$/.test(tokens[start + 1] ?? '')) {
    return { value: 1, end: start + 1, ordinal: false }
  }
  return null
}

function group(tokens: string[], start: number): Parsed | null {
  const small = underHundred(tokens, start)
  if (!small || small.ordinal || small.value < 1 || small.value > 9 || !/^hundred(?:th)?$/.test(tokens[small.end] ?? '')) return small
  const base = small.value * 100
  const end = small.end + 1
  if (tokens[small.end] === 'hundredth') return { value: base, end, ordinal: true }
  const remainder = underHundred(tokens, tokens[end] === 'and' ? end + 1 : end)
  if (remainder && remainder.value > 0) return { ...remainder, value: base + remainder.value }
  return { value: base, end, ordinal: false }
}

function readNumber(tokens: string[], start: number): Parsed | null {
  let part = group(tokens, start)
  if (!part) return null
  let total = 0
  let ceiling = Infinity
  while (!part.ordinal) {
    const scaleToken = tokens[part.end] ?? ''
    const ordinalScale = scaleToken.endsWith('th')
    const scale = SCALES[ordinalScale ? scaleToken.slice(0, -2) : scaleToken]
    if (!scale || scale >= ceiling) break
    total += part.value * scale
    ceiling = scale
    const end = part.end + 1
    if (ordinalScale) return { value: total, end, ordinal: true }
    const next = group(tokens, tokens[end] === 'and' ? end + 1 : end)
    if (!next || next.value >= scale) return { value: total, end, ordinal: false }
    part = next
  }
  return { ...part, value: total + part.value }
}

function ordinalSuffix(value: number) {
  if (value % 100 >= 11 && value % 100 <= 13) return 'th'
  return ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[value % 10] ?? 'th'
}

/** Punctuation is kept until parsing ends so "two, three" never becomes twenty-three. */
export function normalizeEnglishNumbers(text: string): string {
  const prepared = text.toLowerCase()
    .replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, value => value.replaceAll(',', ''))
    .replace(/\$(\d+)(?:\.(\d{2}))?\b/g, (_, dollars: string, cents?: string) =>
      `${dollars} ${Number(dollars) === 1 ? 'dollar' : 'dollars'}${cents ? ` ${Number(cents)} ${Number(cents) === 1 ? 'cent' : 'cents'}` : ''}`)
  const tokens = prepared
    .replace(/(?<=[a-z])-(?=[a-z])/g, ' ')
    .match(/\d+(?:\.\d+)?(?:st|nd|rd|th)?|[a-z]+|[^\s]/g) ?? []
  const output: string[] = []
  for (let index = 0; index < tokens.length;) {
    // Phone/PIN digit strings are an identifier, not a sum. Do not apply this to quantities.
    const prefix = output.slice(-8).join(' ')
    if (/\b(phone|telephone|pin|code|number ends|number is)\b/.test(prefix) && SMALL.indexOf(tokens[index]) >= 0 && SMALL.indexOf(tokens[index]) < 10) {
      let end = index
      let digits = ''
      while (SMALL.indexOf(tokens[end]) >= 0 && SMALL.indexOf(tokens[end]) < 10) digits += SMALL.indexOf(tokens[end++])
      if (end - index >= 2) { output.push(digits); index = end; continue }
    }
    const parsed = readNumber(tokens, index)
    if (!parsed) { output.push(tokens[index++]); continue }
    let value = String(parsed.value)
    index = parsed.end
    if (!parsed.ordinal && tokens[index] === 'point') {
      let end = index + 1
      let decimals = ''
      while (SMALL.indexOf(tokens[end]) >= 0 && SMALL.indexOf(tokens[end]) < 10) decimals += SMALL.indexOf(tokens[end++])
      if (decimals) { value += `.${decimals}`; index = end }
    }
    output.push(value + (parsed.ordinal ? ordinalSuffix(parsed.value) : ''))
  }
  return output.join(' ')
    .replace(/(\d+ dollars?) and (\d+ cents?)/g, '$1 $2')
    .replace(/\b(\d+) and a half\b/g, (_, whole: string) => `${whole}.5`)
    .replace(/\bhalf a (kilo|kilogram|liter|litre|cup|hour)\b/g, '0.5 $1')
    .replace(/\ba quarter of a (kilo|kilogram|liter|litre|cup)\b/g, '0.25 $1')
    .replace(/\b(?:a )?quarter (past|to) (\d{1,2})\b/g, (match, direction: string, hour: string) => {
      const value = Number(hour)
      return value >= 1 && value <= 12 ? `${direction === 'past' ? value : value === 1 ? 12 : value - 1} ${direction === 'past' ? 15 : 45}` : match
    })
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2})(?:st|nd|rd|th)?\b/g,
      (match, month: string, day: string) => Number(day) >= 1 && Number(day) <= 31 ? `${month} ${day}${ordinalSuffix(Number(day))}` : match)
    .replace(/(\d)\.(\d)/g, '$1 decimal $2')
}
