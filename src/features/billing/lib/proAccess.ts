import 'server-only'

export function entitlementIsActive(entitlement: {
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
