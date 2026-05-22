type RateLimitOptions = {
  limit: number
  windowMs: number
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return (
    forwardedFor ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    'unknown'
  )
}

export function checkRateLimit(key: string, { limit, windowMs }: RateLimitOptions) {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt }
}
