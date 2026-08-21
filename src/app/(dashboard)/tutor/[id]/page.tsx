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
import { generateTutorResponse } from '@/app/actions'
import { getTutorScenario } from '@/features/tutor/lib/scenarios'
import { m, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import EmptyState from '@/components/ui/EmptyState'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import {
  getMicrophoneErrorMessage,
  getMicrophonePermissionHelpMessage,
  requestMicrophoneAccess,
} from '@/lib/microphone'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingCtaCardShadow, landingInputClass, landingRadius , landingRadiusLg} from '@/lib/landingStyles'
import {
  homeCardClass,
  homeCardButton,
  homeIconBox,
  homePrimaryButton,
  homeSecondaryButton,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'

interface Message {
  role: 'user' | 'assistant'
  content: string
  tip?: string | null
}

export default function ScenarioDetailPage() {
  const params = useParams()
  const scenarioId = params.id as string
  const scenario = getTutorScenario(scenarioId)
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true)
    try {
      const response = await fetch('/api/tts/preview?text=' + encodeURIComponent(text) + '&voice=en-US-RogerNeural')
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
            {
              name: scenario.name,
              context: scenario.context,
              assistantRole: scenario.assistantRole,
              level: scenario.level,
            }
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
      <div className={`${homeShellClass} flex min-h-[70vh] items-center justify-center`}>
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

  function restartConversation() {
    stopAudio()
    setMessages([{ role: 'assistant', content: activeScenario.initialMessage }])
    void speak(activeScenario.initialMessage)
  }

  return (
    <div className={homeShellClass}>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-9rem)] min-h-[calc(100svh-9rem)] max-w-5xl flex-col gap-5 pb-8 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/tutor"
            transitionTypes={navBackTransitionTypes}
            prefetch={false}
            className={homeSecondaryButton}
          >
            <ArrowLeft className="h-4 w-4" />
            Cenários
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className={homeSmallPillClass}>{scenario.level}</span>
            <span className={`${homeSmallPillClass} bg-brand-accent`}>{scenario.duration}</span>
          </div>
        </div>

        <section className={`${homeCardClass} ${landingCtaCardShadow} flex min-h-0 flex-1 flex-col overflow-hidden`}>
          <div className="border-b border-brand-dark p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 shrink-0 ${homeIconBox}`}>
                  <ScenarioIcon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <div>
                  <SectionBadge label="Sessão de voz" animate={false} />
                  <h1 className="mt-3 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">{scenario.name}</h1>
                  <p className="mt-1 font-body text-sm text-brand-secondary">{scenario.focus}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex h-10 items-center gap-2 ${landingRadius} border border-brand-dark bg-bg-primary px-4 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark`}>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isListening || isSpeaking || isProcessing ? 'bg-brand-accent' : 'bg-brand-secondary/40'
                    }`}
                  />
                  {sessionState}
                </span>
                <button
                  type="button"
                  onClick={restartConversation}
                  className={homeCardButton}
                  aria-label="Reiniciar conversa"
                  title="Reiniciar conversa"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="relative z-10 flex-1 space-y-6 overflow-y-auto bg-bg-primary p-5 scroll-smooth sm:p-7 [overflow-anchor:none]"
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
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${landingRadius} border border-brand-dark bg-bg-card text-brand-dark`}>
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : null}

                  <div className="max-w-[86%] space-y-3 sm:max-w-[72%]">
                    <div
                      className={`${landingRadiusLg} border border-brand-dark px-5 py-4 font-body text-sm font-medium leading-relaxed sm:text-base ${
                        msg.role === 'user'
                          ? 'rounded-br-[4px] bg-brand-dark text-white'
                          : 'rounded-bl-[4px] bg-bg-card text-brand-dark'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className={`font-heading text-2xs font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-white/70' : 'text-brand-secondary'}`}>
                          {msg.role === 'user' ? 'Você' : scenario.assistantRole}
                        </span>
                        {msg.role === 'assistant' ? (
                          <button
                            type="button"
                            onClick={() => speak(msg.content)}
                            className={`inline-flex h-7 w-7 items-center justify-center ${landingRadius} opacity-60 transition-opacity hover:bg-bg-primary hover:opacity-100`}
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
                        className={`flex gap-3 ${landingRadiusLg} border border-brand-dark bg-brand-accent p-3`}
                      >
                        <Sparkles className="h-4 w-4 shrink-0 text-brand-dark" />
                        <p className="font-body text-xs font-semibold text-brand-dark">{msg.tip}</p>
                      </m.div>
                    )}
                  </div>

                  {msg.role === 'user' ? (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${landingRadius} border border-brand-dark bg-brand-accent text-brand-dark`}>
                      <User className="h-4 w-4" />
                    </div>
                  ) : null}
                </m.div>
              ))}
            </AnimatePresence>
            {isProcessing && (
              <div className="flex justify-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${landingRadius} border border-brand-dark bg-bg-card text-brand-dark`}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className={`flex items-center gap-2 ${landingRadiusLg} rounded-bl-[4px] border border-brand-dark bg-bg-card px-5 py-4`}>
                  <Loader2 className="h-4 w-4 animate-spin text-brand-dark" />
                  <span className="font-body text-sm font-semibold text-brand-secondary">Pensando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 border-t border-brand-dark bg-bg-card p-5 sm:p-6">
            {error && (
              <div className={`mb-4 flex items-center gap-3 ${landingRadiusLg} border border-red-500/30 bg-red-500/10 p-3 font-body text-xs font-semibold text-red-600`}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                const message = textInput.trim()
                if (!message) return
                setTextInput('')
                void handleUserMessage(message)
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isProcessing || isSpeaking}
                  className={`relative mx-auto flex h-16 w-16 shrink-0 items-center justify-center ${landingRadiusLg} border border-brand-dark transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-55 sm:mx-0 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-brand-dark text-white hover:opacity-90'
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
                  <p className="mb-2 font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
                    {isListening ? 'Ouvindo...' : isProcessing ? 'Aguardando resposta...' : isSpeaking ? 'Reproduzindo áudio...' : 'Fale ou digite em inglês'}
                  </p>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(event) => setTextInput(event.target.value)}
                    placeholder="Digite sua resposta em inglês..."
                    disabled={isProcessing || isListening}
                    className={`w-full px-4 py-3 font-body text-sm font-medium text-brand-dark outline-none placeholder:text-brand-secondary disabled:opacity-60 ${landingInputClass}`}
                  />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isProcessing || isListening}
                    className={`${homePrimaryButton} px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Enviar
                  </button>

                  <button
                    type="button"
                    onClick={stopAudio}
                    disabled={!isSpeaking}
                    className={`flex h-12 w-12 items-center justify-center ${landingRadius} border border-brand-dark bg-bg-card text-brand-dark transition hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-45`}
                    aria-label="Parar áudio"
                    title="Parar áudio"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}