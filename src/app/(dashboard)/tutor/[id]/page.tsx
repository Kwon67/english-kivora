'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react'
import { SCENARIOS } from '../page'
import { generateTutorResponse } from '@/app/actions'
import { m, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

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
  const recognitionRef = useRef<SpeechRecognition | null>(null)
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
        audio.onended = () => setIsSpeaking(false)
        audio.play()
      }
    } catch (err) {
      console.error('TTS Error:', err)
      setIsSpeaking(false)
    }
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
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      setError(null)
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  if (!scenario) return null

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-160px)] flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          href="/tutor" 
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Voltar aos Cenários
        </Link>
        
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-[var(--color-text-subtle)]'}`} />
          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
            {isSpeaking ? 'IA Falando' : isProcessing ? 'IA Pensando' : 'Sua vez'}
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="premium-card flex-1 flex flex-col overflow-hidden bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)]/40 shadow-2xl">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[70%] space-y-3`}>
                  <div className={`rounded-2xl px-5 py-4 text-sm sm:text-base font-medium shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-tr-none' 
                      : 'bg-[var(--color-surface-container-high)] text-[var(--color-text)] rounded-tl-none border border-[var(--color-border)]/30'
                  }`}>
                    {msg.content}
                    {msg.role === 'assistant' && (
                      <button onClick={() => speak(msg.content)} className="ml-2 inline-block opacity-50 hover:opacity-100 transition-opacity">
                        <Volume2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {msg.tip && (
                    <m.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3"
                    >
                      <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {msg.tip}
                      </p>
                    </m.div>
                  )}
                </div>
              </m.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-surface-container-high)] rounded-2xl px-5 py-4 flex gap-2 items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-subtle)] animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-subtle)] animate-bounce [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-subtle)] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="p-6 border-t border-[var(--color-border)]/30 bg-[var(--color-surface-container-low)]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-600 text-xs font-bold">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`h-16 w-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 relative ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:brightness-110'
              }`}
            >
              {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              )}
            </button>
            
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-2">
                {isListening ? 'Ouvindo você...' : 'Toque no microfone para falar'}
              </p>
              <div className="h-12 flex items-center px-4 rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)]/50 text-sm font-medium text-[var(--color-text-muted)] italic">
                {isListening ? 'Speak now...' : 'Practice your English out loud!'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
