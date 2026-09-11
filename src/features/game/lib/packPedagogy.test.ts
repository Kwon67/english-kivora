import { describe, expect, it } from 'vitest'
import { isReadingComprehensionPack } from './packPedagogy'

describe('reading pack classification', () => {
  it('does not mistake a long personalized objective for a reading passage', () => {
    expect(isReadingComprehensionPack('personalized', 'Um objetivo pedagógico detalhado. '.repeat(20))).toBe(false)
  })
  it('preserves explicitly categorized reading packs', () => {
    expect(isReadingComprehensionPack('Leitura', 'A short story.')).toBe(true)
    expect(isReadingComprehensionPack('reading', 'A short story.')).toBe(true)
  })
})
