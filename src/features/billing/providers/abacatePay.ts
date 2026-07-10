import 'server-only'

import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { getNextBillingPeriod } from '@/features/billing/lib/billingCycle'
import { verifyAbacateHmac } from './abacateSignature'

const ABACATE_API_URL = 'https://api.abacatepay.com/v2'
const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type JsonRecord = Record<string, unknown>

type CheckoutResponse = {
  data?: { id?: string; url?: string; customerId?: string | null }
  error?: string | null
  success?: boolean
}

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

export async function createAbacateProCheckout(userId: string) {
  const apiKey = process.env.ABACATEPAY_API_KEY?.trim()
  const productId = process.env.ABACATEPAY_PRO_PRODUCT_ID?.trim()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '')
  if (!apiKey || !productId || !siteUrl) {
    throw new Error('AbacatePay não configurado: defina API key, produto Pro e URL do site.')
  }

  const response = await fetch(`${ABACATE_API_URL}/subscriptions/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ id: productId, quantity: 1 }],
      methods: ['CARD'],
      externalId: userId,
      metadata: { kivoraUserId: userId, plan: 'pro' },
      returnUrl: `${siteUrl}/settings`,
      completionUrl: `${siteUrl}/settings?billing=processing`,
      retryPolicy: { maxRetry: 3, retryEvery: 1 },
    }),
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => null) as CheckoutResponse | null
  const checkoutId = payload?.data?.id
  const checkoutUrl = payload?.data?.url
  if (!response.ok || !payload?.success || !checkoutId || !checkoutUrl) {
    throw new Error(payload?.error || `AbacatePay respondeu com HTTP ${response.status}.`)
  }

  const admin = createAdminClient()
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')
  const { error } = await admin.from('billing_provider_links').upsert({
    provider: 'abacatepay',
    user_id: userId,
    provider_customer_id: payload.data?.customerId || null,
    provider_checkout_id: checkoutId,
    metadata: { checkoutCreatedAt: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'provider,user_id' })
  if (error) throw new Error(`Não foi possível registrar o checkout: ${error.message}`)

  const { error: sessionError } = await admin.from('billing_checkout_sessions').insert({
    provider: 'abacatepay',
    provider_checkout_id: checkoutId,
    user_id: userId,
    status: 'pending',
    metadata: { checkoutCreatedAt: new Date().toISOString() },
  })
  if (sessionError) throw new Error(`Não foi possível vincular o checkout: ${sessionError.message}`)

  return { checkoutId, checkoutUrl }
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

  const subscription = recordField(data, 'subscription')
  const customer = recordField(data, 'customer')
  const checkout = recordField(data, 'checkout')
  const payment = recordField(data, 'payment')
  const checkoutMetadata = recordField(checkout, 'metadata')
  const subscriptionMetadata = recordField(subscription, 'metadata')
  const externalId = stringField(checkout, 'externalId')
  const metadataUserId = stringField(checkoutMetadata, 'kivoraUserId') || stringField(subscriptionMetadata, 'kivoraUserId')
  const userIdCandidate = externalId || metadataUserId
  const userId = userIdCandidate && USER_ID_PATTERN.test(userIdCandidate) ? userIdCandidate : null
  const subscriptionId = stringField(subscription, 'id')
  const checkoutId = stringField(checkout, 'id')
  const customerId = stringField(customer, 'id') || stringField(checkout, 'customerId')
  const frequency = stringField(subscription, 'frequency')
  const eventTime = stringField(payment, 'updatedAt') || stringField(payment, 'createdAt') ||
    stringField(subscription, 'updatedAt') || new Date().toISOString()

  let entitlementStatus: string | null = null
  let currentPeriodEnd: string | null = null
  let gracePeriodEnd: string | null = null

  if (eventType === 'subscription.trial_started') {
    entitlementStatus = 'trialing'
    currentPeriodEnd = stringField(subscription, 'trialEndsAt')
  } else if (eventType === 'subscription.completed' || eventType === 'subscription.renewed') {
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

  const payloadHash = createHash('sha256').update(rawBody).digest('hex')
  const sourceReference = subscriptionId || checkoutId
  const sourceReferenceHash = sourceReference
    ? createHash('sha256').update(`abacatepay:${sourceReference}`).digest('hex')
    : null

  if (['active', 'trialing'].includes(entitlementStatus || '') && (!subscriptionId || !currentPeriodEnd || !sourceReferenceHash)) {
    throw new Error('Paid event is missing a subscription identity or billing period')
  }
  const metadata: JsonRecord = {
    apiVersion,
    devMode: parsed.devMode === true,
    frequency,
    retryNumber: typeof data.retryNumber === 'number' ? data.retryNumber : null,
    cancelledDueTo: stringField(subscription, 'cancelledDueTo'),
  }

  const admin = createAdminClient()
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')
  const { data: result, error } = await (admin as unknown as BillingEventRpc).rpc(
    'apply_abacatepay_subscription_event',
    {
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload_hash: payloadHash,
      p_user_id: userId,
      p_provider_customer_id: customerId,
      p_provider_checkout_id: checkoutId,
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
