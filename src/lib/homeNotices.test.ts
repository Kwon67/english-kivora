import { afterEach, describe, expect, it } from 'vitest'
import { consumeHomeNeedsResync, markHomeNeedsResync } from './homeNotices'

describe('home resync flag', () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it('marca e consome uma vez', () => {
    expect(consumeHomeNeedsResync()).toBe(false)
    markHomeNeedsResync()
    expect(consumeHomeNeedsResync()).toBe(true)
    expect(consumeHomeNeedsResync()).toBe(false)
  })
})
