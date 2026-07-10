import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import {
  blockSecurityIdentifier,
  consumeRateLimit,
  getClientIp,
  getSecurityBlock,
  recordSecurityEvent,
} from '@/features/security/lib/security'

type ProfileRoleClient = {
  from(table: 'profiles'): {
    select(columns: 'role'): {
      eq(column: 'id', value: string): {
        maybeSingle(): Promise<{
          data: { role: string | null } | null
          error: { message?: string } | null
        }>
      }
    }
  }
}

type ProEntitlementClient = {
  from(table: 'pro_entitlements'): {
    select(columns: 'status,current_period_end,grace_period_ends_at,revoked_at'): {
      eq(column: 'user_id', value: string): {
        maybeSingle(): Promise<{
          data: {
            status: string
            current_period_end: string | null
            grace_period_ends_at: string | null
            revoked_at: string | null
          } | null
          error: { message?: string } | null
        }>
      }
    }
  }
}

export type ProAccessResult =
  | { allowed: true; source: 'admin' | 'entitlement' }
  | { allowed: false; reason: 'not_entitled' | 'verification_unavailable' | 'blocked' }

function entitlementIsActive(entitlement: {
  status: string
  current_period_end: string | null
  grace_period_ends_at: string | null
  revoked_at: string | null
}) {
  if (entitlement.revoked_at) return false
  if (entitlement.status === 'past_due') {
    return Boolean(
      entitlement.grace_period_ends_at &&
      new Date(entitlement.grace_period_ends_at).getTime() > Date.now(),
    )
  }
  if (!['active', 'trialing'].includes(entitlement.status)) return false
  if (!entitlement.current_period_end) return true
  const periodEnd = new Date(entitlement.current_period_end).getTime()
  if (periodEnd > Date.now()) return true

  // Keep access during the three-day payment grace period even if the billing
  // webhook has not yet changed the status to past_due.
  const graceEnd = entitlement.grace_period_ends_at
    ? new Date(entitlement.grace_period_ends_at).getTime()
    : periodEnd + 3 * 24 * 60 * 60 * 1000
  return graceEnd > Date.now()
}

/**
 * Server-authoritative Pro authorization. This must be called by every paid
 * operation; client state, query strings, cookies, and user metadata are never
 * accepted as proof of purchase.
 */
export async function verifyProAccess(userId: string, route: string): Promise<ProAccessResult> {
  const userBlock = await getSecurityBlock('user', userId)
  if (userBlock.blocked) {
    await recordSecurityEvent({
      eventType: 'blocked_user_pro_request',
      severity: 'high',
      actorUserId: userId,
      route,
      metadata: { retryAfterSeconds: userBlock.retryAfterSeconds },
    })
    return { allowed: false, reason: 'blocked' }
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    await recordSecurityEvent({
      eventType: 'pro_verification_unavailable',
      severity: 'critical',
      actorUserId: userId,
      route,
    })
    return { allowed: false, reason: 'verification_unavailable' }
  }

  const [profileResult, entitlementResult] = await Promise.all([
    (adminSupabase as unknown as ProfileRoleClient)
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle(),
    (adminSupabase as unknown as ProEntitlementClient)
      .from('pro_entitlements')
      .select('status,current_period_end,grace_period_ends_at,revoked_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (profileResult.error || entitlementResult.error) {
    await recordSecurityEvent({
      eventType: 'pro_verification_failed',
      severity: 'high',
      actorUserId: userId,
      route,
      metadata: {
        profileError: profileResult.error?.message || null,
        entitlementError: entitlementResult.error?.message || null,
      },
    })
    return { allowed: false, reason: 'verification_unavailable' }
  }

  if (profileResult.data?.role === 'admin') return { allowed: true, source: 'admin' }
  if (entitlementResult.data && entitlementIsActive(entitlementResult.data)) {
    return { allowed: true, source: 'entitlement' }
  }

  const ipAddress = await getClientIp()
  const [userLimit, ipLimit] = await Promise.all([
    consumeRateLimit('pro_access_denied_user', userId, 12, 15 * 60),
    consumeRateLimit('pro_access_denied_ip', ipAddress, 30, 15 * 60),
  ])

  await recordSecurityEvent({
    eventType: 'pro_access_denied',
    severity: userLimit.allowed && ipLimit.allowed ? 'medium' : 'critical',
    actorUserId: userId,
    ipAddress,
    route,
    metadata: {
      userAttempts: userLimit.requestCount,
      ipAttempts: ipLimit.requestCount,
    },
  })

  if (!userLimit.allowed) {
    await blockSecurityIdentifier({
      kind: 'user',
      identifier: userId,
      reason: 'repeated_pro_entitlement_bypass',
      durationSeconds: 60 * 60,
      metadata: { route },
    })
  }

  if (!ipLimit.allowed) {
    await blockSecurityIdentifier({
      kind: 'ip',
      identifier: ipAddress,
      reason: 'repeated_pro_entitlement_bypass',
      durationSeconds: 60 * 60,
      metadata: { route },
    })
  }

  return { allowed: false, reason: 'not_entitled' }
}

export function getProAccessError(result: Extract<ProAccessResult, { allowed: false }>) {
  if (result.reason === 'verification_unavailable') {
    return 'Não foi possível validar seu plano agora. Tente novamente em instantes.'
  }
  if (result.reason === 'blocked') {
    return 'Acesso temporariamente bloqueado por segurança.'
  }
  return 'Este recurso requer uma assinatura Pro ativa.'
}
