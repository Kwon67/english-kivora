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
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'

type PendingCookie = {
  name: string
  value: string
  options: Parameters<NextResponse['cookies']['set']>[2]
}

const usernameMap: Record<string, string> = {
  armando: 'armando@kivora.com',
  daniel: 'daniel@kivora.com',
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

async function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms)
    if (timer.unref) timer.unref()
  })
  return Promise.race([promise, timeoutPromise])
}

export async function POST(request: NextRequest) {
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

  const [ipLimit, identifierLimit, pairLimit] = await withTimeout(
    Promise.all([
      consumeRateLimit('login_ip', ipAddress, 40, 15 * 60),
      consumeRateLimit('login_identifier', normalizedIdentifier, 12, 15 * 60),
      consumeRateLimit('login_pair', `${ipAddress}:${normalizedIdentifier}`, 8, 15 * 60),
    ]),
    3000,
    'Rate limit check timed out'
  ).catch((err) => {
    console.error('Rate limit checks timed out, falling back to allowed', err)
    return [{ allowed: true }, { allowed: true }, { allowed: true }] as any
  })

  const blockedLimit = [ipLimit, identifierLimit, pairLimit].find((limit) => !limit.allowed)
  if (blockedLimit) {
    await recordSecurityEvent({
      eventType: 'login_rate_limited',
      severity: 'medium',
      identifierHash,
      ipAddress,
      userAgent,
      route,
      metadata: {
        retryAfterSeconds: blockedLimit.retryAfterSeconds,
        requestCount: blockedLimit.requestCount,
        botScore: botSignal.score,
        botReasons: botSignal.reasons,
      },
    })
    return rateLimitResponse(blockedLimit.retryAfterSeconds)
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

  const email =
    usernameMap[username.toLowerCase()] || (username.includes('@') ? username : `${username}@kivora.com`)

  const authResult = await withTimeout(
    supabase.auth.signInWithPassword({ email, password }),
    6000,
    'O servidor de autenticação está demorando muito para responder. Por favor, tente novamente.'
  ).catch((err) => {
    return {
      data: { user: null },
      error: err instanceof Error ? err : new Error('Falha na autenticação')
    }
  })

  const { data, error } = authResult

  if (error) {
    recordSecurityEvent({
      eventType: 'login_failed',
      severity: 'medium',
      identifierHash,
      ipAddress,
      userAgent,
      route,
      metadata: { code: error.message || 'unknown', botScore: botSignal.score, botReasons: botSignal.reasons },
    }).catch(() => null)
    return NextResponse.json({ error: error.message || getStandardAuthError() }, { status: 401 })
  }

  if (!data.user) {
    return NextResponse.json({ error: 'Erro ao obter dados do usuário' }, { status: 500 })
  }

  const profileResult = await withTimeout<any>(
    Promise.resolve(
      supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
    ),
    3000,
    'Profile lookup timed out'
  ).catch((err) => {
    console.error('Login profile lookup timed out or failed, falling back to member role', err)
    return { data: { role: 'member' }, error: null }
  })

  const profile = profileResult.data
  const profileError = profileResult.error

  if (profileError) {
    console.error('Login profile lookup failed', { userId: data.user.id, profileError })
    return NextResponse.json({ error: 'Não foi possível concluir o login' }, { status: 500 })
  }

  const factorsResult = await withTimeout<any>(
    Promise.resolve(supabase.auth.mfa.listFactors()),
    3000,
    'MFA factor lookup timed out'
  ).catch((err) => {
    console.error('MFA factor lookup timed out or failed, falling back to none', err)
    return { data: { all: [] }, error: null }
  })

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

  const hasMFA = factors?.all.some((factor: any) => factor.status === 'verified') ?? false

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
