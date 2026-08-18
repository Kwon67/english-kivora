import { describe, expect, it } from 'vitest'
import { getDisplayPackDescription } from '@/features/study/lib/packDescription'

const FALLBACK = 'Sessão preparada para manter sua consistência.'

describe('getDisplayPackDescription', () => {
  it('keeps a real description', () => {
    expect(getDisplayPackDescription('Frases de viagem para iniciantes', FALLBACK)).toBe(
      'Frases de viagem para iniciantes'
    )
  })

  it('replaces empty and whitespace-only descriptions', () => {
    expect(getDisplayPackDescription(null, FALLBACK)).toBe(FALLBACK)
    expect(getDisplayPackDescription('', FALLBACK)).toBe(FALLBACK)
    expect(getDisplayPackDescription('   ', FALLBACK)).toBe(FALLBACK)
  })

  it('replaces anki import artifacts', () => {
    expect(getDisplayPackDescription('Imported from Pack10_EnglishPhrases.apkg', FALLBACK)).toBe(FALLBACK)
    expect(getDisplayPackDescription('Imported from anki_english.apkg', FALLBACK)).toBe(FALLBACK)
    expect(getDisplayPackDescription('imported from pack11.apkg', FALLBACK)).toBe(FALLBACK)
  })

  it('replaces generator boilerplate', () => {
    expect(
      getDisplayPackDescription('Deck gerado automaticamente por IA sobre o tema: Frases longas', FALLBACK)
    ).toBe(FALLBACK)
  })

  it('trims surrounding whitespace on kept descriptions', () => {
    expect(getDisplayPackDescription('  Conversas curtas  ', FALLBACK)).toBe('Conversas curtas')
  })
})
