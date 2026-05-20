import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { logger } from '@/lib/logger'

/**
 * Enterprise-grade security utilities.
 */

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

  // Fallback for development only
  return 'kivora-admin-2026'
}

/**
 * Checks if an operation should be rate limited.
 * Uses Supabase as a persistent backing store for rate limit states.
 */
export async function isRateLimited(
  action: string,
  identifier: string,
  limit: number = 5,
  windowSeconds: number = 60
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) {
    console.error('Security: Admin client missing for rate limit check.')
    return false // Fail open or closed? Enterprise usually prefers fail closed for security, but fail open for availability.
  }

  const key = `${action}:${identifier}`
  
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (!data) {
    logger.security('Rate limit triggered', { action, identifier, limit, windowSeconds })
  }

  return !data // data is true if within limit, false if exceeded
}

/**
 * Standardizes error messages to prevent user enumeration attacks.
 */
export function getStandardAuthError(): string {
  return 'As credenciais fornecidas são inválidas ou sua conta está temporariamente bloqueada.'
}

/**
 * Retrieves the client IP address from headers.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return '127.0.0.1'
}
