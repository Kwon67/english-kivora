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
import EmptyState from '@/components/ui/EmptyState'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import {
  getMicrophoneErrorMessage,
  getMicrophonePermissionHelpMessage,
  requestMicrophoneAccess,
} from '@/lib/microphone'
import { pageBgGlow, pageBgGrid } from '@/lib/pageShellBackground'

interface Message {
  role: 'user' | 'assistant'
  content: string
  tip?: string | null
}

const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-border-muted/20 bg-card shadow-[0_18px_48px_rgba(31,43,18,0.14)] transition-colors duration-300 dark:border-border-accent/20 dark:bg-card dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12 text-primary'

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

          if ('error' in response) {
            setError(response.error || 'Erro ao gerar resposta da IA.')
            return
          }

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
      setTimeout(() => setMessages([{ role: 'assistant', content: scenario.initialMessage }]), 0)
      setTimeout(() => speak(scenario.initialMessage), 0)
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
    } else {
      setTimeout(() => setError('Seu navegador não suporta reconhecimento de voz.'), 0)
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */


    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (audioRef.current) audioRef.current.pause()
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

    try {
      await requestMicrophoneAccess()
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      console.error('Microphone permission error:', err)
      setIsListening(false)
      setError(getMicrophoneErrorMessage(err))
    }
  }

  if (!scenario) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          imageSrc="/images/home/undraw-online-learning.svg"
          imageAlt="Cenário de tutor não encontrado"
          title="Cenário não encontrado"
          description="Esse cenário de conversa não existe ou foi removido. Escolha outro no catálogo do tutor."
          actionHref="/tutor"
          actionLabel="Ver cenários"
          transitionTypes={navBackTransitionTypes}
          className="w-full max-w-xl"
        />
      </div>
    )
  }
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
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-8 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#050704] dark:text-text">
      <div className={pageBgGrid} />
      <div className={pageBgGlow} />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-9rem)] min-h-[calc(100svh-9rem)] max-w-5xl flex-col gap-5 pb-8 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link 
            href="/tutor" 
            transitionTypes={navBackTransitionTypes}
            prefetch={false}
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-border-muted/22 dark:border-border-accent/20 bg-card dark:bg-card px-4 py-2 text-sm font-bold text-text-muted dark:text-text-muted shadow-sm transition-colors hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Cenários
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border-muted/10 dark:border-border-accent/10 bg-card dark:bg-card px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-muted shadow-sm">
              {scenario.level}
            </span>
            <span className="inline-flex items-center rounded-full border border-primary/10 dark:border-primary/10 bg-primary/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-primary shadow-sm">
              {scenario.duration}
            </span>
          </div>
        </div>

        <section className={`${glassPanel} p-0`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
          <div className="relative z-10 flex flex-col gap-4 border-b border-border-muted/15 dark:border-border-accent/15 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary shadow-sm ring-1 ring-border-muted/18 bg-primary/12 text-primary dark:ring-border-accent/18">
                <ScenarioIcon className="h-7 w-7" strokeWidth={2.2} />
              </div>
              <div>
                <p className={softKicker}>Sessão de voz</p>
                <h1 className="mt-2 font-montserrat text-2xl font-bold text-text dark:text-text">{scenario.name}</h1>
                <p className="mt-1 text-sm text-text-muted dark:text-text-muted">{scenario.focus}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 items-center gap-2 rounded-full border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card px-4 text-xs font-bold uppercase tracking-[0.14em] text-text-muted dark:text-text-muted shadow-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isListening || isSpeaking || isProcessing ? 'bg-primary' : 'bg-[#425039]/40 dark:bg-[#b9c3a4]/40'
                  }`}
                />
                {sessionState}
              </span>
              <button
                type="button"
                onClick={restartConversation}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card text-text-muted dark:text-text-muted shadow-sm transition-colors hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary"
                aria-label="Reiniciar conversa"
                title="Reiniciar conversa"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className={`${glassPanel} flex min-h-0 flex-1 flex-col p-0`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
          <div 
            ref={scrollRef}
            className="relative z-10 flex-1 space-y-6 overflow-y-auto p-5 scroll-smooth sm:p-7 [overflow-anchor:none]"
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : null}

                  <div className="max-w-[86%] space-y-3 sm:max-w-[72%]">
                    <div
                      className={`rounded-[1.35rem] px-5 py-4 text-sm font-medium leading-relaxed shadow-sm sm:text-base ${
                        msg.role === 'user'
                          ? 'rounded-br-md bg-primary text-on-primary bg-primary dark:text-[#050704] border border-dashed border-primary-container/50/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)]'
                          : 'rounded-bl-md border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card text-text dark:text-text'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${msg.role === 'user' ? 'text-on-primary/70 dark:text-[#050704]/70' : 'text-text-muted/60 dark:text-text-muted/60'}`}>
                          {msg.role === 'user' ? 'Você' : scenario.assistantRole}
                        </span>
                        {msg.role === 'assistant' ? (
                          <button
                            type="button"
                            onClick={() => speak(msg.content)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-primary/10 dark:hover:bg-primary/10 hover:opacity-100"
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
                        className="flex gap-3 rounded-[1rem] border border-border-muted/18 bg-primary-container p-3 dark:border-border-accent/18 dark:bg-primary/12"
                      >
                        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                        <p className="text-xs font-bold text-primary">
                          {msg.tip}
                        </p>
                      </m.div>
                    )}
                  </div>

                  {msg.role === 'user' ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                      <User className="h-4 w-4" />
                    </div>
                  ) : null}
                </m.div>
              ))}
            </AnimatePresence>
            {isProcessing && (
              <div className="flex justify-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-[1.35rem] rounded-bl-md border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card px-5 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-bold text-text-muted dark:text-text-muted">Pensando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 border-t border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card p-5 sm:p-6">
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
                    : 'bg-primary text-on-primary border border-dashed border-primary-container/50/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] hover:bg-primary-dark'
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
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-text-muted/60 dark:text-text-muted/60">
                  {isListening ? 'Ouvindo...' : isProcessing ? 'Aguardando resposta...' : isSpeaking ? 'Reproduzindo áudio...' : 'Pronto para falar'}
                </p>
                <div className="flex min-h-12 items-center rounded-[20px] border border-border-muted/15 bg-card px-4 text-sm font-medium text-text-muted shadow-sm dark:border-border-accent/15 dark:bg-card dark:text-text-muted">
                  {lastAssistantMessage?.content || scenario.initialMessage}
                </div>
              </div>

              <button
                type="button"
                onClick={stopAudio}
                disabled={!isSpeaking}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card text-text-muted dark:text-text-muted shadow-sm transition-colors hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Parar áudio"
                title="Parar áudio"
              >
                <Square className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
