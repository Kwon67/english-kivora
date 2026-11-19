import index from './staticAudioIndex.json'
import type { AudioVoice } from './audioRoles'

const ready: Readonly<Record<string, string>> = index
export function staticAudioUrl(text?: string | null, voice: AudioVoice = 'lauren') {
  const hash = text && ready[voice + ':' + text.trim().normalize('NFC')]
  return hash ? '/audio/kivora/' + hash + '.mp3' : null
}
