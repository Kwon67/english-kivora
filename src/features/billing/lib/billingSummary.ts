import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'

export type BillingSummary = {
  access: 'admin' | 'pro' | 'free'
  status: string | null
  currentPeriodEnd: string | null
  gracePeriodEndsAt: string | null
  canCancel: boolean
  checkoutConfigured: boolean
}

export async function getBillingSummary(userId: string, role: string | null): Promise<BillingSummary> {
  if (role === 'admin') {
    return { access: 'admin', status: 'active', currentPeriodEnd: null, gracePeriodEndsAt: null, canCancel: false, checkoutConfigured: false }
  }

  const admin = createAdminClient()
  const checkoutConfigured = Boolean(
    process.env.ABACATEPAY_API_KEY?.trim() &&
    process.env.ABACATEPAY_PRO_PRODUCT_ID?.trim() &&
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
  )
  if (!admin) return { access: 'free', status: null, currentPeriodEnd: null, gracePeriodEndsAt: null, canCancel: false, checkoutConfigured }

  const [{ data: entitlement }, { data: link }] = await Promise.all([
    admin.from('pro_entitlements')
      .select('status,current_period_end,grace_period_ends_at,revoked_at')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('billing_provider_links')
      .select('provider_subscription_id')
      .eq('provider', 'abacatepay')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const pro = Boolean(
    entitlement &&
    !entitlement.revoked_at &&
    ['active', 'trialing', 'past_due'].includes(entitlement.status),
  )
  return {
    access: pro ? 'pro' : 'free',
    status: entitlement?.status || null,
    currentPeriodEnd: entitlement?.current_period_end || null,
    gracePeriodEndsAt: entitlement?.grace_period_ends_at || null,
    canCancel: pro && Boolean(link?.provider_subscription_id),
    checkoutConfigured,
  }
}
