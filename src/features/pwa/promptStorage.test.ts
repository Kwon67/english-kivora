import { afterEach, expect, it, vi } from 'vitest'
import { isPromptDismissed, rememberPromptDismissal } from './promptStorage'

afterEach(() => vi.unstubAllGlobals())

it('keeps the install and notification choices independent when storage is available', () => {
  const preferences = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => preferences.get(key) ?? null,
    setItem: (key: string, value: string) => preferences.set(key, value),
  })
  rememberPromptDismissal('install')
  expect(isPromptDismissed('install')).toBe(true)
  expect(isPromptDismissed('push')).toBe(false)
})

it('keeps optional prompts dismissed when the browser rejects reads and writes', () => {
  const blocked = () => { throw new DOMException('Storage disabled', 'SecurityError') }
  vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked })
  expect(isPromptDismissed('install')).toBe(true)
  expect(() => rememberPromptDismissal('push')).not.toThrow()
})
