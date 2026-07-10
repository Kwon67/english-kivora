'use server'

import { revalidatePath } from 'next/cache'
import { cancelAbacateSubscription, createAbacateProCheckout } from '@/features/billing/providers/abacatePay'
import { consumeRateLimit, getClientIp, recordSecurityEvent } from '@/features/security/lib/security'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export type CreateProCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export async function createProCheckoutAction(): Promise<CreateProCheckoutResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Entre na sua conta para assinar o plano Pro.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role === 'admin') {
    return { ok: false, error: 'Administradores já possuem acesso integral.' }
  }

  const admin = createAdminClient()
  if (!admin) return { ok: false, error: 'Serviço de assinatura indisponível.' }
  const { data: entitlement } = await admin
    .from('pro_entitlements')
    .select('status,revoked_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (entitlement && !entitlement.revoked_at && ['active', 'trialing', 'past_due'].includes(entitlement.status)) {
    return { ok: false, error: 'Sua conta já possui uma assinatura Pro vinculada.' }
  }

  const ip = await getClientIp()
  const [userLimit, ipLimit] = await Promise.all([
    consumeRateLimit('billing_checkout_user', user.id, 5, 15 * 60),
    consumeRateLimit('billing_checkout_ip', ip, 12, 15 * 60),
  ])
  if (!userLimit.allowed || !ipLimit.allowed) {
    return { ok: false, error: 'Muitas tentativas de checkout. Aguarde alguns minutos.' }
  }

  try {
    const checkout = await createAbacateProCheckout(user.id)
    await recordSecurityEvent({
      eventType: 'billing_checkout_created',
      severity: 'low',
      actorUserId: user.id,
      ipAddress: ip,
      route: '/settings',
      metadata: { provider: 'abacatepay', checkoutId: checkout.checkoutId },
    })
    return { ok: true, url: checkout.checkoutUrl }
  } catch (error) {
    console.error('AbacatePay checkout creation failed', error)
    return { ok: false, error: 'Não foi possível iniciar o checkout agora. Tente novamente em instantes.' }
  }
}

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
