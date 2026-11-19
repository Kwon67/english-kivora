import { parseReviewCardIds } from '@/features/review/lib/reviewCardIds'

/** Preserve a learning destination across login without forwarding arbitrary URLs or query parameters. */
export function studyReturnPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  const match = /^(\/(?:today|history|review|practice-path|home|tutor(?:\/[\w-]+)?|blitz(?:\/(?:play|ranking))?|play\/[\w-]+|exam\/[A-C][12]))(?:\?([^#]*))?$/.exec(value)
  if (!match) return null
  const [, path, query] = match
  const source = new URLSearchParams(query)
  const next = new URLSearchParams()
  if (path === '/today') {
    if (source.get('unit') === 'travel') next.set('unit', 'travel')
    const level = source.get('level')
    if (level && /^[A-C][12]$/.test(level)) next.set('level', level)
  }
  if (path === '/review' || path === '/home') {
    if (source.get('mode') === 'guided') next.set('mode', 'guided')
    const origin = source.get('source')
    const cards = parseReviewCardIds(source.get('cards'))
    if ((origin === 'problem' || origin === 'blitz') && cards.length) {
      next.set('source', origin)
      next.set('cards', cards.join(','))
    }
  }
  const unit = source.get('unit')
  if (path === '/practice-path' && unit && /^[a-zA-Z0-9-]{1,64}$/.test(unit)) next.set('unit', unit)
  if (path === '/blitz/play' && source.get('mode') === 'ai') next.set('mode', 'ai')
  const date = source.get('date')
  if (path === '/history' && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) next.set('date', date)
  return next.size ? path + '?' + next.toString() : path
}
