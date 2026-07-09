import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import {
  consumeRateLimit,
  getLoginBotSignalScore,
  getRequestIp,
  getRequestRoute,
  getStandardAuthError,
  hasTrustedOrigin,
  hashSecurityValue,
  normalizeSecurityIdentifier,
  recordSecurityEvent,
} from '@/features/security/lib/security'
import { awaitWithGraceTimeout } from '@/features/auth/lib/awaitWithGraceTimeout'
import { resolveLoginEmail } from '@/features/auth/lib/resolveLoginEmail'
import { protectJsonPost } from '@/lib/rateLimit'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'

type PendingCookie = {
  name: string
  value: string
  options: Parameters<NextResponse['cookies']['set']>[2]
}

type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds?: number
  requestCount?: number
}

type ProfileRoleResult = {
  data: { role: string | null } | null
  error: { message?: string } | null
}

type MfaFactor = {
  status?: string
}

type MfaFactorsResult = {
  data: { all: MfaFactor[] } | null
  error: { message?: string } | null
}

const LoginSchema = z.object({
  username: z.string().trim().min(1).max(128),
  password: z.string().min(1).max(1024),
  website: z.string().max(512).optional().default(''),
  startedAt: z.coerce.number().int().positive().optional(),
})

function tooLarge(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  return Number.isFinite(contentLength) && contentLength > 4096
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: getStandardAuthError() },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, retryAfterSeconds)),
      },
    }
  )
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    if (timer.unref) timer.unref()
  })
  return Promise.race([promise, timeoutPromise])
}

export async function POST(request: NextRequest) {
  const protectionResponse = protectJsonPost(request, {
    keyPrefix: 'api:login',
    limit: 10,
    windowMs: 60_000,
  })
  if (protectionResponse) return protectionResponse

  const ipAddress = getRequestIp(request)
  const route = getRequestRoute(request)
  const userAgent = request.headers.get('user-agent')

  if (!hasTrustedOrigin(request)) {
    await recordSecurityEvent({
      eventType: 'login_cross_origin_blocked',
      severity: 'high',
      ipAddress,
      userAgent,
      route,
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (tooLarge(request)) {
    await recordSecurityEvent({
      eventType: 'login_payload_too_large',
      severity: 'medium',
      ipAddress,
      userAgent,
      route,
    })
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const body = await request.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)

  if (!parsed.success) {
    await consumeRateLimit('login_malformed_ip', ipAddress, 10, 300)
    await recordSecurityEvent({
      eventType: 'login_malformed_payload',
      severity: 'medium',
      ipAddress,
      userAgent,
      route,
      metadata: { issues: parsed.error.issues.map((issue) => issue.path.join('.')).slice(0, 5) },
    })
    return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
  }

  const { username, password } = parsed.data
  const normalizedIdentifier = normalizeSecurityIdentifier(username)
  const identifierHash = hashSecurityValue(normalizedIdentifier)
  const botSignal = getLoginBotSignalScore(request, parsed.data)

  if (botSignal.score >= 80) {
    await consumeRateLimit('login_bot_ip', ipAddress, 3, 900)
    await recordSecurityEvent({
      eventType: 'login_bot_signal_blocked',
      severity: 'high',
      identifierHash,
      ipAddress,
      userAgent,
      route,
      metadata: { score: botSignal.score, reasons: botSignal.reasons },
    })
    return rateLimitResponse(900)
  }

  const rateLimitFallback: [RateLimitResult, RateLimitResult, RateLimitResult] = [
    { allowed: true },
    { allowed: true },
    { allowed: true },
  ]

  const [ipLimit, identifierLimit, pairLimit] = await withTimeout(
    Promise.all([
      consumeRateLimit('login_ip', ipAddress, 40, 15 * 60),
      consumeRateLimit('login_identifier', normalizedIdentifier, 12, 15 * 60),
      consumeRateLimit('login_pair', `${ipAddress}:${normalizedIdentifier}`, 8, 15 * 60),
    ]),
    3000,
    rateLimitFallback
  )

  const blockedLimit = [ipLimit, identifierLimit, pairLimit].find((limit) => !limit.allowed)
  if (blockedLimit) {
    const retryAfterSeconds = blockedLimit.retryAfterSeconds ?? 60
    await recordSecurityEvent({
      eventType: 'login_rate_limited',
      severity: 'medium',
      identifierHash,
      ipAddress,
      userAgent,
      route,
      metadata: {
        retryAfterSeconds,
        requestCount: blockedLimit.requestCount,
        botScore: botSignal.score,
        botReasons: botSignal.reasons,
      },
    })
    return rateLimitResponse(retryAfterSeconds)
  }

  const pendingCookies: PendingCookie[] = []
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        pendingCookies.length = 0
        pendingCookies.push(...cookiesToSet)
      },
    },
  })

  const email = await resolveLoginEmail(username)
  if (!email) {
    return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
  }

  type AuthPasswordResult = Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>

  const authResult = await awaitWithGraceTimeout(
    supabase.auth.signInWithPassword({ email, password }),
    6000,
    2000,
    () =>
      ({
        data: { user: null, session: null },
        error: {
          message:
            'O servidor de autenticação está demorando muito para responder. Por favor, tente novamente.',
        },
      }) as AuthPasswordResult
  )

  const { data, error } = authResult

  if (error) {
    const isTimeoutMessage = /demorando muito para responder/i.test(error.message || '')
    recordSecurityEvent({
      eventType: 'login_failed',
      severity: 'medium',
      identifierHash,
      ipAddress,
      userAgent,
      route,
      metadata: { code: error.message || 'unknown', botScore: botSignal.score, botReasons: botSignal.reasons },
    }).catch(() => null)
    // Never return raw Supabase auth errors to the browser (anti-enumeration / info leak).
    return NextResponse.json(
      {
        error: isTimeoutMessage
          ? 'O servidor de autenticação está demorando muito para responder. Por favor, tente novamente.'
          : getStandardAuthError(),
      },
      { status: 401 }
    )
  }

  if (!data.user) {
    return NextResponse.json({ error: getStandardAuthError() }, { status: 500 })
  }

  const profileResult = await withTimeout<ProfileRoleResult>(
    Promise.resolve(
      supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
    ),
    3000,
    { data: { role: 'member' }, error: null }
  )

  const profile = profileResult.data
  const profileError = profileResult.error

  if (profileError) {
    console.error('Login profile lookup failed, falling back to member role', {
      userId: data.user.id,
      profileError,
    })
  }

  const factorsResult = await withTimeout<MfaFactorsResult>(
    Promise.resolve(supabase.auth.mfa.listFactors()),
    3000,
    { data: { all: [] }, error: null }
  )

  const factors = factorsResult.data
  const factorsError = factorsResult.error

  if (factorsError) {
    recordSecurityEvent({
      eventType: 'login_mfa_factor_lookup_failed',
      severity: 'medium',
      actorUserId: data.user.id,
      identifierHash,
      ipAddress,
      userAgent,
      route,
      metadata: { code: factorsError.message || 'unknown' },
    }).catch(() => null)
  }

  const hasMFA = factors?.all.some((factor) => factor.status === 'verified') ?? false

  recordSecurityEvent({
    eventType: 'login_success',
    severity: 'low',
    actorUserId: data.user.id,
    identifierHash,
    ipAddress,
    userAgent,
    route,
    metadata: { hasMFA, role: profile?.role || 'member', botScore: botSignal.score },
  }).catch((err) => console.error('Failed to log login success security event', err))

  const response = NextResponse.json({
    success: true,
    redirectUrl: hasMFA ? '/login/mfa' : profile?.role === 'admin' ? '/admin/dashboard' : '/home',
  })

  for (const cookie of pendingCookies) {
    const safeOptions = { ...cookie.options }
    if (process.env.NODE_ENV !== 'production') {
      safeOptions.secure = false
      safeOptions.sameSite = 'lax'
    }
    response.cookies.set(cookie.name, cookie.value, safeOptions)
  }

  return response
}
