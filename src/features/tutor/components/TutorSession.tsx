'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { restoreTutorDraft, type TutorMessage as Message } from '@/features/tutor/lib/tutorDraft'
import {
  AlertCircle,
  ArrowLeft,
  Mic,
  MicOff,
  RefreshCcw,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react'
import { generateTutorResponse } from '@/app/actions'
import { getTutorScenario } from '@/features/tutor/lib/scenarios'
import Link from 'next/link'
import EmptyState from '@/components/ui/EmptyState'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import {
  getMicrophoneErrorMessage,
  getMicrophonePermissionHelpMessage,
  requestMicrophoneAccess,
} from '@/lib/microphone'
import { tutorVoice } from '@/lib/audioRoles'
import { attachProgressiveAudio } from '../lib/progressiveAudio'
import { resolvePublishedAudio } from '@/lib/usePublishedAudio'
import { homeShellClass } from '@/lib/homeStyles'

export default function TutorSession({ userId, scenarioId, premiumSpeech = false }: { userId: string; scenarioId: string; premiumSpeech?: boolean }) {
  const scenario = getTutorScenario(scenarioId)
  const storageKey = `kivora-tutor-draft-v1:${userId}:${scenarioId}`
  const [ready, setReady] = useState(false)
  const [storageFailed, setStorageFailed] = useState(false)
  const [messages, setMessages] = useState<Message[]>(scenario ? [{role:'assistant',content:scenario.initialMessage}] : [])
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')

  const roomRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLOListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const followLatest = useRef(true)
  const scrollAnchor = useRef<{ turn: HTMLElement; top: number } | null>(null)
  const [firstMessageOffset, setFirstMessageOffset] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const messagesRef = useRef<Message[]>(messages)
  const requestLock = useRef(false)
  const generation = useRef(0)
  const audioRequest = useRef<AbortController | null>(null)
  const audioUrl = useRef('')
  const stopAudio = useCallback(() => {
    audioRequest.current?.abort(); audioRequest.current = null
    if (audioRef.current) {
      const audio = audioRef.current
      audio.onended = audio.onerror = null
      audio.pause(); audio.removeAttribute('src'); audio.load()
      audioRef.current = null
    }
    if (audioUrl.current) { URL.revokeObjectURL(audioUrl.current); audioUrl.current = '' }
    setIsSpeaking(false)
  }, [])
  const speak = useCallback(async (text: string,audioPermit?:string) => {
    stopAudio()
    const controller = new AbortController(); audioRequest.current = controller
    setIsSpeaking(true); setError(null)
    try {
      const saved = await resolvePublishedAudio(text,tutorVoice(scenarioId))
      if(controller.signal.aborted) return
      let source = saved || ''
      if (!saved) {
        const response = await fetch('/api/tts/tutor', {
          method:'POST', headers:{'content-type':'application/json'},
          body:JSON.stringify({scenario:scenarioId,text,audioPermit}), signal:controller.signal,
        })
        if (!response.ok) throw Error('Áudio indisponível.')
        if (controller.signal.aborted) return
        const streaming = premiumSpeech && attachProgressiveAudio(response,controller.signal)
        if (streaming) source=streaming
        else {
          const blob=await response.blob()
          if(controller.signal.aborted) return
          source=URL.createObjectURL(blob)
        }
        audioUrl.current = source
      }
      const audio = new Audio(source)
      audioRef.current = audio
      audio.onended = () => { if (!controller.signal.aborted) stopAudio() }
      const unavailable = () => {
        if (!controller.signal.aborted) { stopAudio(); setError('Não foi possível reproduzir o áudio. Continue pelo texto ou tente ouvir novamente.') }
      }
      audio.onerror = unavailable
      await audio.play().catch(reason => { if (!audio.error) throw reason })
    } catch {
      if (!controller.signal.aborted) { stopAudio(); setError('Áudio indisponível. Você pode continuar pelo texto e tentar ouvir novamente.') }
    }
  }, [stopAudio,scenarioId,premiumSpeech])

  const updateMessages = useCallback((next: Message[]) => {
    const prefix = next.indexOf(messagesRef.current[0])
    const removed = next.length - 24 - prefix
    if (prefix >= 0 && removed > 0) {
      const transcript = scrollRef.current
      if (transcript && !followLatest.current) {
        const edge = transcript.getBoundingClientRect().top
        const remaining = Array.from(historyRef.current?.children ?? []).slice(removed)
        const turn = remaining.find((element): element is HTMLElement =>
          element instanceof HTMLElement && element.getBoundingClientRect().bottom > edge)
        if (turn) scrollAnchor.current = { turn, top: turn.getBoundingClientRect().top }
      }
      setFirstMessageOffset(offset => offset + removed)
    }
    messagesRef.current = next.slice(-24)
    setMessages(messagesRef.current)
  }, [])
  const handleUserMessage = useCallback(async (content: string, retry = false) => {
    if (!ready || requestLock.current || !scenario || (!retry && !content.trim())) return
    // Keep the pending user turn in place on failure; retry never appends it again.
    if (!retry && messagesRef.current.at(-1)?.role === 'user') return
    requestLock.current = true
    const token = ++generation.current
    const history = retry ? messagesRef.current : [...messagesRef.current, {role:'user' as const,content:content.trim().slice(0,2000)}]
    updateMessages(history); setTextInput(''); setIsProcessing(true); setError(null)
    try {
      const response = await generateTutorResponse(history.slice(-24).map(m => ({role:m.role,content:m.content})),scenario.id)
      if (generation.current !== token) return
      if ('error' in response) { setError(response.error || 'Não foi possível receber a resposta. Tente novamente.'); return }
      updateMessages([...history,{role:'assistant',content:response.content,tip:response.tip,audioPermit:'audioPermit' in response ? response.audioPermit : undefined}])
    } catch {
      if (generation.current === token) setError('Não foi possível receber a resposta. Sua mensagem foi preservada. Tente novamente.')
    } finally {
      if (generation.current === token) { requestLock.current = false; setIsProcessing(false) }
    }
  }, [ready, scenario, updateMessages])

  useEffect(() => {
    try {
      const draft = restoreTutorDraft(sessionStorage.getItem(storageKey))
      if (draft?.messages.length) { updateMessages(draft.messages); setTextInput(draft.input) }
    } catch { setStorageFailed(true) }
    setReady(true)
    const requests = generation
    return () => { requests.current++; requestLock.current=false; stopAudio() }
  }, [storageKey, updateMessages, stopAudio])
  useEffect(() => {
    if (!ready) return
    try { sessionStorage.setItem(storageKey,JSON.stringify({version:1,messages,input:textInput})) }
    catch { setStorageFailed(true) }
  }, [ready, storageKey, messages, textInput])
  const keepLatestVisible = useCallback(() => {
    const transcript = scrollRef.current
    if (transcript && followLatest.current) transcript.scrollTop = transcript.scrollHeight
  }, [])

  useLayoutEffect(() => {
    const anchor = scrollAnchor.current
    scrollAnchor.current = null
    const transcript = scrollRef.current
    if (anchor?.turn.isConnected && transcript && !followLatest.current) {
      transcript.scrollTop += anchor.turn.getBoundingClientRect().top - anchor.top
    } else {
      keepLatestVisible()
    }
  }, [messages, isProcessing, keepLatestVisible])

  useEffect(() => {
    const transcript = scrollRef.current
    const history = historyRef.current
    if (!transcript || !history || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(keepLatestVisible)
    observer.observe(transcript)
    observer.observe(history)
    return () => observer.disconnect()
  }, [keepLatestVisible])

  useEffect(() => {
    const viewport = window.visualViewport
    const room = roomRef.current
    const input = inputRef.current
    if (!viewport || !room || !input) return

    let frame = 0
    let freeHeight = -1
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const keyboardOpen = document.activeElement === input &&
          viewport.scale <= 1.05 && window.innerHeight - viewport.height > 100
        const height = keyboardOpen
          ? Math.floor(viewport.offsetTop + viewport.height - room.getBoundingClientRect().top - 8)
          : -1
        if (height === freeHeight) return
        freeHeight = height
        if (height > 0) room.style.setProperty('--tutor-keyboard-room', `${height}px`)
        else room.style.removeProperty('--tutor-keyboard-room')
      })
    }

    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    input.addEventListener('focus', update)
    input.addEventListener('blur', update)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      input.removeEventListener('focus', update)
      input.removeEventListener('blur', update)
      room.style.removeProperty('--tutor-keyboard-room')
    }
  }, [])

  useEffect(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        handleUserMessage(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError(`Microfone bloqueado. ${getMicrophonePermissionHelpMessage()}`)
        } else if (event.error === 'audio-capture') {
          setError('Não consegui capturar áudio. Verifique se outro app está usando o microfone.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return () => {
      if (recognitionRef.current) { recognitionRef.current.onresult = null; recognitionRef.current.onend = null; recognitionRef.current.onerror = null; recognitionRef.current.abort() }
    }
  }, [handleUserMessage])

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setError('Reconhecimento de voz indisponível neste navegador.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    stopAudio()
    setError(null)

    const token = generation.current
    const recognition = recognitionRef.current
    try {
      await requestMicrophoneAccess()
      if (generation.current !== token || recognitionRef.current !== recognition) return
      recognition.start()
      setIsListening(true)
    } catch (err) {
      if (generation.current !== token) return
      console.error('Microphone permission error:', err)
      setIsListening(false)
      setError(getMicrophoneErrorMessage(err))
    }
  }

  if (!scenario) {
    return (
      <div className={`${homeShellClass} flex min-h-[70vh] items-center justify-center`}>
        <h1 className="sr-only">Cenário não encontrado</h1>
        <EmptyState
          imageSrc="/images/mindmarket/discovery.png"
          imageAlt="Cenário de tutor não encontrado"
          title="Cenário não encontrado"
          description="Esse cenário de conversa não existe ou foi removido. Escolha outro no catálogo do tutor."
          actionHref="/tutor"
          actionLabel="Ver cenários"
          transitionTypes={navBackTransitionTypes}
          className="home-frosted-surface home-frosted-surface-soft w-full max-w-xl"
        />
      </div>
    )
  }

  const activeScenario = scenario
  const pendingReply = messages.at(-1)?.role === 'user'
  const sessionState = !ready ? 'Carregando conversa…' : isSpeaking ? 'Reproduzindo áudio…' : isProcessing ? 'Aguardando resposta…' : isListening ? 'Ouvindo…' : 'Sua vez'

  function restartConversation() {
    followLatest.current = true
    scrollAnchor.current = null
    stopAudio()
    generation.current++; requestLock.current=false; recognitionRef.current?.abort()
    setIsProcessing(false); setIsListening(false); setError(null); setTextInput('')
    updateMessages([{role:'assistant',content:activeScenario.initialMessage}])
  }

  return (
    <section ref={roomRef} className="tutor-room" aria-labelledby="tutor-room-title">
      <header className="tutor-room-header">
        <Link href="/tutor" transitionTypes={navBackTransitionTypes} prefetch={false} className="tutor-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Cenários
        </Link>
        <div className="tutor-room-context">
          <h1 id="tutor-room-title">{scenario.name}</h1>
          <p>{scenario.level} · {scenario.duration} <span>· {scenario.focus}</span></p>
        </div>
        <button type="button" onClick={restartConversation} className="tutor-icon-button" aria-label="Reiniciar conversa" title="Reiniciar conversa">
          <RefreshCcw size={17} aria-hidden="true" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="tutor-transcript"
        role="log"
        aria-label="Transcrição da conversa"
        aria-relevant="additions"
        tabIndex={0}
        onScroll={(event) => {
          const transcript = event.currentTarget
          followLatest.current = transcript.scrollHeight - transcript.clientHeight - transcript.scrollTop < 48
        }}
      >
        <ol ref={historyRef} className="tutor-history" role="list">
          {messages.map((msg, index) => (
            <li key={firstMessageOffset + index} className="tutor-turn" data-speaker={msg.role}>
              <div className="tutor-message">
                <div className="tutor-message-heading">
                  <span lang={msg.role === 'assistant' ? 'en' : undefined}>
                    {msg.role === 'user' ? 'Você' : scenario.assistantRole}
                  </span>
                  {msg.role === 'assistant' && (
                    <button type="button" onClick={() => void speak(msg.content,msg.audioPermit)} className="tutor-icon-button" aria-label={`Ouvir resposta ${Math.floor((firstMessageOffset + index) / 2) + 1}`} title="Ouvir resposta">
                      <Volume2 size={17} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p lang="en">{msg.content}</p>
              </div>
              {msg.tip && (
                <aside className="tutor-language-tip" aria-label="Dica de inglês">
                  <Sparkles size={15} aria-hidden="true" />
                  <p>{msg.tip}</p>
                </aside>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="tutor-composer">
        {error && (
          <div role="alert" className="tutor-error">
            <AlertCircle size={16} aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}
        {pendingReply && !isProcessing && (
          <div className="tutor-retry">
            <p>Sua última mensagem está aguardando resposta.</p>
            <button type="button" className="product-text-link" onClick={() => {
              inputRef.current?.focus()
              void handleUserMessage('', true)
            }}>Tentar resposta novamente</button>
          </div>
        )}
        <form onSubmit={(event) => {
          event.preventDefault()
          const message = textInput.trim()
          if (message) void handleUserMessage(message)
        }}>
          <label htmlFor="tutor-response" className="sr-only">Sua resposta em inglês</label>
          <div className="tutor-compose-row">
            {isSpeaking ? (
              <button type="button" onClick={stopAudio} className="tutor-icon-button" aria-label="Parar áudio" title="Parar áudio">
                <Square size={17} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void toggleListening()}
                disabled={!ready || isProcessing || pendingReply}
                className="tutor-icon-button"
                data-recording={isListening || undefined}
                aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação'}
                title={isListening ? 'Parar gravação' : 'Iniciar gravação'}
              >
                {isListening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
              </button>
            )}
            <input
              ref={inputRef}
              id="tutor-response"
              maxLength={2000}
              type="text"
              enterKeyHint="send"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="Responda em inglês…"
              disabled={!ready}
              readOnly={isProcessing || isListening || pendingReply}
            />
            <button type="submit" className="tutor-send" disabled={!ready || !textInput.trim() || isProcessing || isListening || pendingReply}>
              Enviar
            </button>
          </div>
        </form>
        <div className="tutor-composer-meta">
          <p role="status">{sessionState}</p>
          <p role={storageFailed ? 'status' : undefined}>
            {storageFailed ? 'A conversa não pôde ser guardada nesta aba. Copie o texto antes de sair.' : 'Histórico salvo só nesta aba.'}
          </p>
        </div>
      </div>
    </section>
  )
}
