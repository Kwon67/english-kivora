import { NextResponse } from 'next/server'

type RateLimitOptions = {
  keyPrefix: string
  limit: number
  windowMs: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return (
    forwardedFor ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    'unknown'
  )
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
    if (buckets.size < MAX_BUCKETS) break
  }
}

export function rejectNonJsonRequest(request: Request) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.toLowerCase().includes('application/json')) {
    return null
  }

  return NextResponse.json(
    { error: 'Content-Type must be application/json' },
    {
      status: 415,
      headers: { Accept: 'application/json' },
    }
  )
}

export function rateLimitRequest(request: Request, options: RateLimitOptions) {
  const now = Date.now()
  const ip = getClientIp(request)
  const key = `${options.keyPrefix}:${ip}`
  const current = buckets.get(key)

  pruneExpiredBuckets(now)

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return null
  }

  current.count += 1

  if (current.count <= options.limit) {
    return null
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))

  return NextResponse.json(
    { error: 'Too Many Requests' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  )
}

export function protectJsonPost(request: Request, options: RateLimitOptions) {
  return rejectNonJsonRequest(request) ?? rateLimitRequest(request, options)
}
