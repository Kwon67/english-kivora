'use client'

let audio: AudioContext | undefined
const tones = { correct: [523, 659, 784], wrong: [350, 262], combo: [523, 659, 784, 1047] }

function playTone(context: AudioContext, pitch: number, endPitch: number, start: number, length: number, level: number) {
  const note = context.createOscillator()
  const gain = context.createGain()
  note.type = 'sine'
  note.frequency.setValueAtTime(pitch, start)
  note.frequency.exponentialRampToValueAtTime(endPitch, start + length * .75)
  gain.gain.setValueAtTime(.001, start)
  gain.gain.exponentialRampToValueAtTime(level, start + .006)
  gain.gain.exponentialRampToValueAtTime(.001, start + length)
  note.connect(gain).connect(context.destination)
  note.onended = () => { note.disconnect(); gain.disconnect() }
  note.start(start)
  note.stop(start + length)
}

export function playLandingSound(cue: 'click' | keyof typeof tones, gesture = true) {
  if (document.hidden || (!gesture && audio?.state !== 'running')) return
  const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return

  try {
    audio ??= new Context()
    if (audio.state !== 'running') void audio.resume().catch(() => {})
    const context = audio
    const start = context.currentTime
    if (cue === 'click') {
      playTone(context, 610, 430, start, .065, .045)
      playTone(context, 920, 720, start + .008, .033, .016)
    } else {
      tones[cue].forEach((pitch, index) => playTone(context, pitch, pitch, start + index * .065, .105, .04))
    }
  } catch { /* Sound support varies across browsers. */ }
}
