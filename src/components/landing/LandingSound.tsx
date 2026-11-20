'use client'

import { useSyncExternalStore } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import styles from './LandingPolish.module.css'

const key = 'kivora-landing-sound'
const listeners = new Set<() => void>()
let enabled = false
let audio: AudioContext | undefined
const tones = { click: [480], correct: [523, 659, 784], wrong: [350, 262], combo: [523, 659, 784, 1047] }

function preference() {
  try { return localStorage.getItem(key) === 'on' } catch { return enabled }
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  window.addEventListener('storage', callback)
  return () => { listeners.delete(callback); window.removeEventListener('storage', callback) }
}

export function playLandingSound(cue: keyof typeof tones, gesture = true) {
  if (!preference() || document.hidden) return
  const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context || (!gesture && audio?.state !== 'running')) return
  try {
    audio ??= new Context()
    if (audio.state === 'suspended') void audio.resume().catch(() => {})
    const context = audio
    tones[cue].forEach((pitch, index) => {
      const start = context.currentTime + index * .065
      const note = context.createOscillator()
      const gain = context.createGain()
      note.type = 'sine'
      note.frequency.value = pitch
      gain.gain.setValueAtTime(.001, start)
      gain.gain.exponentialRampToValueAtTime(.055, start + .012)
      gain.gain.exponentialRampToValueAtTime(.001, start + .105)
      note.connect(gain).connect(context.destination)
      note.onended = () => { note.disconnect(); gain.disconnect() }
      note.start(start)
      note.stop(start + .11)
    })
  } catch { /* Audio support is optional. */ }
}

export default function LandingSound() {
  const on = useSyncExternalStore(subscribe, preference, () => false)
  function toggle() {
    enabled = !preference()
    try { localStorage.setItem(key, enabled ? 'on' : 'off') } catch { /* Use the in-memory preference. */ }
    listeners.forEach(listener => listener())
    if (enabled) playLandingSound('click')
    else if (audio) {
      const context = audio
      audio = undefined
      void context.close().catch(() => {})
    }
  }
  return <button type="button" data-sound-control className={styles.sound} aria-label="Sons da interface" aria-pressed={on} onClick={toggle}>
    {on ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
  </button>
}
