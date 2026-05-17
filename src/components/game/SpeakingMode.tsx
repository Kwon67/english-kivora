'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Mic, MicOff, Check, X, RefreshCw } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton, { AUDIO_STOP_EVENT } from '../shared/AudioButton'
import { feedback } from '@/lib/feedback'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import {
  isSpeechTranscriptReadyForEvaluation,
  normalizeSpeechPhrase,
  scoreSpeechTranscript,
  type SpeechScoreAlignment,
} from '@/lib/arena/speech-scoring'
import {
  assessLocalPronunciation,
  preloadLocalPronunciationReference,
  type LocalPronunciationAssessment,
  type LocalPronunciationReference,
} from '@/lib/speech/pronunciation-assessment'
import LiveAudioVisualizer from '../shared/LiveAudioVisualizer'
import PronunciationXRay from '../shared/PronunciationXRay'

interface SpeechRecognitionAlternative {
  transcript: string
  confidence?: number
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  readonly [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionEvent {
  results: ArrayLike<SpeechRecognitionResult>
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
const RECOGNITION_RESTART_DELAY_MS = 220
const ARENA_RECOGNITION_RESTART_DELAY_MS = 120
const RECOGNITION_LISTENING_TIMEOUT_MS = 18000
const ARENA_RECOGNITION_LISTENING_TIMEOUT_MS = 12000
const RESULT_SETTLE_DELAY_MS = 2200
const ARENA_RESULT_SETTLE_DELAY_MS = 1200
const PRONUNCIATION_ASSESSMENT_TIMEOUT_MS = 900
const ARENA_PRONUNCIATION_ASSESSMENT_TIMEOUT_MS = 650
const AUDIO_CAPTURE_STOP_TIMEOUT_MS = 500
const EMPTY_SPEECH_ALIGNMENT: SpeechScoreAlignment = {
  expected: [],
  transcript: [],
}

interface SpeakingModeProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number, mode?: 'report' | 'move' | 'both') => void
  variant?: 'practice' | 'arena'
}

function isPerfectSpeakingMatch(input: string, expected: string) {
  const normalizedInput = normalizeSpeechPhrase(input)
  const normalizedExpected = normalizeSpeechPhrase(expected)

  return Boolean(normalizedInput) && normalizedInput === normalizedExpected
}

function scoreTranscriptCandidate(input: string, expected: string) {
  const result = scoreSpeechTranscript(expected, input)
  return result.accepted ? result.score + 100 : result.score
}

function getResultAlternatives(result: SpeechRecognitionResult) {
  const alternatives: SpeechRecognitionAlternative[] = []

  for (let index = 0; index < result.length; index += 1) {
    const alternative = result[index]

    if (alternative?.transcript.trim()) {
      alternatives.push(alternative)
    }
  }

  return alternatives
}

function chooseBestAlternative(result: SpeechRecognitionResult, expected: string) {
  const alternatives = getResultAlternatives(result)

  if (alternatives.length === 0) return ''

  return alternatives.reduce((best, alternative) => {
    const alternativeScore = scoreTranscriptCandidate(alternative.transcript, expected)
    const bestScore = scoreTranscriptCandidate(best.transcript, expected)

    if (alternativeScore > bestScore) return alternative
    if (alternativeScore === bestScore && (alternative.confidence ?? 0) > (best.confidence ?? 0)) return alternative

    return best
  }).transcript.trim()
}

function collectRecognitionTranscript(results: SpeechRecognitionResult[], expected: string) {
  if (results.length === 0) return ''

  const candidates = new Set<string>()
  const allParts: string[] = []
  const finalParts: string[] = []

  for (const result of results) {
    const text = chooseBestAlternative(result, expected)
    if (!text) continue

    candidates.add(text)
    allParts.push(text)
    if (result.isFinal) finalParts.push(text)
  }

  if (allParts.length > 1) {
    candidates.add(allParts.join(' ').replace(/\s+/g, ' ').trim())
  }
  if (finalParts.length > 1) {
    candidates.add(finalParts.join(' ').replace(/\s+/g, ' ').trim())
  }

  return Array.from(candidates).reduce((bestText, text) => {
    const textScore = scoreTranscriptCandidate(text, expected)
    const bestScore = scoreTranscriptCandidate(bestText, expected)

    if (textScore > bestScore) return text
    if (textScore === bestScore && text.length > bestText.length) return text

    return bestText
  }, '')
}

function isRecoverableRecognitionStartError(error: unknown) {
  if (!(error instanceof Error)) return false

  return /InvalidStateError|already started|recognition has already started/i.test(`${error.name} ${error.message}`)
}

function stopRecognition(recognition: SpeechRecognition | null) {
  try {
    recognition?.stop()
  } catch {
    // Some browsers throw if stop() is called while recognition is idle.
  }
}

export default function SpeakingMode({ card, onCorrect, onWrong, variant = 'practice' }: SpeakingModeProps) {
  const isArena = variant === 'arena'
  const recognitionRestartDelayMs = isArena ? ARENA_RECOGNITION_RESTART_DELAY_MS : RECOGNITION_RESTART_DELAY_MS
  const recognitionListeningTimeoutMs = isArena ? ARENA_RECOGNITION_LISTENING_TIMEOUT_MS : RECOGNITION_LISTENING_TIMEOUT_MS
  const resultSettleDelayMs = isArena ? ARENA_RESULT_SETTLE_DELAY_MS : RESULT_SETTLE_DELAY_MS
  const pronunciationAssessmentTimeoutMs = isArena ? ARENA_PRONUNCIATION_ASSESSMENT_TIMEOUT_MS : PRONUNCIATION_ASSESSMENT_TIMEOUT_MS
  const {
    stream,
    startRecording,
    stopRecording,
    resetRecording,
    error: audioRecordingError,
  } = useAudioRecorder({ maxDurationMs: recognitionListeningTimeoutMs + 1500 })
  const [isRecording, setIsRecording] = useState(false)
  const [isAssessingPronunciation, setIsAssessingPronunciation] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isAcceptedAnswer, setIsAcceptedAnswer] = useState(false)
  const [pronunciationAssessment, setPronunciationAssessment] = useState<LocalPronunciationAssessment | null>(null)
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
  const resultSettleTimerRef = useRef<number | null>(null)
  const startRecognitionRef = useRef<(() => void) | null>(null)
  const audioCaptureStoppedRef = useRef(true)
  const latestAudioBlobRef = useRef<Blob | null>(null)
  const pronunciationReferenceRef = useRef<LocalPronunciationReference | null>(null)
  const speakingDiff = useMemo(() => {
    if (!englishPhrase && !transcript) return EMPTY_SPEECH_ALIGNMENT

    return scoreSpeechTranscript(englishPhrase, transcript).alignment
  }, [englishPhrase, transcript])

  useEffect(() => {
    englishPhraseRef.current = englishPhrase
  }, [englishPhrase])

  useEffect(() => {
    onWrongRef.current = onWrong
  }, [onWrong])

  useEffect(() => {
    let isCurrent = true
    pronunciationReferenceRef.current = null

    void preloadLocalPronunciationReference(audioUrl).then((reference) => {
      if (isCurrent && reference?.audioUrl === audioUrl) {
        pronunciationReferenceRef.current = reference
      }
    })

    return () => {
      isCurrent = false
    }
  }, [audioUrl])

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

  const clearResultSettleTimer = useCallback(() => {
    if (resultSettleTimerRef.current === null) return

    window.clearTimeout(resultSettleTimerRef.current)
    resultSettleTimerRef.current = null
  }, [])

  const stopAudioCapture = useCallback(async () => {
    if (audioCaptureStoppedRef.current) return latestAudioBlobRef.current

    audioCaptureStoppedRef.current = true

    try {
      let timeoutId: number | null = null
      const blob = await Promise.race([
        stopRecording(),
        new Promise<null>((resolve) => {
          timeoutId = window.setTimeout(() => resolve(null), AUDIO_CAPTURE_STOP_TIMEOUT_MS)
        }),
      ])

      if (timeoutId !== null) window.clearTimeout(timeoutId)
      if (!blob) return null

      latestAudioBlobRef.current = blob
      return blob
    } catch {
      return null
    }
  }, [stopRecording])

  const evaluateTranscript = useCallback(async (text: string) => {
    if (evaluatedRef.current) return

    clearResultSettleTimer()

    if (!normalizeSpeechPhrase(text)) {
      void stopAudioCapture()
      setError('Não detectei sua voz. Tente novamente.')
      return
    }

    evaluatedRef.current = true
    transcriptRef.current = text
    setTranscript(text)
    setIsAssessingPronunciation(true)
    const scoreResult = scoreSpeechTranscript(englishPhraseRef.current, text)
    const audioBlob = await stopAudioCapture()
    const assessment = await assessLocalPronunciation({
      userAudioBlob: audioBlob,
      reference: pronunciationReferenceRef.current,
      expectedPhrase: englishPhraseRef.current,
      maxProcessingMs: pronunciationAssessmentTimeoutMs,
    })
    const isCorrect = scoreResult.accepted && assessment.accepted

    setPronunciationAssessment(assessment)
    setIsAcceptedAnswer(isCorrect)
    setSubmitted(true)
    setIsAssessingPronunciation(false)

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
  }, [clearResultSettleTimer, pronunciationAssessmentTimeoutMs, stopAudioCapture])

  const startRecognition = useCallback(() => {
    try {
      if (!recognitionRef.current || isRecognitionRunningRef.current || !wantsRecordingRef.current) return

      startTimeRef.current = Date.now()
      recognitionRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Recognition start error:', err)

      if (isRecoverableRecognitionStartError(err) && wantsRecordingRef.current && !evaluatedRef.current) {
        if (restartTimerRef.current === null) {
          restartTimerRef.current = window.setTimeout(() => {
            restartTimerRef.current = null
            startRecognitionRef.current?.()
          }, recognitionRestartDelayMs)
        }

        return
      }

      wantsRecordingRef.current = false
      clearListeningTimeout()
      clearResultSettleTimer()
      void stopAudioCapture()
      setIsRecording(false)
      setError('Não consegui iniciar o microfone. Tente novamente.')
    }
  }, [clearListeningTimeout, clearResultSettleTimer, recognitionRestartDelayMs, stopAudioCapture])

  useEffect(() => {
    startRecognitionRef.current = startRecognition
  }, [startRecognition])

  const scheduleRestart = useCallback(() => {
    if (restartTimerRef.current !== null) return

    setIsRecording(true)
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null

      if (wantsRecordingRef.current && !evaluatedRef.current) {
        startRecognition()
      }
    }, recognitionRestartDelayMs)
  }, [recognitionRestartDelayMs, startRecognition])

  const finishListeningWithTranscript = useCallback((text: string) => {
    wantsRecordingRef.current = false
    clearRestartTimer()
    clearListeningTimeout()
    clearResultSettleTimer()
    setIsRecording(false)
    void evaluateTranscript(text)
    stopRecognition(recognitionRef.current)
  }, [clearListeningTimeout, clearRestartTimer, clearResultSettleTimer, evaluateTranscript])

  const scheduleResultSettleEvaluation = useCallback((text: string) => {
    clearResultSettleTimer()

    if (!wantsRecordingRef.current || evaluatedRef.current || !normalizeSpeechPhrase(text)) return false

    if (isPerfectSpeakingMatch(text, englishPhraseRef.current)) {
      finishListeningWithTranscript(text)
      return true
    }

    if (!isSpeechTranscriptReadyForEvaluation(englishPhraseRef.current, text)) return false

    resultSettleTimerRef.current = window.setTimeout(() => {
      resultSettleTimerRef.current = null

      if (!wantsRecordingRef.current || evaluatedRef.current) return

      const currentTranscript = transcriptRef.current

      if (normalizeSpeechPhrase(currentTranscript)) {
        finishListeningWithTranscript(currentTranscript)
      }
    }, resultSettleDelayMs)

    return true
  }, [clearResultSettleTimer, finishListeningWithTranscript, resultSettleDelayMs])

  const startListeningTimeout = useCallback(() => {
    clearListeningTimeout()

    listeningTimeoutRef.current = window.setTimeout(() => {
      listeningTimeoutRef.current = null

      if (!wantsRecordingRef.current || evaluatedRef.current) return

      wantsRecordingRef.current = false
      clearRestartTimer()
      clearResultSettleTimer()
      setIsRecording(false)
      stopRecognition(recognitionRef.current)
      void evaluateTranscript(transcriptRef.current)
    }, recognitionListeningTimeoutMs)
  }, [clearListeningTimeout, clearRestartTimer, clearResultSettleTimer, evaluateTranscript, recognitionListeningTimeoutMs])

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
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      window.dispatchEvent(new Event(AUDIO_STOP_EVENT))
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

      if (wantsRecordingRef.current && !evaluatedRef.current && normalizeSpeechPhrase(heardText)) {
        const didScheduleEvaluation = scheduleResultSettleEvaluation(heardText)

        if (!didScheduleEvaluation) {
          scheduleRestart()
        }

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
      const currentTranscript = collectRecognitionTranscript(resultsArray, englishPhraseRef.current)
      hasSpeechResultRef.current = Boolean(normalizeSpeechPhrase(currentTranscript))
      transcriptRef.current = currentTranscript
      setTranscript(currentTranscript)

      if (!hasSpeechResultRef.current) return
      
      if (isPerfectSpeakingMatch(currentTranscript, englishPhraseRef.current)) {
        finishListeningWithTranscript(currentTranscript)
        return
      }

      // We deliberately DO NOT stop automatically on `isFinal` here unless it's a perfect match.
      // Mobile browsers frequently emit `isFinal` for intermediate chunks of speech.
      // If we stop on `isFinal`, users get cut off right before the last word.
      // Instead, we rely entirely on the silence timer (scheduleResultSettleEvaluation) 
      // or the perfect match check above.

      scheduleResultSettleEvaluation(currentTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        clearRestartTimer()
        clearListeningTimeout()
        clearResultSettleTimer()
        wantsRecordingRef.current = false
        void stopAudioCapture()
        setError('Acesso ao microfone negado.')
        setIsSpeechBlocked(true)
      } else if (event.error === 'service-not-allowed') {
        clearRestartTimer()
        clearListeningTimeout()
        clearResultSettleTimer()
        wantsRecordingRef.current = false
        void stopAudioCapture()
        setError('Reconhecimento de voz bloqueado neste navegador.')
        setIsSpeechBlocked(true)
      } else if (event.error === 'audio-capture') {
        clearRestartTimer()
        clearListeningTimeout()
        clearResultSettleTimer()
        wantsRecordingRef.current = false
        void stopAudioCapture()
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
        clearResultSettleTimer()
        wantsRecordingRef.current = false
        void stopAudioCapture()
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
        clearResultSettleTimer()
        wantsRecordingRef.current = false
        void stopAudioCapture()
        setError('Não consegui reconhecer sua fala. Tente novamente.')
      }
      setIsRecording(false)
    }

    recognitionRef.current = recognition

    return () => {
      clearRestartTimer()
      clearListeningTimeout()
      clearResultSettleTimer()
      stopRecognition(recognitionRef.current)
    }
  }, [clearListeningTimeout, clearRestartTimer, clearResultSettleTimer, evaluateTranscript, finishListeningWithTranscript, scheduleRestart, scheduleResultSettleEvaluation, stopAudioCapture])

  const toggleRecording = async () => {
    if (submitted || isAssessingPronunciation) return
    
    if (isRecording) {
      const currentTranscript = transcriptRef.current

      clearRestartTimer()
      clearListeningTimeout()
      clearResultSettleTimer()
      wantsRecordingRef.current = false
      setIsRecording(false)
      stopRecognition(recognitionRef.current)

      if (normalizeSpeechPhrase(currentTranscript)) {
        void evaluateTranscript(currentTranscript)
      } else {
        void stopAudioCapture()
      }
    } else {
      clearRestartTimer()
      clearListeningTimeout()
      clearResultSettleTimer()
      window.dispatchEvent(new Event(AUDIO_STOP_EVENT))
      setAudioStopSignal((value) => value + 1)
      resetRecording()
      setTranscript('')
      transcriptRef.current = ''
      latestAudioBlobRef.current = null
      audioCaptureStoppedRef.current = false
      setError(null)
      setPronunciationAssessment(null)
      setIsAssessingPronunciation(false)
      evaluatedRef.current = false
      hasSpeechResultRef.current = false
      wantsRecordingRef.current = true
      setIsRecording(true)
      await startRecording()
      startListeningTimeout()
      startRecognition()
    }
  }

  const handleNext = useCallback(() => {
    if (!submitted) return
    const latencyMs = Date.now() - startTime

    if (isAcceptedAnswer) {
      onCorrect(latencyMs)
    } else {
      onWrong(latencyMs, 'move')
    }
  }, [submitted, isAcceptedAnswer, onCorrect, onWrong, startTime])

  const hasSpeechReviewWords = speakingDiff.expected.some((result) => !result.isCorrect)
    || speakingDiff.transcript.some((result) => !result.isCorrect)
  const visibleError = error ?? audioRecordingError

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
          
          <AudioButton
            url={audioUrl}
            autoPlay={true}
            variant="game"
            stopSignal={audioStopSignal}
            disabled={isRecording}
          />
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            {isRecording ? 'Áudio bloqueado durante a gravação' : 'Aperte para ouvir a pronúncia correta'}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-6 w-full">
        <div className="flex flex-col items-center gap-6 w-full">
          {isRecording && (
            <div className="w-full max-w-xs animate-fade-in mb-2">
              <LiveAudioVisualizer 
                stream={stream} 
                isActive={isRecording} 
                color="var(--color-primary)"
              />
            </div>
          )}
          <button
            onClick={toggleRecording}
            disabled={isSpeechBlocked || submitted || isAssessingPronunciation}
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
        </div>
        
        <p className={`text-lg font-medium transition-colors ${isRecording ? 'text-[var(--color-error)] animate-pulse' : 'text-[var(--color-text-muted)]'}`}>
          {isAssessingPronunciation ? 'Avaliando pronúncia...' : isRecording ? 'Gravando... Fale agora' : submitted ? 'Resultado da pronúncia' : 'Toque no microfone para falar'}
        </p>

        {transcript && (
          <div className={`w-full rounded-[1.4rem] border px-6 py-4 text-center text-xl font-semibold transition-all ${
            submitted 
              ? isAcceptedAnswer 
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' 
                : 'border-[var(--color-error)] bg-[var(--color-error)]/5 text-[var(--color-error)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-container-low)] text-[var(--color-text)]'
          }`}>
            <span className="block text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-bold">O que eu ouvi:</span>
            {submitted ? (
              <span>
                &quot;
                {speakingDiff.transcript.map((result, index) => (
                  <span
                    key={`${result.word}-${index}`}
                    className={result.isCorrect ? 'text-emerald-600' : 'text-red-600 line-through'}
                  >
                    {result.word}
                    {index < speakingDiff.transcript.length - 1 ? ' ' : ''}
                  </span>
                ))}
                &quot;
              </span>
            ) : (
              <span>&quot;{transcript}&quot;</span>
            )}
          </div>
        )}

        {visibleError && (
          <div className="rounded-lg bg-[var(--color-error)]/10 px-4 py-2 text-sm text-[var(--color-error)] font-medium">
            {visibleError}
          </div>
        )}
      </div>

      {submitted && (
        <div className="mt-8 animate-fade-in flex flex-col gap-4">
          <div className={`rounded-2xl p-6 border ${
            isAcceptedAnswer 
              ? 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5' 
              : 'border-[var(--color-error)]/20 bg-[var(--color-error)]/5'
          }`}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isAcceptedAnswer ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-[var(--color-error)] text-[var(--color-on-primary)]'
              }`}>
                {isAcceptedAnswer ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
              </div>
              <p className={`text-xl font-bold ${isAcceptedAnswer ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                {isAcceptedAnswer ? 'Excelente pronúncia!' : 'Quase lá! Tente novamente.'}
              </p>
            </div>
            {pronunciationAssessment && (
              <div className="mb-4 rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    Avaliação local de pronúncia
                  </p>
                  <p className={`text-sm font-black ${pronunciationAssessment.accepted ? 'text-emerald-600' : 'text-red-600'}`}>
                    {pronunciationAssessment.score}/100
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-[var(--color-text-muted)]">
                  <div className="rounded-lg bg-[var(--color-surface-container-low)] px-2 py-2">
                    Clareza<br />
                    <span className="text-[var(--color-text)]">{pronunciationAssessment.clarityScore}</span>
                  </div>
                  <div className="rounded-lg bg-[var(--color-surface-container-low)] px-2 py-2">
                    Ritmo<br />
                    <span className="text-[var(--color-text)]">{pronunciationAssessment.paceScore}</span>
                  </div>
                  <div className="rounded-lg bg-[var(--color-surface-container-low)] px-2 py-2">
                    Duração<br />
                    <span className="text-[var(--color-text)]">{pronunciationAssessment.durationScore}</span>
                  </div>
                </div>
                {pronunciationAssessment.reasons.length > 0 && (
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    {pronunciationAssessment.reasons[0]}
                  </p>
                )}
              </div>
            )}
            {hasSpeechReviewWords && (
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
                  Dica: as palavras em vermelho precisam ser revisadas; as verdes foram reconhecidas corretamente.
                </p>
              </div>
            )}

            <div className="mt-4 mb-6">
              <PronunciationXRay expected={speakingDiff.expected} spoken={speakingDiff.transcript} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  clearRestartTimer()
                  clearListeningTimeout()
                  clearResultSettleTimer()
                  evaluatedRef.current = false
                  wantsRecordingRef.current = false
                  setSubmitted(false)
                  setTranscript('')
                  transcriptRef.current = ''
                  latestAudioBlobRef.current = null
                  audioCaptureStoppedRef.current = true
                  setIsAcceptedAnswer(false)
                  setPronunciationAssessment(null)
                  setIsAssessingPronunciation(false)
                  setError(null)
                  resetRecording()
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
        </div>
      )}
    </div>
  )
}
