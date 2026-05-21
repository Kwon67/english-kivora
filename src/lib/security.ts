import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { logger } from './logger'
import { createAdminClient } from './supabase/server'

type RateLimitResult = {
  allowed: boolean
  requestCount: number
  retryAfterSeconds: number
  source: 'persistent' | 'memory'
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

type SecurityEvent = {
  eventType: string
  severity?: SecuritySeverity
  actorUserId?: string | null
  identifier?: string | null
  identifierHash?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  route?: string | null
  metadata?: Record<string, unknown>
}

type SecurityEventInsert = {
  event_type: string
  severity: SecuritySeverity
  actor_user_id: string | null
  identifier_hash: string | null
  ip_address: string | null
  user_agent: string | null
  route: string | null
  metadata: Record<string, unknown>
}

type SecurityEventClient = {
  from(table: 'security_events'): {
    insert(payload: SecurityEventInsert): Promise<{ error: { message?: string } | null }>
  }
}

type ConsumeRateLimitClient = {
  rpc(
    name: 'consume_rate_limit',
    args: { p_key: string; p_limit: number; p_window_seconds: number }
  ): Promise<{ data: unknown; error: { message?: string } | null }>
}

type LegacyRateLimitClient = {
  rpc(
    name: 'check_rate_limit',
    args: { p_key: string; p_limit: number; p_window_seconds: number }
  ): Promise<{ data: boolean | null; error: { message?: string } | null }>
}

type LoginBotSignalInput = {
  website?: unknown
  startedAt?: unknown
}

const localBuckets = new Map<string, RateLimitBucket>()

const SUSPICIOUS_PATH_PREFIXES = [
  '/.env',
  '/.git',
  '/wp-admin',
  '/wp-content',
  '/wp-login',
  '/xmlrpc.php',
  '/phpmyadmin',
  '/vendor/phpunit',
  '/actuator',
]

const SUSPICIOUS_USER_AGENT_PATTERN =
  /\b(curl|wget|python-requests|httpclient|libwww|nikto|sqlmap|nmap|masscan|zgrab|headlesschrome|selenium)\b/i

function truncate(value: string | null | undefined, maxLength: number) {
  if (!value) return null
  return value.length > maxLength ? value.slice(0, maxLength) : value
}

function getSafeRateLimitAction(action: string) {
  return action.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 80) || 'unknown'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parsePersistentRateLimitResult(data: unknown): Omit<RateLimitResult, 'source'> | null {
  if (!isRecord(data)) return null

  const allowed = data.allowed
  const requestCount = data.requestCount
  const retryAfterSeconds = data.retryAfterSeconds

  if (
    typeof allowed !== 'boolean' ||
    typeof requestCount !== 'number' ||
    typeof retryAfterSeconds !== 'number'
  ) {
    return null
  }

  return {
    allowed,
    requestCount,
    retryAfterSeconds,
  }
}

function consumeLocalRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = localBuckets.get(key)

  if (!existing || existing.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, requestCount: 1, retryAfterSeconds: 0, source: 'memory' }
  }

  existing.count += 1
  return {
    allowed: existing.count <= limit,
    requestCount: existing.count,
    retryAfterSeconds: existing.count <= limit ? 0 : Math.ceil((existing.resetAt - now) / 1000),
    source: 'memory',
  }
}

export function hashSecurityValue(value: string) {
  return createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex')
}

export function normalizeSecurityIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 160)
}

/**
 * Safely retrieves the administrative secret.
 * In production, this MUST be configured and will throw if missing.
 */
export function getAdminSecret(): string {
  const configuredSecret = process.env.ADMIN_SECRET?.trim()

  if (configuredSecret) return configuredSecret
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: ADMIN_SECRET is not configured in production.')
  }

  return 'kivora-admin-2026'
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip =
    request.headers.get('cf-connecting-ip')?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    forwardedFor ||
    'unknown'

  return truncate(ip.replace(/[^a-fA-F0-9:.,\s-]/g, ''), 80) || 'unknown'
}

/**
 * Retrieves the client IP address from server action headers.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip =
    headerList.get('cf-connecting-ip')?.trim() ||
    headerList.get('x-real-ip')?.trim() ||
    forwardedFor ||
    '127.0.0.1'

  return truncate(ip.replace(/[^a-fA-F0-9:.,\s-]/g, ''), 80) || '127.0.0.1'
}

export function getRequestRoute(request: Request) {
  try {
    return new URL(request.url).pathname
  } catch {
    return null
  }
}

export function hasTrustedOrigin(request: Request) {
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true

  const origin = request.headers.get('origin')
  if (!origin) return true

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host')

  if (!host) return false

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase()
  } catch {
    return false
  }
}

export function isSuspiciousScannerPath(pathname: string) {
  const normalizedPath = pathname.toLowerCase()
  const hasPathTraversal = normalizedPath.split(/[/\\]/).some((segment) => segment === '..')
  return (
    hasPathTraversal ||
    SUSPICIOUS_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))
  )
}

export function getLoginBotSignalScore(request: Request, input: LoginBotSignalInput) {
  let score = 0
  const reasons: string[] = []
  const userAgent = request.headers.get('user-agent') || ''
  const contentType = request.headers.get('content-type') || ''
  const secFetchSite = request.headers.get('sec-fetch-site')

  if (!contentType.toLowerCase().includes('application/json')) {
    score += 15
    reasons.push('unexpected_content_type')
  }

  if (!userAgent.trim()) {
    score += 25
    reasons.push('missing_user_agent')
  } else if (SUSPICIOUS_USER_AGENT_PATTERN.test(userAgent)) {
    score += 30
    reasons.push('automation_user_agent')
  }

  if (typeof input.website === 'string' && input.website.trim()) {
    score += 100
    reasons.push('honeypot_filled')
  }

  const startedAt =
    typeof input.startedAt === 'number'
      ? input.startedAt
      : typeof input.startedAt === 'string'
        ? Number(input.startedAt)
        : null

  if (!startedAt || !Number.isFinite(startedAt)) {
    score += 10
    reasons.push('missing_client_timing')
  } else {
    const ageMs = Date.now() - startedAt
    if (ageMs >= 0 && ageMs < 650) {
      score += 25
      reasons.push('submitted_too_fast')
    } else if (ageMs < 0 || ageMs > 12 * 60 * 60 * 1000) {
      score += 10
      reasons.push('stale_client_timing')
    }
  }

  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
    score += 35
    reasons.push('cross_site_fetch')
  }

  return { score, reasons }
}

export async function recordSecurityEvent(event: SecurityEvent) {
  const adminSupabase = createAdminClient()
  const severity = event.severity || 'low'
  const identifierHash =
    event.identifierHash || (event.identifier ? hashSecurityValue(event.identifier) : null)

  const payload: SecurityEventInsert = {
    event_type: truncate(event.eventType.replace(/[^a-zA-Z0-9:_-]/g, '_'), 80) || 'security_event',
    severity,
    actor_user_id: event.actorUserId || null,
    identifier_hash: identifierHash,
    ip_address: truncate(event.ipAddress, 80),
    user_agent: truncate(event.userAgent, 512),
    route: truncate(event.route, 160),
    metadata: event.metadata || {},
  }

  logger.security(payload.event_type, {
    severity,
    identifierHash: payload.identifier_hash,
    ipAddress: payload.ip_address,
    route: payload.route,
    ...payload.metadata,
  })

  if (!adminSupabase) return

  const { error } = await (adminSupabase as unknown as SecurityEventClient)
    .from('security_events')
    .insert(payload)

  if (error) {
    console.error('Security event insert failed', { eventType: payload.event_type, error: error.message })
  }
}

/**
 * Checks and consumes a durable rate-limit slot.
 * Production fails closed if the persistent backend is unavailable; development falls back to memory.
 */
export async function consumeRateLimit(
  action: string,
  identifier: string,
  limit: number = 5,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const safeAction = getSafeRateLimitAction(action)
  const safeIdentifier = normalizeSecurityIdentifier(identifier || 'unknown')
  const key = `${safeAction}:${hashSecurityValue(safeIdentifier)}`
  const supabase = createAdminClient()

  if (supabase) {
    const { data, error } = await (supabase as unknown as ConsumeRateLimitClient).rpc('consume_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })

    const parsed = parsePersistentRateLimitResult(data)
    if (!error && parsed) {
      const result = { ...parsed, source: 'persistent' as const }
      if (!result.allowed) {
        await recordSecurityEvent({
          eventType: 'rate_limit_triggered',
          severity: 'medium',
          identifierHash: hashSecurityValue(safeIdentifier),
          metadata: { action: safeAction, limit, windowSeconds, retryAfterSeconds: result.retryAfterSeconds },
        })
      }
      return result
    }

    console.error('Security: persistent rate limit failed.', { action: safeAction, error: error?.message })
  }

  if (process.env.NODE_ENV === 'production') {
    await recordSecurityEvent({
      eventType: 'rate_limit_backend_unavailable',
      severity: 'high',
      identifierHash: hashSecurityValue(safeIdentifier),
      metadata: { action: safeAction },
    })
    return { allowed: false, requestCount: limit + 1, retryAfterSeconds: windowSeconds, source: 'persistent' }
  }

  return consumeLocalRateLimit(key, limit, windowSeconds)
}

/**
 * Backward-compatible boolean helper. Returns true when the request should be blocked.
 */
export async function isRateLimited(
  action: string,
  identifier: string,
  limit: number = 5,
  windowSeconds: number = 60
): Promise<boolean> {
  const result = await consumeRateLimit(action, identifier, limit, windowSeconds)
  return !result.allowed
}

/**
 * Standardizes error messages to prevent user enumeration attacks.
 */
export function getStandardAuthError(): string {
  return 'As credenciais fornecidas são inválidas ou sua conta está temporariamente bloqueada.'
}

export async function checkLegacyRateLimit(
  action: string,
  identifier: string,
  limit: number,
  windowSeconds: number
) {
  const supabase = createAdminClient()
  if (!supabase) return false

  const key = `${getSafeRateLimitAction(action)}:${hashSecurityValue(normalizeSecurityIdentifier(identifier))}`
  const { data } = await (supabase as unknown as LegacyRateLimitClient).rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  return data === false
}
