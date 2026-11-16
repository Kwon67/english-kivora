import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClient, maybeSingle, rpc } = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createAdminClient }))

import { applyAbacateWebhook } from './abacatePay'

function subscriptionEvent(event: string, devMode = false) {
  return JSON.stringify({
    id: 'evt_subscription_001',
    event,
    apiVersion: 2,
    devMode,
    data: { subscription: { id: 'sub_001', frequency: 'MONTHLY', updatedAt: '2026-11-14T00:00:00Z' } },
  })
}

beforeEach(() => {
  maybeSingle.mockReset()
  rpc.mockReset()
  createAdminClient.mockReset().mockReturnValue({
    from: vi.fn(() => {
      const query = { select: () => query, eq: () => query, maybeSingle }
      return query
    }),
    rpc,
  })
})

describe('billing webhook while upgrades are unavailable', () => {
  it.each(['subscription.completed', 'subscription.trial_started'])('does not grant access on %s', async event => {
    expect(await applyAbacateWebhook(subscriptionEvent(event))).toEqual({
      applied: false,
      reason: 'upgrades_unavailable',
    })
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('ignores billing test events', async () => {
    expect(await applyAbacateWebhook(subscriptionEvent('subscription.renewed', true))).toMatchObject({
      applied: false,
      reason: 'test_event',
    })
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('requires a server-side link and an existing entitlement to renew', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    expect(await applyAbacateWebhook(subscriptionEvent('subscription.renewed'))).toMatchObject({
      applied: false,
      reason: 'subscription_not_linked',
    })

    maybeSingle
      .mockResolvedValueOnce({ data: { user_id: 'existing-member' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    expect(await applyAbacateWebhook(subscriptionEvent('subscription.renewed'))).toMatchObject({
      applied: false,
      reason: 'subscription_not_active',
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('accepts a renewal for an already entitled member', async () => {
    maybeSingle
      .mockResolvedValueOnce({ data: { user_id: 'existing-member' }, error: null })
      .mockResolvedValueOnce({ data: { status: 'active', revoked_at: null }, error: null })
    rpc.mockResolvedValueOnce({ data: { applied: true }, error: null })

    expect(await applyAbacateWebhook(subscriptionEvent('subscription.renewed'))).toEqual({ applied: true })
    expect(rpc).toHaveBeenCalledExactlyOnceWith('apply_abacatepay_subscription_event', expect.objectContaining({
      p_user_id: 'existing-member',
      p_entitlement_status: 'active',
      p_provider_subscription_id: 'sub_001',
    }))
  })
})
