'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Loader2,
  Mic,
  MicOff,
  RefreshCcw,
  Sparkles,
  Square,
  User,
  Volume2,
} from 'lucide-react'
import { SCENARIOS } from '../page'
import { generateTutorResponse } from '@/app/actions'
import { m, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface Message {
  role: 'user' | 'assistant'
  content: string
  tip?: string | null
}

export default function ScenarioDetailPage() {
  const params = useParams()
  const scenarioId = params.id as string
  const scenario = SCENARIOS.find(s => s.id === scenarioId)
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true)
    try {
      const response = await fetch('/api/tts/preview?text=' + encodeURIComponent(text) + '&voice=en-US-AriaNeural')
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        if (audioRef.current) audioRef.current.pause()
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => {
          URL.revokeObjectURL(url)
          setIsSpeaking(false)
        }
        await audio.play()
      }
    } catch (err) {
      console.error('TTS Error:', err)
      setIsSpeaking(false)
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsSpeaking(false)
  }, [])

  const handleUserMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing || !scenario) return

    const userMessage: Message = { role: 'user', content }
    setMessages(prev => {
      const updated = [...prev, userMessage]
      
      const fetchResponse = async () => {
        setIsProcessing(true)
        setError(null)
        try {
          const response = await generateTutorResponse(
            updated.map(m => ({ role: m.role, content: m.content })),
            { name: scenario.name, context: scenario.context, assistantRole: scenario.assistantRole }
          )

          const assistantMessage: Message = { 
            role: 'assistant', 
            content: response.content,
            tip: response.tip 
          }
          setMessages(current => [...current, assistantMessage])
          speak(response.content)
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Erro ao gerar resposta da IA.')
        } finally {
          setIsProcessing(false)
        }
      }
      
      fetchResponse()
      return updated
    })
  }, [isProcessing, scenario, speak])

  // Initialize conversation
  useEffect(() => {
    if (!scenario) {
      router.push('/tutor')
      return
    }

    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: scenario.initialMessage }])
      speak(scenario.initialMessage)
    }
  }, [scenario, router, messages.length, speak])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Setup Web Speech API
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
        if (event.error === 'not-allowed') {
          setError('Microfone bloqueado. Por favor, permita o acesso ao microfone.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      setError('Seu navegador não suporta reconhecimento de voz.')
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */


    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (audioRef.current) audioRef.current.pause()
    }
  }, [handleUserMessage])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Reconhecimento de voz indisponível neste navegador.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      stopAudio()
      setError(null)
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  if (!scenario) return null
  const activeScenario = scenario
  const ScenarioIcon = activeScenario.icon
  const sessionState = isSpeaking ? 'IA falando' : isProcessing ? 'IA pensando' : isListening ? 'Ouvindo' : 'Sua vez'
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')

  function restartConversation() {
    stopAudio()
    setMessages([{ role: 'assistant', content: activeScenario.initialMessage }])
    void speak(activeScenario.initialMessage)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-5xl flex-col gap-5 pb-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link 
          href="/tutor" 
          transitionTypes={navBackTransitionTypes}
          className="group inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Cenários
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-subtle)]">
            {scenario.level}
          </span>
          <span className="stitch-pill bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            {scenario.duration}
          </span>
        </div>
      </div>

      <section className="premium-card overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)]/35 bg-[var(--color-surface-container-lowest)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] ${scenario.color} text-white shadow-lg`}>
              <ScenarioIcon className="h-7 w-7" strokeWidth={2.2} />
            </div>
            <div>
              <p className="section-kicker">Sessão de voz</p>
              <h1 className="mt-2 text-2xl font-black text-[var(--color-text)]">{scenario.name}</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{scenario.focus}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-surface-container-low)] px-4 text-xs font-black uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
              <span
                className={`h-2 w-2 rounded-full ${
                  isListening || isSpeaking || isProcessing ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-subtle)]'
                }`}
              />
              {sessionState}
            </span>
            <button
              type="button"
              onClick={restartConversation}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)]"
              aria-label="Reiniciar conversa"
              title="Reiniciar conversa"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="premium-card flex min-h-0 flex-1 flex-col overflow-hidden border border-[var(--color-border)]/40 bg-[var(--color-surface-container-lowest)] p-0 shadow-[var(--shadow-xl)]">
        <div 
          ref={scrollRef}
          className="flex-1 space-y-6 overflow-y-auto p-5 scroll-smooth sm:p-7"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
                    <Bot className="h-4 w-4" />
                  </div>
                ) : null}

                <div className="max-w-[86%] space-y-3 sm:max-w-[72%]">
                  <div
                    className={`rounded-[1.35rem] px-5 py-4 text-sm font-medium leading-relaxed shadow-sm sm:text-base ${
                      msg.role === 'user'
                        ? 'rounded-br-md bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                        : 'rounded-bl-md border border-[var(--color-border)]/35 bg-[var(--color-surface-container-high)] text-[var(--color-text)]'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${msg.role === 'user' ? 'text-[var(--color-on-primary)]/70' : 'text-[var(--color-text-subtle)]'}`}>
                        {msg.role === 'user' ? 'Você' : scenario.assistantRole}
                      </span>
                      {msg.role === 'assistant' ? (
                        <button
                          type="button"
                          onClick={() => speak(msg.content)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-[var(--color-surface-container-lowest)] hover:opacity-100"
                          aria-label="Ouvir resposta novamente"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <p>{msg.content}</p>
                  </div>

                  {msg.tip && (
                    <m.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex gap-3 rounded-[1rem] border border-amber-500/20 bg-amber-500/10 p-3"
                    >
                      <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {msg.tip}
                      </p>
                    </m.div>
                  )}
                </div>

                {msg.role === 'user' ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)]">
                    <User className="h-4 w-4" />
                  </div>
                ) : null}
              </m.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <div className="flex justify-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-[1.35rem] rounded-bl-md bg-[var(--color-surface-container-high)] px-5 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
                <span className="text-sm font-semibold text-[var(--color-text-muted)]">Pensando...</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--color-border)]/30 bg-[var(--color-surface-container-low)] p-5 sm:p-6">
          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleListening}
              disabled={isProcessing || isSpeaking}
              className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-xl transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-55 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:brightness-110'
              }`}
              aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação'}
            >
              {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
                </span>
              )}
            </button>
            
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                {isListening ? 'Ouvindo...' : isProcessing ? 'Aguardando resposta...' : isSpeaking ? 'Reproduzindo áudio...' : 'Pronto para falar'}
              </p>
              <div className="flex min-h-12 items-center rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface-container-lowest)] px-4 text-sm font-medium text-[var(--color-text-muted)]">
                {lastAssistantMessage?.content || scenario.initialMessage}
              </div>
            </div>

            <button
              type="button"
              onClick={stopAudio}
              disabled={!isSpeaking}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Parar áudio"
              title="Parar áudio"
            >
              <Square className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
