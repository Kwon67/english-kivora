import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/session'
import {
  getRequestIp,
  hasTrustedOrigin,
  isSuspiciousScannerPath,
  recordSecurityEvent,
} from '@/features/security/lib/security'
import { rateLimitRequest } from '@/lib/rateLimit'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getRequestIp(request)
  const userAgent = request.headers.get('user-agent')

  if (isSuspiciousScannerPath(pathname)) {
    await recordSecurityEvent({
      eventType: 'scanner_path_blocked',
      severity: 'medium',
      ipAddress: ip,
      userAgent,
      route: pathname,
    })
    return new NextResponse(null, { status: 404 })
  }

  if (pathname.startsWith('/api/') && !hasTrustedOrigin(request)) {
    await recordSecurityEvent({
      eventType: 'api_cross_origin_blocked',
      severity: 'high',
      ipAddress: ip,
      userAgent,
      route: pathname,
      metadata: { method: request.method },
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const rateLimitRule = pathname.startsWith('/api/login')
    ? { action: 'api_login_edge', limit: 30, windowSeconds: 60 }
    : pathname.startsWith('/api/tts')
      ? { action: 'api_tts_edge', limit: 60, windowSeconds: 60 }
      : pathname.startsWith('/api/arena')
        ? { action: 'api_arena_edge', limit: 120, windowSeconds: 60 }
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
