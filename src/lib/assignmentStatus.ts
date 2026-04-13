const STATUS_SEPARATOR = '|'

type AssignmentBaseStatus = 'pending' | 'completed' | 'incomplete'

export type AssignmentStatusMeta = {
  baseStatus: AssignmentBaseStatus
  timeLimitMinutes: number | null
  timerStartedAt: string | null
  completedWithinTime: boolean | null
}

function normalizeBaseStatus(value: string | null | undefined): AssignmentBaseStatus {
  if (value === 'completed' || value === 'incomplete') return value
  return 'pending'
}

export function parseAssignmentStatus(rawStatus: string | null | undefined): AssignmentStatusMeta {
  const normalized = rawStatus?.trim() || 'pending'
  const [baseToken, ...tokens] = normalized.split(STATUS_SEPARATOR)

  const meta: AssignmentStatusMeta = {
    baseStatus: normalizeBaseStatus(baseToken),
    timeLimitMinutes: null,
    timerStartedAt: null,
    completedWithinTime: null,
  }

  for (const token of tokens) {
    const [key, value] = token.split('=')
    if (!key || !value) continue

    if (key === 'tl') {
      const minutes = Number.parseInt(value, 10)
      meta.timeLimitMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : null
      continue
    }

    if (key === 'ts') {
      const parsed = new Date(value)
      meta.timerStartedAt = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
      continue
    }

    if (key === 'within') {
      meta.completedWithinTime = value === '1' ? true : value === '0' ? false : null
    }
  }

  return meta
}

export function buildAssignmentStatus(meta: AssignmentStatusMeta): string {
  const tokens: string[] = [meta.baseStatus]

  if (meta.timeLimitMinutes && meta.timeLimitMinutes > 0) {
    tokens.push(`tl=${meta.timeLimitMinutes}`)
  }

  if (meta.timerStartedAt) {
    tokens.push(`ts=${new Date(meta.timerStartedAt).toISOString()}`)
  }

  if (meta.completedWithinTime !== null) {
    tokens.push(`within=${meta.completedWithinTime ? '1' : '0'}`)
  }

  return tokens.join(STATUS_SEPARATOR)
}

export function getAssignmentDeadline(meta: Pick<AssignmentStatusMeta, 'timeLimitMinutes' | 'timerStartedAt'>) {
  if (!meta.timeLimitMinutes || !meta.timerStartedAt) return null

  const startedAt = new Date(meta.timerStartedAt).getTime()
  if (Number.isNaN(startedAt)) return null

  return new Date(startedAt + meta.timeLimitMinutes * 60_000).toISOString()
}

export function isAssignmentCompleted(status: string | null | undefined) {
  return parseAssignmentStatus(status).baseStatus === 'completed'
}

export function isAssignmentIncomplete(status: string | null | undefined) {
  return parseAssignmentStatus(status).baseStatus === 'incomplete'
}
