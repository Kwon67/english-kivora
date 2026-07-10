import 'server-only'

import { createAdminClient, createClient } from '@/lib/supabase/server'

type EntitlementClient = {
  from(table: 'pro_entitlements'): {
    select(columns: 'status,current_period_end,grace_period_ends_at'): {
      eq(column: 'user_id', value: string): {
        maybeSingle(): Promise<{
          data: {
            status: string
            current_period_end: string | null
            grace_period_ends_at: string | null
          } | null
          error: { message?: string } | null
        }>
      }
    }
  }
}

export type SubscriptionAlert =
  | { kind: 'renewal'; renewalDate: string }
  | { kind: 'grace'; graceDate: string }
  | null

export async function getSubscriptionAlert(): Promise<SubscriptionAlert> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  if (!admin) return null

  const { data, error } = await (admin as unknown as EntitlementClient)
    .from('pro_entitlements')
    .select('status,current_period_end,grace_period_ends_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error || !data) return null

  const now = Date.now()
  if (data.status === 'past_due' || (data.current_period_end && new Date(data.current_period_end).getTime() <= now)) {
    const graceDate = data.grace_period_ends_at ||
      new Date(new Date(data.current_period_end || now).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    if (new Date(graceDate).getTime() > now) {
      return { kind: 'grace', graceDate }
    }
    return null
  }

  if (!['active', 'trialing'].includes(data.status) || !data.current_period_end) return null
  const renewalTime = new Date(data.current_period_end).getTime()
  if (renewalTime <= now || renewalTime > now + 7 * 24 * 60 * 60 * 1000) return null

  return { kind: 'renewal', renewalDate: data.current_period_end }
}
