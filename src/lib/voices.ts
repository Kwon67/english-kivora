import { type AudioVoice } from './audioRoles'

export const TTS_DEFAULT_VOICE = 'lauren'
export const VOICES = [
  { id: 'lauren', name: 'Lauren', meta: 'conversação e pronúncia' },
  { id: 'siren', name: 'Siren', meta: 'narração' },
  { id: 'jarnathan', name: 'Jarnathan', meta: 'conversação e personagens' },
] as const
export function officialVoice(id: string): AudioVoice | null {
  return id === 'lauren' || id === 'siren' || id === 'jarnathan' ? id : null
}
export const freeVoices = ['en-US-AvaMultilingualNeural', 'en-US-AndrewMultilingualNeural', 'en-US-JennyNeural'] as const
export const fallbackVoice = {
  lauren: freeVoices[0], jarnathan: freeVoices[1], siren: freeVoices[2],
} as const

/** Preserve the character of pre-migration URLs before checking the premium catalog. */
export function playbackRole(id: string): AudioVoice {
  if (['en-US-RogerNeural', 'en-US-AndrewMultilingualNeural', 'en-US-BrianMultilingualNeural', 'en-US-SteffanNeural'].includes(id)) return 'jarnathan'
  if (['en-US-AvaMultilingualNeural', 'en-US-AriaNeural', 'en-US-JennyNeural'].includes(id)) return 'siren'
  return officialVoice(id) ?? 'lauren'
}
export function privateCardAudioUrl(id: string, voice: string) {
  return '/api/card-audio/' + id + '?voice=' + encodeURIComponent(voice)
}
