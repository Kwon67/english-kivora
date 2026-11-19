'use client'

import { useEffect, useRef, useState } from 'react'

/** Local playback for self-review only. No upload, speech recognition or automatic oral score. */
export default function LocalSpeakingPractice({ prompt, practiced, onPracticed, disabled = false }: { disabled?: boolean; prompt: string; practiced: boolean; onPracticed: (value: boolean) => void }) {
  const [supported, setSupported] = useState(false)
  const [recording, setRecording] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const blobUrl = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)
  const lock = useRef(false)
  const panel = useRef<HTMLDetailsElement>(null)
  const permissionRequest = useRef(0)
  useEffect(() => {
    mounted.current = true
    setSupported(typeof navigator.mediaDevices?.getUserMedia === 'function' && typeof window.MediaRecorder !== 'undefined')
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
      stream.current?.getTracks().forEach(track => track.stop())
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current)
    }
  }, [])
  function stop() {
    if (timer.current) clearTimeout(timer.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
    stream.current?.getTracks().forEach(track => track.stop())
    setRecording(false)
  }
  async function start() {
    if (disabled || lock.current || recording) return
    lock.current = true; setRequesting(true); setError('')
    const request = ++permissionRequest.current
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current || !panel.current?.open || request !== permissionRequest.current) { microphone.getTracks().forEach(track => track.stop()); return }
      stream.current = microphone
      const media = new MediaRecorder(microphone)
      recorder.current = media
      const chunks: BlobPart[] = []
      media.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      media.onstop = () => {
        microphone.getTracks().forEach(track => track.stop())
        if (recorder.current !== media) return
        if (timer.current) clearTimeout(timer.current)
        if (!mounted.current) return
        setRecording(false)
        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current)
        blobUrl.current = URL.createObjectURL(new Blob(chunks, { type: media.mimeType }))
        setUrl(blobUrl.current)
      }
      media.onerror = () => { stop(); setError('A gravação falhou. Você pode praticar em voz alta sem gravar.') }
      media.start(); setRecording(true)
      timer.current = setTimeout(stop, 60000)
    } catch {
      stream.current?.getTracks().forEach(track => track.stop())
      if (mounted.current && request === permissionRequest.current) setError('Microfone indisponível ou acesso não permitido. Continue em voz alta, sem gravar.')
    } finally { lock.current = false; if (mounted.current) setRequesting(false) }
  }
  return <details ref={panel} className="study-insight" onToggle={event => {
    if (!event.currentTarget.open) {
      permissionRequest.current++
      if (recorder.current?.state === 'recording') stop()
    }
  }}>
    <summary>Praticar em voz alta · opcional</summary>
    <p>{prompt}</p>
    <p>Ouça a si mesmo e confira se a mensagem tem as informações necessárias. A gravação fica apenas nesta tela e é descartada ao sair. Não há nota automática de fala ou sotaque.</p>
    {supported ? <button className="product-text-link py-3" disabled={requesting || disabled} onClick={() => recording ? stop() : void start()}>{requesting ? 'Aguardando microfone…' : recording ? 'Parar gravação' : url ? 'Gravar novamente' : 'Gravar minha tentativa'}</button>
      : <p>Gravação indisponível neste navegador. Você pode praticar em voz alta sem gravar.</p>}
    {recording && <p role="status">Gravando. Limite de um minuto; pare quando terminar.</p>}
    {url && <audio controls src={url} aria-label="Ouvir minha tentativa" className="my-3 w-full" />}
    {error && <p role="status">{error}</p>}
    <label className="flex items-start gap-3 py-3"><input disabled={disabled} type="checkbox" checked={practiced} onChange={event => onPracticed(event.target.checked)} /><span>Pratiquei em voz alta e conferi minha mensagem. <small>Registro informado por mim.</small></span></label>
  </details>
}
