export const ELEVENLABS_MODEL = 'eleven_v4'
export const ELEVENLABS_VOICES = {
  siren: 'eXpIbVcVbLo8ZJQDlDnl',
  lauren: 'DODLEQrClDo8wCz460ld',
  jarnathan: 'c6SfcYrb2t09NHXiT80T',
} as const
export type AudioVoice = keyof typeof ELEVENLABS_VOICES
export const WELCOME_TEXT =
  'Welcome to Kivora English! Every new word is another step toward speaking English with confidence.'

export function tutorVoice(scenario: string): AudioVoice {
  return ['coffee-shop', 'airport', 'first-date', 'giving-opinion'].includes(scenario) ? 'lauren' : 'jarnathan'
}

export function lessonLines(id: string, text: string): { speaker?: string; text: string; voice: AudioVoice }[] {
  if (id === 'travel-hotel-02') {
    return Array.from(
      text.matchAll(/(Receptionist|Guest): (.*?)(?= (?:Receptionist|Guest): |$)/g),
      ([, speaker, line]) => ({ speaker, text: line, voice: speaker === 'Receptionist' ? 'lauren' : 'jarnathan' }),
    )
  }
  return [{ text, voice: id === 'a1-meeting-01' ? 'lauren' : id === 'travel-outing-03' ? 'jarnathan' : 'siren' }]
}

export function practiceVoice(id: string): AudioVoice {
  return id.startsWith('travel-') ? 'jarnathan' : 'lauren'
}
