import 'server-only'

import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { getNextBillingPeriod } from '@/features/billing/lib/billingCycle'
import { verifyAbacateHmac } from './abacateSignature'

const ABACATE_API_URL = 'https://api.abacatepay.com/v2'

type JsonRecord = Record<string, unknown>

type AbacateMutationResponse = {
  data?: { id?: string; status?: string }
  error?: string | null
  success?: boolean
}

type BillingEventRpc = {
  rpc(name: 'apply_abacatepay_subscription_event', args: {
    p_event_id: string
    p_event_type: string
    p_payload_hash: string
    p_user_id: string | null
    p_provider_customer_id: string | null
    p_provider_checkout_id: string | null
    p_provider_subscription_id: string | null
    p_entitlement_status: string | null
    p_current_period_end: string | null
    p_grace_period_ends_at: string | null
    p_source_reference_hash: string | null
    p_metadata: JsonRecord
  }): Promise<{ data: unknown; error: { message?: string } | null }>
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringField(record: JsonRecord | null, key: string) {
  const value = record?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function recordField(record: JsonRecord | null, key: string) {
  const value = record?.[key]
  return isRecord(value) ? value : null
}

export function verifyAbacateWebhook(rawBody: string, secretFromUrl: string | null, signature: string | null) {
  const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET?.trim() || null
  const publicKey = process.env.ABACATEPAY_WEBHOOK_PUBLIC_KEY?.trim() || null
  return verifyAbacateHmac({ rawBody, secretFromUrl, signature, expectedSecret, publicKey })
}

export async function cancelAbacateSubscription(subscriptionId: string) {
  const apiKey = process.env.ABACATEPAY_API_KEY?.trim()
  if (!apiKey) throw new Error('ABACATEPAY_API_KEY ausente')

  const response = await fetch(`${ABACATE_API_URL}/subscriptions/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: subscriptionId }),
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null) as AbacateMutationResponse | null
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `AbacatePay respondeu com HTTP ${response.status}.`)
  }
}

export async function applyAbacateWebhook(rawBody: string) {
  const parsed: unknown = JSON.parse(rawBody)
  if (!isRecord(parsed)) throw new Error('Invalid webhook payload')

  const eventId = stringField(parsed, 'id')
  const eventType = stringField(parsed, 'event')
  const apiVersion = parsed.apiVersion
  const data = recordField(parsed, 'data')
  if (!eventId || !eventType || apiVersion !== 2 || !data) throw new Error('Invalid webhook envelope')
  if (parsed.devMode === true) return { applied: false, reason: 'test_event' }
  if (eventType === 'subscription.trial_started' || eventType === 'subscription.completed') {
    return { applied: false, reason: 'upgrades_unavailable' }
  }

  const subscription = recordField(data, 'subscription')
  const customer = recordField(data, 'customer')
  const checkout = recordField(data, 'checkout')
  const payment = recordField(data, 'payment')
  const subscriptionId = stringField(subscription, 'id')
  const checkoutId = stringField(checkout, 'id')
  const customerId = stringField(customer, 'id') || stringField(checkout, 'customerId')
  const frequency = stringField(subscription, 'frequency')
  const eventTime = stringField(payment, 'updatedAt') || stringField(payment, 'createdAt') ||
    stringField(subscription, 'updatedAt') || new Date().toISOString()

  let entitlementStatus: string | null = null
  let currentPeriodEnd: string | null = null
  let gracePeriodEnd: string | null = null

  if (eventType === 'subscription.renewed') {
    entitlementStatus = 'active'
    currentPeriodEnd = getNextBillingPeriod(eventTime, frequency)
  } else if (eventType === 'subscription.payment_failed') {
    entitlementStatus = 'past_due'
    gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  } else if (eventType === 'subscription.cancelled') {
    entitlementStatus = 'revoked'
  } else if (['checkout.refunded', 'checkout.disputed', 'checkout.lost'].includes(eventType)) {
    entitlementStatus = 'revoked'
  }

  if (!entitlementStatus) return { applied: false, reason: 'event_not_actionable' }
  if (!subscriptionId && !checkoutId) return { applied: false, reason: 'subscription_not_linked' }

  const admin = createAdminClient()
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')

  // No new subscription is granted while self-service upgrades are unavailable.
  // Existing subscriptions can renew only through an already linked live account.
  const links = admin.from('billing_provider_links').select('user_id').eq('provider', 'abacatepay')
  const { data: link, error: linkError } = subscriptionId
    ? await links.eq('provider_subscription_id', subscriptionId).maybeSingle()
    : await links.eq('provider_checkout_id', checkoutId!).maybeSingle()
  if (linkError) throw new Error('Billing link lookup failed')
  if (!link) return { applied: false, reason: 'subscription_not_linked' }

  const { data: entitlement, error: entitlementError } = await admin.from('pro_entitlements')
    .select('status,revoked_at')
    .eq('user_id', link.user_id)
    .eq('source', 'abacatepay')
    .maybeSingle()
  if (entitlementError) throw new Error('Billing entitlement lookup failed')
  if (!entitlement || entitlement.revoked_at || !['active', 'trialing', 'past_due'].includes(entitlement.status)) {
    return { applied: false, reason: 'subscription_not_active' }
  }

  const payloadHash = createHash('sha256').update(rawBody).digest('hex')
  const sourceReference = subscriptionId || checkoutId
  const sourceReferenceHash = sourceReference
    ? createHash('sha256').update(`abacatepay:${sourceReference}`).digest('hex')
    : null

  if (entitlementStatus === 'active' && (!subscriptionId || !currentPeriodEnd || !sourceReferenceHash)) {
    throw new Error('Paid event is missing a subscription identity or billing period')
  }
  const metadata: JsonRecord = {
    apiVersion,
    frequency,
    retryNumber: typeof data.retryNumber === 'number' ? data.retryNumber : null,
    cancelledDueTo: stringField(subscription, 'cancelledDueTo'),
  }

  const { data: result, error } = await (admin as unknown as BillingEventRpc).rpc(
    'apply_abacatepay_subscription_event',
    {
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload_hash: payloadHash,
      p_user_id: link.user_id,
      p_provider_customer_id: customerId,
      p_provider_checkout_id: subscriptionId ? null : checkoutId,
      p_provider_subscription_id: subscriptionId,
      p_entitlement_status: entitlementStatus,
      p_current_period_end: currentPeriodEnd,
      p_grace_period_ends_at: gracePeriodEnd,
      p_source_reference_hash: sourceReferenceHash,
      p_metadata: metadata,
    },
  )
  if (error) throw new Error(error.message || 'Billing event transaction failed')
  return result
}
