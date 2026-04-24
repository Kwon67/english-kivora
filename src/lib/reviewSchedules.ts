import type { GameMode } from '@/types/database.types'
import { formatAppDateTime, getAppDateString, getAppTimeString, getAppWeekday, shiftAppDate } from '@/lib/timezone'

const SCHEDULE_PREFIX = 'scheduled_review'
const STATUS_SEPARATOR = '|'

export type ScheduledReviewMeta = {
  weekdays: number[]
  time: string
  cardIds: string[]
  cardsPerRelease: number
  lastReleaseKey: string | null
  active: boolean
  expiresOn: string | null
}

export const PLAYABLE_GAME_MODES: GameMode[] = ['multiple_choice', 'flashcard', 'typing', 'matching', 'listening']

export function isPlayableAssignmentGameMode(value: string): value is GameMode {
  return PLAYABLE_GAME_MODES.includes(value as GameMode)
}

export function isScheduledReviewGameMode(value: string) {
  return value === SCHEDULE_PREFIX
}

export function buildScheduledReviewStatus(meta: ScheduledReviewMeta) {
  return [
    SCHEDULE_PREFIX,
    `weekdays=${meta.weekdays.join(',')}`,
    `time=${meta.time}`,
    `cards=${meta.cardIds.join(',')}`,
    `count=${meta.cardsPerRelease}`,
    `active=${meta.active ? '1' : '0'}`,
    `last=${meta.lastReleaseKey || ''}`,
    `until=${meta.expiresOn || ''}`,
  ].join(STATUS_SEPARATOR)
}

export function parseScheduledReviewStatus(status: string | null | undefined): ScheduledReviewMeta | null {
  const normalized = status?.trim()
  if (!normalized) return null

  const [prefix, ...tokens] = normalized.split(STATUS_SEPARATOR)
  if (prefix !== SCHEDULE_PREFIX) return null

  const map = new Map<string, string>()
  for (const token of tokens) {
    const [key, value = ''] = token.split('=')
    if (key) map.set(key, value)
  }

  return {
    weekdays: (map.get('weekdays') || '')
      .split(',')
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6),
    time: map.get('time') || '18:00',
    cardIds: (map.get('cards') || '').split(',').filter(Boolean),
    cardsPerRelease: Number.parseInt(map.get('count') || '0', 10) || 0,
    lastReleaseKey: map.get('last') || null,
    active: map.get('active') !== '0',
    expiresOn: map.get('until') || null,
  }
}

export function isScheduledReviewExpired(meta: ScheduledReviewMeta, now: Date = new Date()) {
  if (!meta.expiresOn) return false
  return meta.expiresOn < getAppDateString(now)
}

export function getScheduledReviewReleaseKey(now: Date = new Date()) {
  return `${getAppDateString(now)}@${getAppTimeString(now).slice(0, 5)}`
}

export function isScheduledReviewDue(meta: ScheduledReviewMeta, now: Date = new Date()) {
  if (!meta.active) return false
  if (isScheduledReviewExpired(meta, now)) return false

  const weekday = getAppWeekday(now)
  if (!meta.weekdays.includes(weekday)) return false

  const nowTime = getAppTimeString(now).slice(0, 5)
  if (nowTime < meta.time) return false

  const slotKey = `${getAppDateString(now)}@${meta.time}`
  return meta.lastReleaseKey !== slotKey
}

export function getNextScheduledReviewOccurrence(meta: ScheduledReviewMeta, now: Date = new Date()) {
  if (!meta.active || meta.weekdays.length === 0) return null
  if (isScheduledReviewExpired(meta, now)) return null

  const today = getAppDateString(now)
  const nowTime = getAppTimeString(now).slice(0, 5)

  for (let offset = 0; offset < 14; offset++) {
    const dateString = shiftAppDate(today, offset)
    if (meta.expiresOn && dateString > meta.expiresOn) return null
    const candidate = new Date(`${dateString}T${meta.time}:00-03:00`)
    const weekday = getAppWeekday(candidate)

    if (!meta.weekdays.includes(weekday)) continue
    if (offset === 0 && nowTime > meta.time) continue

    return candidate
  }

  return null
}

export function formatNextScheduledReview(meta: ScheduledReviewMeta, now: Date = new Date()) {
  const next = getNextScheduledReviewOccurrence(meta, now)
  if (!next) return 'Sem próxima liberação'

  return formatAppDateTime(next, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isScheduledReviewReleasingToday(meta: ScheduledReviewMeta, now: Date = new Date()) {
  const next = getNextScheduledReviewOccurrence(meta, now)
  if (!next) return false

  return getAppDateString(next) === getAppDateString(now)
}

export function getLatestPendingScheduledReviewOccurrence(meta: ScheduledReviewMeta, now: Date = new Date()) {
  if (!meta.active || meta.weekdays.length === 0) return null
  if (isScheduledReviewExpired(meta, now)) return null

  const nowTime = getAppTimeString(now).slice(0, 5)
  const today = getAppDateString(now)

  for (let offset = 0; offset < 14; offset++) {
    const dateString = shiftAppDate(today, -offset)
    const candidate = new Date(`${dateString}T${meta.time}:00-03:00`)
    const weekday = getAppWeekday(candidate)
    const candidateTime = offset === 0 ? nowTime >= meta.time : true
    const slotKey = `${dateString}@${meta.time}`

    if (!meta.weekdays.includes(weekday)) continue
    if (!candidateTime) continue
    if (meta.lastReleaseKey === slotKey) break

    return candidate
  }

  return null
}

export function isScheduledReviewOverdue(meta: ScheduledReviewMeta, now: Date = new Date()) {
  return Boolean(getLatestPendingScheduledReviewOccurrence(meta, now))
}

export function formatScheduledReviewOverdue(meta: ScheduledReviewMeta, now: Date = new Date()) {
  const pending = getLatestPendingScheduledReviewOccurrence(meta, now)
  if (!pending) return null

  return formatAppDateTime(pending, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
