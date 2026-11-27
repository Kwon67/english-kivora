'use client'

let audio: AudioContext | undefined
const tones = { correct: [523, 659, 784], wrong: [350, 262] }

function playTone(context: AudioContext, pitch: number, endPitch: number, start: number, length: number, level: number, attack = .006) {
  const note = context.createOscillator()
  const gain = context.createGain()
  note.type = 'sine'
  note.frequency.setValueAtTime(pitch, start)
  note.frequency.exponentialRampToValueAtTime(endPitch, start + length * .75)
  gain.gain.setValueAtTime(.001, start)
  gain.gain.exponentialRampToValueAtTime(level, start + attack)
  gain.gain.exponentialRampToValueAtTime(.001, start + length)
  note.connect(gain).connect(context.destination)
  note.onended = () => { note.disconnect(); gain.disconnect() }
  note.start(start)
  note.stop(start + length)
}

export async function playLandingSound(cue: keyof typeof tones) {
  if (document.hidden) return
  const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return

  try {
    audio ??= new Context()
    const context = audio
    if (context.state !== 'running') await context.resume()
    if (document.hidden) return
    const start = context.currentTime
    tones[cue].forEach((pitch, index) => playTone(context, pitch, pitch, start + index * .065, .105, .04))
  } catch { /* Sound support varies across browsers. */ }
}
