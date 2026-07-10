import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/session'
import {
  blockSecurityIdentifier,
  consumeRateLimit,
  getSecurityBlock,
  getRequestIp,
  hasTrustedOrigin,
  isSuspiciousProEscalationPath,
  isSuspiciousScannerPath,
  recordSecurityEvent,
} from '@/features/security/lib/security'
import { rateLimitRequest } from '@/lib/rateLimit'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getRequestIp(request)
  const userAgent = request.headers.get('user-agent')
  const publicMarketingPath =
    pathname === '/' ||
    pathname === '/register' ||
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/privacy' ||
    pathname === '/terms'

  if (!publicMarketingPath && ip !== 'unknown') {
    const block = await getSecurityBlock('ip', ip)
    if (block.blocked) {
      return NextResponse.json(
        { error: 'Request blocked' },
        {
          status: 429,
          headers: { 'Retry-After': String(block.retryAfterSeconds) },
        },
      )
    }
  }

  if (isSuspiciousProEscalationPath(pathname)) {
    const attempt = await consumeRateLimit('pro_escalation_probe_ip', ip, 3, 15 * 60)
    await recordSecurityEvent({
      eventType: 'pro_escalation_probe_blocked',
      severity: 'critical',
      ipAddress: ip,
      userAgent,
      route: pathname,
      metadata: { method: request.method, attempts: attempt.requestCount },
    })

    if (!attempt.allowed && ip !== 'unknown') {
      await blockSecurityIdentifier({
        kind: 'ip',
        identifier: ip,
        reason: 'pro_escalation_probe',
        durationSeconds: 6 * 60 * 60,
        metadata: { route: pathname },
      })
    }

    return new NextResponse(null, { status: 404 })
  }

  if (isSuspiciousScannerPath(pathname)) {
    const attempt = await consumeRateLimit('scanner_probe_ip', ip, 8, 15 * 60)
    await recordSecurityEvent({
      eventType: 'scanner_path_blocked',
      severity: 'medium',
      ipAddress: ip,
      userAgent,
      route: pathname,
      metadata: { attempts: attempt.requestCount },
    })

    if (!attempt.allowed && ip !== 'unknown') {
      await blockSecurityIdentifier({
        kind: 'ip',
        identifier: ip,
        reason: 'repeated_scanner_probe',
        durationSeconds: 60 * 60,
        metadata: { route: pathname },
      })
    }
    return new NextResponse(null, { status: 404 })
  }

  if (pathname.startsWith('/api/') && !hasTrustedOrigin(request)) {
    const attempt = await consumeRateLimit('api_cross_origin_ip', ip, 6, 15 * 60)
    await recordSecurityEvent({
      eventType: 'api_cross_origin_blocked',
      severity: 'high',
      ipAddress: ip,
      userAgent,
      route: pathname,
      metadata: { method: request.method, attempts: attempt.requestCount },
    })

    if (!attempt.allowed && ip !== 'unknown') {
      await blockSecurityIdentifier({
        kind: 'ip',
        identifier: ip,
        reason: 'repeated_cross_origin_api_attack',
        durationSeconds: 60 * 60,
        metadata: { route: pathname },
      })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const rateLimitRule = pathname.startsWith('/api/login')
    ? { action: 'api_login_edge', limit: 30, windowSeconds: 60 }
    : pathname.startsWith('/api/tts')
      ? { action: 'api_tts_edge', limit: 60, windowSeconds: 60 }
      : pathname.startsWith('/api/presence')
        ? { action: 'api_presence_edge', limit: 90, windowSeconds: 60 }
        : null

  if (rateLimitRule) {
    const limited = rateLimitRequest(request, {
      keyPrefix: `edge:${rateLimitRule.action}`,
      limit: rateLimitRule.limit,
      windowMs: rateLimitRule.windowSeconds * 1000,
    })
    if (limited) return limited
  }

  // Use the proxy session handler for auth redirects
  return await updateSession(request)
}
