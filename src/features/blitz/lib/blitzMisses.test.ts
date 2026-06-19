import { describe, expect, it } from 'vitest'
import {
  buildSpeechMissDetails,
  formatSpeechMissDetail,
  getVisibleBlitzMisses,
} from '@/features/blitz/lib/blitzMisses'

describe('blitzMisses', () => {
  it('summarizes missing and extra words from speech', () => {
    const details = buildSpeechMissDetails('I would like tea', 'I would like coffee')

    expect(details.missingWords).toContain('tea')
    expect(details.extraWords).toContain('coffee')
    expect(formatSpeechMissDetail(details)).toMatch(/faltou: tea/)
    expect(formatSpeechMissDetail(details)).toMatch(/disse: coffee/)
  })

  it('limits visible misses to five items', () => {
    const misses = Array.from({ length: 7 }, (_, index) => ({
      id: `${index}`,
      cardId: `${index}`,
      englishPhrase: `Phrase ${index}`,
      portugueseHint: `Hint ${index}`,
      mode: 'speaking' as const,
    }))

    const { visible, hiddenCount } = getVisibleBlitzMisses(misses)

    expect(visible).toHaveLength(5)
    expect(hiddenCount).toBe(2)
  })
})