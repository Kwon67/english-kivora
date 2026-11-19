'use client'
import { useEffect, useRef, useState } from 'react'

import AudioButton, { AUDIO_STOP_EVENT } from '@/components/ui/AudioButton'
import type { AudioVoice } from '@/lib/audioRoles'
import { usePublishedAudio } from '@/lib/usePublishedAudio'

/** Recorded model and optional offline device voice for self-directed repetition. */
export default function ShadowingPractice({ text, voiceName }: { text: string; voiceName: AudioVoice }) {
  const recorded = usePublishedAudio(text,voiceName).url
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState('')
  const [speed, setSpeed] = useState('0.85')
  const utterance = useRef<SpeechSynthesisUtterance | null>(null)
  useEffect(() => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return
    const voicesChanged = () => setVoice(window.speechSynthesis.getVoices().find(item => item.localService && item.lang.startsWith('en')) ?? null)
    const stopLocal = () => { if (utterance.current) { utterance.current = null; window.speechSynthesis.cancel(); setPlaying(false) } }
    window.addEventListener(AUDIO_STOP_EVENT,stopLocal)
    voicesChanged()
    window.speechSynthesis.addEventListener('voiceschanged', voicesChanged)
    return () => {
      window.removeEventListener(AUDIO_STOP_EVENT,stopLocal)
      window.speechSynthesis.removeEventListener('voiceschanged', voicesChanged)
      if (utterance.current) { utterance.current.onend = null; utterance.current.onerror = null; window.speechSynthesis.cancel() }
    }
  }, [])
  function stop() { utterance.current = null; window.speechSynthesis.cancel(); setPlaying(false) }
  function play() {
    if (!voice) return
    window.dispatchEvent(new Event(AUDIO_STOP_EVENT))
    window.speechSynthesis.cancel()
    const speech = new SpeechSynthesisUtterance(text)
    speech.lang = 'en-US'; speech.rate = Number(speed)
    speech.voice = voice
    speech.onend = () => { if (utterance.current === speech) { setPlaying(false); utterance.current = null } }
    speech.onerror = () => { if (utterance.current === speech) { setPlaying(false); setMessage('A voz do dispositivo não está disponível. Você pode continuar pela transcrição.') } }
    utterance.current = speech; setMessage(''); setPlaying(true)
    try { window.speechSynthesis.speak(speech) }
    catch { utterance.current = null; setPlaying(false); setMessage('A voz do dispositivo não está disponível. Você pode continuar pela transcrição.') }
  }
  return <details className="study-insight" onToggle={event => { if (!event.currentTarget.open) { if (utterance.current) stop(); window.dispatchEvent(new Event(AUDIO_STOP_EVENT)) } }}>
    <summary>Repetir com o áudio · opcional</summary>
    <p>Depois de compreender, ouça o trecho e repita acompanhando o ritmo. Use a transcrição se precisar. Esta prática não grava nem avalia sua pronúncia.</p>
    <details><summary>Ver transcrição</summary><p lang="en">{text}</p></details>
    {recorded && <AudioButton fallbackText={text} voice={voiceName} label="Ouvir gravação" />}
    {voice ? <div className="flex flex-wrap items-center gap-3 py-3">
      <button type="button" className="product-text-link" onClick={playing ? stop : play}>{playing ? 'Parar áudio' : 'Ouvir trecho'}</button>
      <label className="flex items-center gap-2">Velocidade da voz local <select value={speed} disabled={playing} onChange={event => setSpeed(event.target.value)}><option value="0.7">Lenta</option><option value="0.85">Moderada</option><option value="1">Normal</option></select></label>
    </div> : <p>Sem voz local em inglês disponível neste navegador. A transcrição continua acessível.</p>}
    <p role="status">{message}</p>
  </details>
}
