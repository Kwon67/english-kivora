import { describe, expect, it } from 'vitest'
import { getNextBillingPeriod } from './billingCycle'

describe('getNextBillingPeriod', () => {
  it('advances supported AbacatePay billing frequencies', () => {
    expect(getNextBillingPeriod('2026-07-10T12:00:00.000Z', 'WEEKLY')).toBe('2026-07-17T12:00:00.000Z')
    expect(getNextBillingPeriod('2026-07-10T12:00:00.000Z', 'MONTHLY')).toBe('2026-08-10T12:00:00.000Z')
    expect(getNextBillingPeriod('2026-07-10T12:00:00.000Z', 'ANNUALLY')).toBe('2027-07-10T12:00:00.000Z')
  })

  it('clamps month-end renewals instead of rolling into the following month', () => {
    expect(getNextBillingPeriod('2026-01-31T12:00:00.000Z', 'MONTHLY')).toBe('2026-02-28T12:00:00.000Z')
    expect(getNextBillingPeriod('2024-02-29T12:00:00.000Z', 'ANNUALLY')).toBe('2025-02-28T12:00:00.000Z')
  })

  it('rejects malformed dates', () => {
    expect(getNextBillingPeriod('not-a-date', 'MONTHLY')).toBeNull()
  })
})

