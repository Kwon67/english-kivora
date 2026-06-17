import { describe, expect, it } from 'vitest'
import { awaitWithGraceTimeout } from './awaitWithGraceTimeout'

describe('awaitWithGraceTimeout', () => {
  it('returns the resolved value when the promise finishes in time', async () => {
    const value = await awaitWithGraceTimeout(
      Promise.resolve('ok'),
      50,
      20,
      () => 'timeout'
    )

    expect(value).toBe('ok')
  })

  it('waits for a slow promise that finishes just after the timeout', async () => {
    const value = await awaitWithGraceTimeout(
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('late-ok'), 30)
      }),
      10,
      100,
      () => 'timeout'
    )

    expect(value).toBe('late-ok')
  })

  it('returns the timeout fallback when the promise never resolves', async () => {
    const value = await awaitWithGraceTimeout(
      new Promise<string>(() => undefined),
      10,
      15,
      () => 'timeout'
    )

    expect(value).toBe('timeout')
  })
})