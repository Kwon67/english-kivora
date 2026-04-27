'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
  maxAlternatives: number;
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
const RECOGNITION_RESTART_DELAY_MS = 300
const RECOGNITION_LISTENING_TIMEOUT_MS = 12000

interface SpeakingModeProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number, mode?: 'report' | 'move' | 'both') => void
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

function cleanWord(word: string) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

function isExactSpeakingMatch(input: string, expected: string) {
  return normalizePhrase(input) === normalizePhrase(expected)
}

function stopRecognition(recognition: SpeechRecognition | null) {
  try {
    recognition?.stop()
  } catch {
    // Some browsers throw if stop() is called while recognition is idle.
  }
}

export default function SpeakingMode({ card, onCorrect, onWrong }: SpeakingModeProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isExactAnswer, setIsExactAnswer] = useState(false)
  const [startTime] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)
  const [isSpeechBlocked, setIsSpeechBlocked] = useState(false)
  const [audioStopSignal, setAudioStopSignal] = useState(0)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const evaluatedRef = useRef(false)
  const wantsRecordingRef = useRef(false)
  const isRecognitionRunningRef = useRef(false)
  const startTimeRef = useRef(0)
  const transcriptRef = useRef('')
  const hasSpeechResultRef = useRef(false)
  const englishPhrase = card.english_phrase || card.en || ''
  const audioUrl = card.audio_url || `/api/tts/preview?text=${encodeURIComponent(englishPhrase)}`
  const englishPhraseRef = useRef(englishPhrase)
  const onWrongRef = useRef(onWrong)
  const restartTimerRef = useRef<number | null>(null)
  const listeningTimeoutRef = useRef<number | null>(null)
  const speakingDiff = useMemo(() => {
    const expectedWords = englishPhrase.trim().split(/\s+/).filter(Boolean)
    const spokenWords = transcript.trim().split(/\s+/).filter(Boolean)

    return {
      expected: expectedWords.map((word, index) => ({
        word,
        isCorrect: cleanWord(word) === cleanWord(spokenWords[index] || ''),
      })),
      spoken: spokenWords.map((word, index) => ({
        word,
        isCorrect: cleanWord(word) === cleanWord(expectedWords[index] || ''),
      })),
    }
  }, [englishPhrase, transcript])

  useEffect(() => {
    englishPhraseRef.current = englishPhrase
  }, [englishPhrase])

  useEffect(() => {
    onWrongRef.current = onWrong
  }, [onWrong])

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current === null) return

    window.clearTimeout(restartTimerRef.current)
    restartTimerRef.current = null
  }, [])

  const clearListeningTimeout = useCallback(() => {
    if (listeningTimeoutRef.current === null) return

    window.clearTimeout(listeningTimeoutRef.current)
    listeningTimeoutRef.current = null
  }, [])

  const evaluateTranscript = useCallback((text: string) => {
    if (evaluatedRef.current) return

    if (!normalizePhrase(text)) {
      setError('Não detectei sua voz. Tente novamente.')
      return
    }

    evaluatedRef.current = true
    const isCorrect = isExactSpeakingMatch(text, englishPhraseRef.current)

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
      onWrongRef.current(undefined, 'report')
      feedback.error()
    }
  }, [])

  const startRecognition = useCallback(() => {
    try {
      if (!recognitionRef.current || isRecognitionRunningRef.current || !wantsRecordingRef.current) return

      startTimeRef.current = Date.now()
      recognitionRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Recognition start error:', err)
      wantsRecordingRef.current = false
      clearListeningTimeout()
      setIsRecording(false)
      setError('Não consegui iniciar o microfone. Tente novamente.')
    }
  }, [clearListeningTimeout])

  const scheduleRestart = useCallback(() => {
    if (restartTimerRef.current !== null) return

    setIsRecording(true)
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null

      if (wantsRecordingRef.current && !evaluatedRef.current) {
        startRecognition()
      }
    }, RECOGNITION_RESTART_DELAY_MS)
  }, [startRecognition])

  const startListeningTimeout = useCallback(() => {
    clearListeningTimeout()

    listeningTimeoutRef.current = window.setTimeout(() => {
      listeningTimeoutRef.current = null

      if (!wantsRecordingRef.current || evaluatedRef.current) return

      wantsRecordingRef.current = false
      clearRestartTimer()
      setIsRecording(false)
      stopRecognition(recognitionRef.current)
      evaluateTranscript(transcriptRef.current)
    }, RECOGNITION_LISTENING_TIMEOUT_MS)
  }, [clearListeningTimeout, clearRestartTimer, evaluateTranscript])

  useEffect(() => {
    const Win = window as unknown as WindowWithSpeech
    const SpeechRec = Win.SpeechRecognition || Win.webkitSpeechRecognition
    
    if (!SpeechRec) {
      setTimeout(() => {
        setError('Seu navegador não suporta reconhecimento de voz.')
        setIsSpeechBlocked(true)
      }, 0)
      return
    }

    const recognition = new SpeechRec()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      isRecognitionRunningRef.current = true
      setIsRecording(true)
      setError(null)
    }
    recognition.onend = () => {
      isRecognitionRunningRef.current = false
      const heardText = transcriptRef.current

      if (restartTimerRef.current !== null) {
        return
      }

      if (wantsRecordingRef.current && !evaluatedRef.current && normalizePhrase(heardText)) {
        wantsRecordingRef.current = false
        clearListeningTimeout()
        setIsRecording(false)
        evaluateTranscript(heardText)
        return
      }

      if (wantsRecordingRef.current && !evaluatedRef.current && !hasSpeechResultRef.current) {
        scheduleRestart()
        return
      }

      wantsRecordingRef.current = false
      clearListeningTimeout()
      setIsRecording(false)
    }
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const resultsArray = Array.from(event.results)
      const currentTranscript = resultsArray
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(' ')
      hasSpeechResultRef.current = Boolean(normalizePhrase(currentTranscript))
      transcriptRef.current = currentTranscript
      setTranscript(currentTranscript)
      
      if (resultsArray[resultsArray.length - 1]?.isFinal) {
        wantsRecordingRef.current = false
        clearRestartTimer()
        clearListeningTimeout()
        evaluateTranscript(currentTranscript)
        stopRecognition(recognitionRef.current)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        clearRestartTimer()
        clearListeningTimeout()
        wantsRecordingRef.current = false
        setError('Acesso ao microfone negado.')
        setIsSpeechBlocked(true)
      } else if (event.error === 'service-not-allowed') {
        clearRestartTimer()
        clearListeningTimeout()
        wantsRecordingRef.current = false
        setError('Reconhecimento de voz bloqueado neste navegador.')
        setIsSpeechBlocked(true)
      } else if (event.error === 'audio-capture') {
        clearRestartTimer()
        clearListeningTimeout()
        wantsRecordingRef.current = false
        setError('Nenhum microfone foi encontrado neste dispositivo.')
        setIsSpeechBlocked(true)
      } else if (event.error === 'no-speech') {
        if (wantsRecordingRef.current && !evaluatedRef.current) {
          setError('Ainda estou ouvindo. Fale a frase em inglês.')
          scheduleRestart()
          return
        }

        clearRestartTimer()
        clearListeningTimeout()
        wantsRecordingRef.current = false
        setError('Não detectei sua voz. Tente novamente.')
      } else if (event.error === 'aborted') {
        if (wantsRecordingRef.current && !evaluatedRef.current) {
          scheduleRestart()
          return
        }

        setError(null)
      } else {
        clearRestartTimer()
        clearListeningTimeout()
        wantsRecordingRef.current = false
        setError('Não consegui reconhecer sua fala. Tente novamente.')
      }
      setIsRecording(false)
    }

    recognitionRef.current = recognition

    return () => {
      clearRestartTimer()
      clearListeningTimeout()
      stopRecognition(recognitionRef.current)
    }
  }, [clearListeningTimeout, clearRestartTimer, evaluateTranscript, scheduleRestart])

  const toggleRecording = () => {
    if (submitted) return
    
    if (isRecording) {
      const currentTranscript = transcriptRef.current

      clearRestartTimer()
      clearListeningTimeout()
      wantsRecordingRef.current = false
      setIsRecording(false)
      stopRecognition(recognitionRef.current)

      if (normalizePhrase(currentTranscript)) {
        evaluateTranscript(currentTranscript)
      }
    } else {
      clearRestartTimer()
      clearListeningTimeout()
      setAudioStopSignal((value) => value + 1)
      setTranscript('')
      transcriptRef.current = ''
      setError(null)
      evaluatedRef.current = false
      hasSpeechResultRef.current = false
      wantsRecordingRef.current = true
      setIsRecording(true)
      startListeningTimeout()
      startRecognition()
    }
  }

  const handleNext = useCallback(() => {
    if (!submitted) return
    const latencyMs = Date.now() - startTime

    if (isExactAnswer) {
      onCorrect(latencyMs)
    } else {
      onWrong(latencyMs, 'move')
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
          
          <AudioButton url={audioUrl} autoPlay={true} className="h-16 w-16" stopSignal={audioStopSignal} />
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            Aperte para ouvir a pronúncia correta
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-6">
        <button
          onClick={toggleRecording}
          disabled={isSpeechBlocked || submitted}
          className={`group relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
            isRecording 
              ? 'bg-[var(--color-error)] text-[var(--color-on-primary)] scale-110 shadow-[0_0_20px_rgba(186,26,26,0.4)]' 
              : submitted
                ? 'bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)]'
                : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:scale-105 shadow-[0_0_15px_rgba(70,98,89,0.3)]'
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
            {submitted && !isExactAnswer ? (
              <span>
                &quot;
                {speakingDiff.spoken.map((result, index) => (
                  <span
                    key={`${result.word}-${index}`}
                    className={result.isCorrect ? 'text-emerald-600' : 'text-red-600 line-through'}
                  >
                    {result.word}
                    {index < speakingDiff.spoken.length - 1 ? ' ' : ''}
                  </span>
                ))}
                &quot;
              </span>
            ) : (
              <span>&quot;{transcript}&quot;</span>
            )}
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
                isExactAnswer ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-[var(--color-error)] text-[var(--color-on-primary)]'
              }`}>
                {isExactAnswer ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
              </div>
              <p className={`text-xl font-bold ${isExactAnswer ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                {isExactAnswer ? 'Excelente pronúncia!' : 'Quase lá! Tente novamente.'}
              </p>
            </div>
            {!isExactAnswer && (
              <div className="space-y-3">
                <div className="rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    Frase correta
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-relaxed">
                    &quot;
                    {speakingDiff.expected.map((result, index) => (
                      <span
                        key={`${result.word}-${index}`}
                        className={result.isCorrect ? 'text-emerald-600' : 'text-red-600'}
                      >
                        {result.word}
                        {index < speakingDiff.expected.length - 1 ? ' ' : ''}
                      </span>
                    ))}
                    &quot;
                  </p>
                </div>
                <p className="text-[var(--color-text-muted)]">
                  Dica: as palavras em vermelho precisam ser corrigidas; as verdes foram reconhecidas corretamente.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                clearRestartTimer()
                clearListeningTimeout()
                evaluatedRef.current = false
                wantsRecordingRef.current = false
                setSubmitted(false)
                setTranscript('')
                transcriptRef.current = ''
                setIsExactAnswer(false)
                setError(null)
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
