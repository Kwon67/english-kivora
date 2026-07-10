import { NextResponse } from 'next/server'
import { applyAbacateWebhook, verifyAbacateWebhook } from '@/features/billing/providers/abacatePay'
import { getRequestIp, recordSecurityEvent } from '@/features/security/lib/security'
import { rateLimitRequest } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_WEBHOOK_BYTES = 256 * 1024

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, {
    keyPrefix: 'webhook:abacatepay',
    limit: 120,
    windowMs: 60_000,
  })
  if (limited) return limited

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const rawBody = await request.text()
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const url = new URL(request.url)
  const secret = url.searchParams.get('webhookSecret')
  const signature =
    request.headers.get('x-webhook-signature') ||
    request.headers.get('x-abacate-signature')

  if (!verifyAbacateWebhook(rawBody, secret, signature)) {
    await recordSecurityEvent({
      eventType: 'abacatepay_webhook_signature_invalid',
      severity: 'critical',
      ipAddress: getRequestIp(request),
      route: '/api/webhooks/abacatepay',
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await applyAbacateWebhook(rawBody)
    return NextResponse.json({ received: true, result })
  } catch (error) {
    console.error('AbacatePay webhook processing failed', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

