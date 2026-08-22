import { describe, expect, it } from 'vitest'

import { getCardEnglishPhrase, resolveCardAudioUrl } from './cardAudio'

describe('resolveCardAudioUrl', () => {
  it('prefers the stored audio of a pack card', () => {
    expect(
      resolveCardAudioUrl({
        audio_url: 'https://cdn.example.com/hello.mp3',
        english_phrase: 'Hello there.',
      })
    ).toBe('https://cdn.example.com/hello.mp3')
  })

  // Blitz IA monta os cards em memória com `audio_url: null` e a frase espelhada em `en`,
  // que era justamente o caso onde o botão de áudio sumia.
  it('falls back to on-demand synthesis for an AI card', () => {
    expect(
      resolveCardAudioUrl({
        audio_url: null,
        english_phrase: 'The manager asked us to finish the report.',
        en: 'The manager asked us to finish the report.',
      })
    ).toBe('/api/tts/preview?text=The%20manager%20asked%20us%20to%20finish%20the%20report.')
  })

  it('reads the phrase from `en` when the row field is absent', () => {
    expect(resolveCardAudioUrl({ audio_url: null, en: 'Good morning!' })).toBe(
      '/api/tts/preview?text=Good%20morning!'
    )
  })

  // Sem isso o endpoint responderia com a própria frase-demo dele para um texto vazio.
  it('returns null when there is nothing to say', () => {
    expect(resolveCardAudioUrl({ audio_url: null, english_phrase: '   ', en: '' })).toBeNull()
    expect(resolveCardAudioUrl({ audio_url: null })).toBeNull()
  })
})

describe('getCardEnglishPhrase', () => {
  it('prefers english_phrase and falls back to en', () => {
    expect(getCardEnglishPhrase({ audio_url: null, english_phrase: 'row', en: 'mirror' })).toBe('row')
    expect(getCardEnglishPhrase({ audio_url: null, en: 'mirror' })).toBe('mirror')
    expect(getCardEnglishPhrase({ audio_url: null })).toBe('')
  })
})
