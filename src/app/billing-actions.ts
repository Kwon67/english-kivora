'use server'

import { revalidatePath } from 'next/cache'
import { cancelAbacateSubscription } from '@/features/billing/providers/abacatePay'
import { consumeRateLimit, recordSecurityEvent } from '@/features/security/lib/security'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function cancelProSubscriptionAction(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const admin = createAdminClient()
  if (!admin) return { ok: false, error: 'Serviço de assinatura indisponível.' }
  const { data: link } = await admin
    .from('billing_provider_links')
    .select('provider_subscription_id')
    .eq('provider', 'abacatepay')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!link?.provider_subscription_id) {
    return { ok: false, error: 'Assinatura ativa não encontrada.' }
  }

  const limit = await consumeRateLimit('billing_cancel_user', user.id, 3, 60 * 60)
  if (!limit.allowed) return { ok: false, error: 'Muitas tentativas. Aguarde antes de tentar novamente.' }

  try {
    await cancelAbacateSubscription(link.provider_subscription_id)
    const now = new Date().toISOString()
    await admin.from('pro_entitlements').update({
      status: 'canceled',
      revoked_at: now,
      downgraded_at: now,
      grace_period_ends_at: null,
      updated_at: now,
    }).eq('user_id', user.id)
    await recordSecurityEvent({
      eventType: 'billing_subscription_cancelled',
      severity: 'medium',
      actorUserId: user.id,
      route: '/settings',
      metadata: { provider: 'abacatepay' },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (error) {
    console.error('AbacatePay cancellation failed', error)
    return { ok: false, error: 'Não foi possível cancelar a assinatura agora.' }
  }
}
