'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Mic, MicOff, Check, X, RefreshCw } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'
import { feedback } from '@/lib/feedback'

interface SpeechRecognitionEvent {
  results: Iterable<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

const CONFETTI_COLORS = ['#466259', '#5e7a71', '#735802', '#cae9de'] as const

interface SpeakingModeProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
}

function normalizePhrase(phrase: string) {
  return phrase
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
}

export default function SpeakingMode({ card, onCorrect, onWrong }: SpeakingModeProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isExactAnswer, setIsExactAnswer] = useState(false)
  const [startTime] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const englishPhrase = card.english_phrase || card.en || ''
  const audioUrl = card.audio_url || `/api/tts/preview?text=${encodeURIComponent(englishPhrase)}`

  const evaluateTranscript = useCallback((text: string) => {
    const normalizedInput = normalizePhrase(text)
    const normalizedCorrect = normalizePhrase(englishPhrase)
    
    // Simple exact or fuzzy match (can be improved)
    const isCorrect = normalizedInput === normalizedCorrect || 
                      (normalizedInput.length > 3 && normalizedCorrect.includes(normalizedInput))

    setIsExactAnswer(isCorrect)
    setSubmitted(true)

    if (isCorrect) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: [...CONFETTI_COLORS],
      })
      feedback.success()
    } else {
      feedback.error()
    }
  }, [englishPhrase])

  useEffect(() => {
    const Win = window as unknown as WindowWithSpeech
    const SpeechRec = Win.SpeechRecognition || Win.webkitSpeechRecognition
    
    if (!SpeechRec) {
      setTimeout(() => setError('Seu navegador não suporta reconhecimento de voz.'), 0)
      return
    }

    const recognition = new SpeechRec()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const resultsArray = Array.from(event.results)
      const currentTranscript = resultsArray
        .map((result) => result[0].transcript)
        .join('')
      setTranscript(currentTranscript)
      
      if (resultsArray[0]?.isFinal) {
        evaluateTranscript(currentTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setError('Acesso ao microfone negado.')
      } else {
        setError('Ocorreu um erro no reconhecimento de voz.')
      }
      setIsRecording(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [evaluateTranscript])

  const toggleRecording = () => {
    if (submitted) return
    
    if (isRecording) {
      recognitionRef.current?.stop()
    } else {
      setTranscript('')
      setError(null)
      try {
        recognitionRef.current?.start()
      } catch (err) {
        console.error('Recognition start error:', err)
      }
    }
  }

  const handleNext = useCallback(() => {
    if (!submitted) return
    const latencyMs = Date.now() - startTime

    if (isExactAnswer) {
      onCorrect(latencyMs)
    } else {
      onWrong(latencyMs)
    }
  }, [submitted, isExactAnswer, onCorrect, onWrong, startTime])

  return (
    <div className="premium-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker uppercase tracking-widest text-[var(--color-primary)] font-bold mb-2">Treino de Pronúncia</p>
        <h2 className="text-3xl font-bold text-[var(--color-text)] mb-6">Ouça e Repita</h2>
        
        <div className="flex flex-col items-center justify-center gap-6 mb-8">
          <div className="rounded-2xl bg-[var(--color-surface-container-low)] p-6 border border-[var(--color-border)] shadow-inner w-full">
            <p className="text-2xl font-bold text-[var(--color-text)] mb-2 italic">&quot;{englishPhrase}&quot;</p>
            <p className="text-[var(--color-text-muted)]">{card.portuguese_translation || card.pt}</p>
          </div>
          
          <AudioButton url={audioUrl} autoPlay={true} className="h-16 w-16" />
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            Aperte para ouvir a pronúncia correta
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-6">
        <button
          onClick={toggleRecording}
          disabled={!!error || submitted}
          className={`group relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
            isRecording 
              ? 'bg-[var(--color-error)] text-white scale-110 shadow-[0_0_20px_rgba(186,26,26,0.4)]' 
              : submitted
                ? 'bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)]'
                : 'bg-[var(--color-primary)] text-white hover:scale-105 shadow-[0_0_15px_rgba(70,98,89,0.3)]'
          }`}
        >
          {isRecording ? (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-error)] opacity-20"></span>
              <MicOff className="h-10 w-10" />
            </>
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </button>
        
        <p className={`text-lg font-medium transition-colors ${isRecording ? 'text-[var(--color-error)] animate-pulse' : 'text-[var(--color-text-muted)]'}`}>
          {isRecording ? 'Gravando... Fale agora' : submitted ? 'Resultado da pronúncia' : 'Toque no microfone para falar'}
        </p>

        {transcript && (
          <div className={`w-full rounded-[1.4rem] border px-6 py-4 text-center text-xl font-semibold transition-all ${
            submitted 
              ? isExactAnswer 
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' 
                : 'border-[var(--color-error)] bg-[var(--color-error)]/5 text-[var(--color-error)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-container-low)] text-[var(--color-text)]'
          }`}>
            <span className="block text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-bold">O que eu ouvi:</span>
            &quot;{transcript}&quot;
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-[var(--color-error)]/10 px-4 py-2 text-sm text-[var(--color-error)] font-medium">
            {error}
          </div>
        )}
      </div>

      {submitted && (
        <div className="mt-8 animate-fade-in flex flex-col gap-4">
          <div className={`rounded-2xl p-6 border ${
            isExactAnswer 
              ? 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5' 
              : 'border-[var(--color-error)]/20 bg-[var(--color-error)]/5'
          }`}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isExactAnswer ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-error)] text-white'
              }`}>
                {isExactAnswer ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
              </div>
              <p className={`text-xl font-bold ${isExactAnswer ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                {isExactAnswer ? 'Excelente pronúncia!' : 'Quase lá! Tente novamente.'}
              </p>
            </div>
            {!isExactAnswer && (
              <p className="text-[var(--color-text-muted)]">
                Dica: Tente falar de forma clara e pausada, seguindo o exemplo do áudio acima.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false)
                setTranscript('')
                setIsExactAnswer(false)
              }}
              className="btn-ghost flex items-center justify-center gap-2 border-[var(--color-border)] py-4"
            >
              <RefreshCw className="h-5 w-5" />
              Repetir
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary py-4"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
