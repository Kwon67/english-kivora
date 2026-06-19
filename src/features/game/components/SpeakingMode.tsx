'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Mic, MicOff, Check, X, RefreshCw } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton, { AUDIO_STOP_EVENT } from '@/components/ui/AudioButton'
import { feedback } from '@/lib/feedback'
import { useAudioRecorder } from '@/features/game/hooks/use-audio-recorder'
import {
  normalizeSpeechPhrase,
  scoreSpeechTranscript,
  type SpeechScoreAlignment,
} from '@/features/game/lib/speech-scoring'
import {
  assessLocalPronunciation,
  preloadLocalPronunciationReference,
  type LocalPronunciationAssessment,
  type LocalPronunciationReference,
} from '@/features/game/lib/pronunciation-assessment'
import LiveAudioVisualizer from '@/features/game/components/LiveAudioVisualizer'
import PronunciationXRay from '@/features/game/components/PronunciationXRay'
import {
  evaluateSpeakingAnswer,
  getListeningWordCoverage,
  getPhraseQuickSettleDelayMs,
  getPhraseSettleDelayMs,
  hasRecognizedSpeech,
  shouldFinishListeningImmediately,
  shouldRestartListeningAfterEnd,
  shouldUseQuickSilenceSettle,
} from '@/features/game/lib/speakingListening'
import {
  getMicrophoneErrorMessage,
  releasePrewarmedMicrophone,
  requestMicrophoneAccess,
} from '@/lib/microphone'

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
const RECOGNITION_RESTART_DELAY_MS = 40
const MAX_RECOGNITION_RETRIES = 14
const RECOGNITION_LISTENING_TIMEOUT_MS = 18000
const PRONUNCIATION_ASSESSMENT_TIMEOUT_MS = 900
const AUDIO_CAPTURE_START_TIMEOUT_MS = 250
const AUDIO_CAPTURE_STOP_TIMEOUT_MS = 500
const EMPTY_SPEECH_ALIGNMENT: SpeechScoreAlignment = {
  expected: [],
  transcript: [],
}

export type SpeakingWrongDetails = {
  transcript: string
  missingWords: string[]
  extraWords: string[]
}

interface SpeakingModeProps {
  card: Card
  onCorrect: (latencyMs?: number, mode?: 'report' | 'move' | 'both') => void
  onWrong: (
    latencyMs?: number,
    mode?: 'report' | 'move' | 'both',
    details?: SpeakingWrongDetails
  ) => void
  onRetry?: () => void
  variant?: 'practice' | 'blitz'
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

function mergeTranscriptParts(parts: string[]) {
  return parts.reduce((merged, part) => {
    const text = part.trim()
    if (!text) return merged
    if (!merged) return text

    const normalizedMerged = normalizeSpeechPhrase(merged)
    const normalizedText = normalizeSpeechPhrase(text)

    if (!normalizedText) return merged
    if (normalizedMerged === normalizedText || normalizedMerged.includes(normalizedText)) return merged
    if (normalizedText.includes(normalizedMerged)) return text

    return `${merged} ${text}`.replace(/\s+/g, ' ').trim()
  }, '')
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
    candidates.add(mergeTranscriptParts(allParts))
  }
  if (finalParts.length > 1) {
    candidates.add(mergeTranscriptParts(finalParts))
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

export default function SpeakingMode({
  card,
  onCorrect,
  onWrong,
  onRetry,
  variant = 'practice',
}: SpeakingModeProps) {
  const isBlitzVariant = variant === 'blitz'
  const recognitionRestartDelayMs = RECOGNITION_RESTART_DELAY_MS
  const recognitionListeningTimeoutMs = RECOGNITION_LISTENING_TIMEOUT_MS
  const pronunciationAssessmentTimeoutMs = PRONUNCIATION_ASSESSMENT_TIMEOUT_MS
  const {
    stream,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder({ maxDurationMs: recognitionListeningTimeoutMs + 1500 })
  const [listeningPhase, setListeningPhase] = useState<'idle' | 'arming' | 'active'>('idle')
  const isRecording = listeningPhase !== 'idle'
  const isListeningActive = listeningPhase === 'active'
  const [isAssessingPronunciation, setIsAssessingPronunciation] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isAcceptedAnswer, setIsAcceptedAnswer] = useState(false)
  const [pronunciationAssessment, setPronunciationAssessment] = useState<LocalPronunciationAssessment | null>(null)
  const [startTime] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)
  const [isSpeechBlocked, setIsSpeechBlocked] = useState(false)
  const [isResumingListening, setIsResumingListening] = useState(false)
  const [audioStopSignal, setAudioStopSignal] = useState(0)
  
  const isMobileRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const evaluatedRef = useRef(false)
  const wantsRecordingRef = useRef(false)
  const isRecognitionRunningRef = useRef(false)
  const startTimeRef = useRef(0)
  const transcriptRef = useRef('')
  const hasSpeechResultRef = useRef(false)
  const englishPhrase = card.english_phrase || card.en || ''
  const phraseSettleDelayMs = useMemo(
    () => getPhraseSettleDelayMs(englishPhrase, { fast: isBlitzVariant }),
    [englishPhrase, isBlitzVariant]
  )
  const phraseQuickSettleDelayMs = useMemo(
    () => getPhraseQuickSettleDelayMs(englishPhrase),
    [englishPhrase]
  )
  const listeningCoverage = useMemo(
    () => getListeningWordCoverage(englishPhrase, transcript),
    [englishPhrase, transcript]
  )
  const audioUrl = card.audio_url || `/api/tts/preview?text=${encodeURIComponent(englishPhrase)}`
  const englishPhraseRef = useRef(englishPhrase)
  const onCorrectRef = useRef(onCorrect)
  const onWrongRef = useRef(onWrong)
  const restartTimerRef = useRef<number | null>(null)
  const listeningTimeoutRef = useRef<number | null>(null)
  const resultSettleTimerRef = useRef<number | null>(null)
  const startRecognitionRef = useRef<(() => void) | null>(null)
  const audioCaptureActiveRef = useRef(false)
  const audioCaptureStoppedRef = useRef(true)
  const audioCaptureStartPromiseRef = useRef<Promise<void> | null>(null)
  const latestAudioBlobRef = useRef<Blob | null>(null)
  const pronunciationReferenceRef = useRef<LocalPronunciationReference | null>(null)
  const microphoneReadyRef = useRef(false)
  const recognitionRetryCountRef = useRef(0)
  const listeningStartedAtRef = useRef(0)
  const speakingDiff = useMemo(() => {
    if (!englishPhrase && !transcript) return EMPTY_SPEECH_ALIGNMENT

    return scoreSpeechTranscript(englishPhrase, transcript).alignment
  }, [englishPhrase, transcript])

  useEffect(() => {
    isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }, [])

  useEffect(() => {
    void requestMicrophoneAccess()
      .then(() => {
        microphoneReadyRef.current = true
      })
      .catch(() => {})

    return () => {
      releasePrewarmedMicrophone()
    }
  }, [englishPhrase])

  useEffect(() => {
    englishPhraseRef.current = englishPhrase
  }, [englishPhrase])

  useEffect(() => {
    onCorrectRef.current = onCorrect
  }, [onCorrect])

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

  const startAudioCapture = useCallback(() => {
    if (audioCaptureActiveRef.current || evaluatedRef.current || !wantsRecordingRef.current) return Promise.resolve()

    audioCaptureActiveRef.current = true
    audioCaptureStoppedRef.current = false

    const startPromise = startRecording().catch(() => {
      audioCaptureActiveRef.current = false
      audioCaptureStoppedRef.current = true
    })
    audioCaptureStartPromiseRef.current = startPromise

    return startPromise
  }, [startRecording])

  const stopAudioCapture = useCallback(async () => {
    if (audioCaptureStoppedRef.current || !audioCaptureActiveRef.current) return latestAudioBlobRef.current

    audioCaptureActiveRef.current = false
    audioCaptureStoppedRef.current = true

    try {
      if (audioCaptureStartPromiseRef.current) {
        let startTimeoutId: number | null = null
        await Promise.race([
          audioCaptureStartPromiseRef.current,
          new Promise<void>((resolve) => {
            startTimeoutId = window.setTimeout(resolve, AUDIO_CAPTURE_START_TIMEOUT_MS)
          }),
        ])
        if (startTimeoutId !== null) window.clearTimeout(startTimeoutId)
      }

      audioCaptureStartPromiseRef.current = null

      let timeoutId: number | null = null
      const blob = await Promise.race([
        stopRecording(),
        new Promise<null>((resolve) => {
          timeoutId = window.setTimeout(() => resolve(null), AUDIO_CAPTURE_STOP_TIMEOUT_MS)
        }),
      ])

      if (timeoutId !== null) window.clearTimeout(timeoutId)
      if (!blob) {
        resetRecording()
        return null
      }

      latestAudioBlobRef.current = blob
      return blob
    } catch {
      resetRecording()
      return null
    }
  }, [resetRecording, stopRecording])

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

    const latencyMs = Math.max(0, Date.now() - startTimeRef.current)
    const isCorrect = evaluateSpeakingAnswer({
      expectedPhrase: englishPhraseRef.current,
      transcript: text,
    })

    setIsAcceptedAnswer(isCorrect)
    setSubmitted(!isBlitzVariant)
    setIsAssessingPronunciation(false)
    resetRecording()

    void stopAudioCapture().then((audioBlob) => {
      if (!audioBlob) return

      void assessLocalPronunciation({
        userAudioBlob: audioBlob,
        reference: pronunciationReferenceRef.current,
        expectedPhrase: englishPhraseRef.current,
        maxProcessingMs: pronunciationAssessmentTimeoutMs,
      }).then((assessment) => {
        if (!isBlitzVariant) {
          setPronunciationAssessment(assessment)
        }
      })
    })

    if (isBlitzVariant) {
      if (isCorrect) {
        feedback.success()
        onCorrectRef.current(latencyMs, 'move')
      } else {
        const scoreResult = scoreSpeechTranscript(englishPhraseRef.current, text)
        feedback.error()
        onWrongRef.current(latencyMs, 'move', {
          transcript: text,
          missingWords: scoreResult.missingWords,
          extraWords: scoreResult.extraWords,
        })
      }
      return
    }

    if (isCorrect) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: [...CONFETTI_COLORS],
        })
      })
      feedback.success()
      onCorrectRef.current(undefined, 'report')
    } else {
      onWrongRef.current(undefined, 'report')
      feedback.error()
    }
  }, [clearResultSettleTimer, isBlitzVariant, pronunciationAssessmentTimeoutMs, resetRecording, stopAudioCapture])

  const failListening = useCallback((message: string, blockSpeech = false) => {
    wantsRecordingRef.current = false
    clearRestartTimer()
    clearListeningTimeout()
    clearResultSettleTimer()
    void stopAudioCapture()
    setListeningPhase('idle')
    setError(message)
    if (blockSpeech) setIsSpeechBlocked(true)
  }, [clearListeningTimeout, clearRestartTimer, clearResultSettleTimer, stopAudioCapture])

  const queueRecognitionRestart = useCallback(() => {
    if (restartTimerRef.current !== null) return

    if (recognitionRetryCountRef.current >= MAX_RECOGNITION_RETRIES) {
      failListening('Não detectei sua voz. Tente novamente.')
      return
    }

    recognitionRetryCountRef.current += 1
    setListeningPhase(microphoneReadyRef.current ? 'active' : 'arming')
    setIsResumingListening(true)

    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null

      if (wantsRecordingRef.current && !evaluatedRef.current) {
        startRecognitionRef.current?.()
      }
    }, recognitionRestartDelayMs)
  }, [failListening, recognitionRestartDelayMs])

  const startRecognition = useCallback(() => {
    releasePrewarmedMicrophone()

    const launchRecognition = () => {
      if (!recognitionRef.current || isRecognitionRunningRef.current || !wantsRecordingRef.current) return

      listeningStartedAtRef.current = Date.now()
      startTimeRef.current = Date.now()
      recognitionRef.current.start()
    }

    try {
      launchRecognition()
      return
    } catch (err) {
      console.error('Recognition start error:', err)

      if (isRecoverableRecognitionStartError(err) && wantsRecordingRef.current && !evaluatedRef.current) {
        queueRecognitionRestart()
        return
      }
    }

    void requestMicrophoneAccess()
      .then(() => {
        microphoneReadyRef.current = true
        if (!wantsRecordingRef.current || evaluatedRef.current) return

        try {
          launchRecognition()
        } catch (retryError) {
          console.error('Recognition retry error:', retryError)
          if (isRecoverableRecognitionStartError(retryError) && wantsRecordingRef.current && !evaluatedRef.current) {
            queueRecognitionRestart()
            return
          }
          failListening('Não consegui iniciar o microfone. Tente novamente.')
        }
      })
      .catch((err) => {
        console.error('Microphone permission error:', err)
        failListening(getMicrophoneErrorMessage(err), true)
      })
  }, [failListening, queueRecognitionRestart])

  useEffect(() => {
    startRecognitionRef.current = startRecognition
  }, [startRecognition])

  const finishListeningWithTranscript = useCallback((text: string) => {
    wantsRecordingRef.current = false
    clearRestartTimer()
    clearListeningTimeout()
    clearResultSettleTimer()
    setListeningPhase('idle')
    stopRecognition(recognitionRef.current)
    void evaluateTranscript(text)
  }, [clearListeningTimeout, clearRestartTimer, clearResultSettleTimer, evaluateTranscript])

  const scheduleResultSettleEvaluation = useCallback((text: string) => {
    clearResultSettleTimer()

    if (!wantsRecordingRef.current || evaluatedRef.current || !normalizeSpeechPhrase(text)) return false

    if (shouldFinishListeningImmediately(text, englishPhraseRef.current)) {
      finishListeningWithTranscript(text)
      return true
    }

    const settleDelayMs = shouldUseQuickSilenceSettle(text, englishPhraseRef.current)
      ? phraseQuickSettleDelayMs
      : phraseSettleDelayMs

    resultSettleTimerRef.current = window.setTimeout(() => {
      resultSettleTimerRef.current = null

      if (!wantsRecordingRef.current || evaluatedRef.current) return

      const currentTranscript = transcriptRef.current

      if (!hasRecognizedSpeech(currentTranscript)) return

      finishListeningWithTranscript(currentTranscript)
    }, settleDelayMs)

    return true
  }, [
    clearResultSettleTimer,
    finishListeningWithTranscript,
    phraseQuickSettleDelayMs,
    phraseSettleDelayMs,
  ])

  const startListeningTimeout = useCallback(() => {
    clearListeningTimeout()

    listeningTimeoutRef.current = window.setTimeout(() => {
      listeningTimeoutRef.current = null

      if (!wantsRecordingRef.current || evaluatedRef.current) return

      wantsRecordingRef.current = false
      clearRestartTimer()
      clearResultSettleTimer()
      setListeningPhase('idle')
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
      microphoneReadyRef.current = true
      recognitionRetryCountRef.current = 0
      setListeningPhase('active')
      setIsResumingListening(false)
      setError(null)

    }
    recognition.onend = () => {
      isRecognitionRunningRef.current = false
      const heardText = transcriptRef.current

      if (restartTimerRef.current !== null) {
        return
      }

      if (!wantsRecordingRef.current || evaluatedRef.current) {
        clearListeningTimeout()
        setListeningPhase('idle')
        return
      }

      if (hasRecognizedSpeech(heardText)) {
        if (shouldFinishListeningImmediately(englishPhraseRef.current, heardText)) {
          finishListeningWithTranscript(heardText)
          return
        }

        if (shouldRestartListeningAfterEnd(englishPhraseRef.current, heardText)) {
          queueRecognitionRestart()
          return
        }

        scheduleResultSettleEvaluation(heardText)
        return
      }

      const listeningDurationMs = Date.now() - listeningStartedAtRef.current
      if (listeningDurationMs < 2500) {
        queueRecognitionRestart()
        return
      }

      failListening('Não detectei sua voz. Tente novamente.')
    }
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const resultsArray = Array.from(event.results)
      const currentTranscript = collectRecognitionTranscript(resultsArray, englishPhraseRef.current)
      hasSpeechResultRef.current = Boolean(normalizeSpeechPhrase(currentTranscript))
      transcriptRef.current = currentTranscript
      setTranscript(currentTranscript)

      if (!hasSpeechResultRef.current) return

      recognitionRetryCountRef.current = 0

      if (shouldFinishListeningImmediately(currentTranscript, englishPhraseRef.current)) {
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
        setListeningPhase('idle')
        setError(getMicrophoneErrorMessage(new DOMException('Microfone bloqueado.', 'NotAllowedError')))
        setIsSpeechBlocked(true)
      } else if (event.error === 'service-not-allowed') {
        clearRestartTimer()
        clearListeningTimeout()
        clearResultSettleTimer()
        wantsRecordingRef.current = false
        void stopAudioCapture()
        setListeningPhase('idle')
        setError('Reconhecimento de voz bloqueado neste navegador.')
        setIsSpeechBlocked(true)
      } else if (event.error === 'audio-capture') {
        clearRestartTimer()
        clearListeningTimeout()
        clearResultSettleTimer()
        wantsRecordingRef.current = false
        void stopAudioCapture()
        setListeningPhase('idle')
        setError('Nenhum microfone foi encontrado neste dispositivo.')
        setIsSpeechBlocked(true)
      } else if (event.error === 'no-speech') {
        const currentTranscript = transcriptRef.current

        if (wantsRecordingRef.current && !evaluatedRef.current && hasRecognizedSpeech(currentTranscript)) {
          if (shouldFinishListeningImmediately(englishPhraseRef.current, currentTranscript)) {
            finishListeningWithTranscript(currentTranscript)
          } else if (shouldRestartListeningAfterEnd(englishPhraseRef.current, currentTranscript)) {
            queueRecognitionRestart()
          } else {
            scheduleResultSettleEvaluation(currentTranscript)
          }
          return
        }

        if (wantsRecordingRef.current && !evaluatedRef.current) {
          queueRecognitionRestart()
          return
        }

        failListening('Não detectei sua voz. Tente novamente.')
        return
      } else if (event.error === 'aborted') {
        if (wantsRecordingRef.current && !evaluatedRef.current) {
          queueRecognitionRestart()
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
      setListeningPhase('idle')
    }

    recognitionRef.current = recognition

    return () => {
      wantsRecordingRef.current = false
      clearRestartTimer()
      clearListeningTimeout()
      clearResultSettleTimer()
      resetRecording()
      stopRecognition(recognitionRef.current)
    }
  }, [clearListeningTimeout, clearRestartTimer, clearResultSettleTimer, evaluateTranscript, failListening, finishListeningWithTranscript, queueRecognitionRestart, resetRecording, scheduleResultSettleEvaluation, startAudioCapture, stopAudioCapture])

  const toggleRecording = async () => {
    if (submitted || isAssessingPronunciation) return
    
    if (isRecording) {
      const currentTranscript = transcriptRef.current

      clearRestartTimer()
      clearListeningTimeout()
      clearResultSettleTimer()
      wantsRecordingRef.current = false
      setListeningPhase('idle')
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
      stopRecognition(recognitionRef.current)
      window.dispatchEvent(new Event(AUDIO_STOP_EVENT))
      setAudioStopSignal((value) => value + 1)
      resetRecording()
      setTranscript('')
      transcriptRef.current = ''
      latestAudioBlobRef.current = null
      audioCaptureStartPromiseRef.current = null
      audioCaptureActiveRef.current = false
      audioCaptureStoppedRef.current = true
      setError(null)
      setPronunciationAssessment(null)
      setIsAssessingPronunciation(false)
      evaluatedRef.current = false
      hasSpeechResultRef.current = false
      releasePrewarmedMicrophone()
      recognitionRetryCountRef.current = 0
      wantsRecordingRef.current = true
      setListeningPhase(microphoneReadyRef.current ? 'active' : 'arming')
      setError(null)
      startListeningTimeout()
      startRecognition()
    }
  }

  const handleNext = useCallback(() => {
    if (!submitted) return
    const latencyMs = Date.now() - startTime

    if (isAcceptedAnswer) {
      onCorrect(latencyMs, 'move')
    } else {
      onWrong(latencyMs, 'move')
    }
  }, [submitted, isAcceptedAnswer, onCorrect, onWrong, startTime])

  const hasSpeechReviewWords = speakingDiff.expected.some((result) => !result.isCorrect)
    || speakingDiff.transcript.some((result) => !result.isCorrect)
  const visibleError = error

  return (
    <div className="game-glass-card mx-auto w-full max-w-[760px] p-4 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker uppercase tracking-widest text-primary font-bold mb-2">Treino de Pronúncia</p>
        <h2 className="mb-4 text-2xl font-bold text-text sm:mb-6 sm:text-3xl">Ouça e Repita</h2>
        
        <div className="mb-5 flex flex-col items-center justify-center gap-3 sm:mb-8 sm:gap-6">
          <div className="w-full rounded-2xl border border-border bg-[var(--color-surface-container-low)] p-3 shadow-inner sm:p-6">
            <p className="mb-2 text-lg font-bold italic leading-snug text-text sm:text-2xl">&quot;{englishPhrase}&quot;</p>
            <p className="text-sm text-text-muted sm:text-base">{card.portuguese_translation || card.pt}</p>
          </div>
          
          <AudioButton
            url={audioUrl}
            autoPlay={true}
            variant="game"
            stopSignal={audioStopSignal}
            disabled={isRecording}
          />
          <p className="text-sm font-semibold text-text-muted">
            {isRecording ? 'Áudio bloqueado durante a gravação' : 'Aperte para ouvir a pronúncia correta'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex w-full flex-col items-center gap-3 sm:mt-8 sm:gap-6">
        <div className="flex w-full flex-col items-center gap-3 sm:gap-6">
          {isListeningActive && (
            <div className="w-full max-w-xs animate-fade-in mb-2">
              <LiveAudioVisualizer 
                stream={stream} 
                isActive={isListeningActive} 
                color="var(--color-primary)"
              />
            </div>
          )}
          <button
            onClick={toggleRecording}
            disabled={isSpeechBlocked || submitted || isAssessingPronunciation}
            className={`group relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 sm:h-24 sm:w-24 ${
              isListeningActive
                ? 'scale-110 bg-primary text-on-primary shadow-[0_0_20px_rgba(43,122,11,0.35)]'
                : listeningPhase === 'arming'
                  ? 'bg-primary/80 text-on-primary shadow-[0_0_12px_rgba(43,122,11,0.25)]'
                  : submitted
                    ? 'bg-[var(--color-surface-container-high)] text-text-muted'
                    : 'bg-primary text-on-primary hover:scale-105 shadow-[0_0_15px_rgba(70,98,89,0.3)]'
            }`}
          >
            {isRecording ? (
              <>
                <span className={`absolute inset-0 rounded-full bg-primary ${isListeningActive ? 'animate-ping opacity-20' : 'animate-pulse opacity-15'}`}></span>
                <MicOff className="h-9 w-9 sm:h-10 sm:w-10" />
              </>
            ) : (
              <Mic className="h-9 w-9 sm:h-10 sm:w-10" />
            )}
          </button>
        </div>
        
        {isListeningActive ? (
          <div className="w-full max-w-sm space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-low">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.round(listeningCoverage * 100)}%` }}
              />
            </div>
            <p className="text-center text-xs font-semibold text-text-subtle">
              {Math.round(listeningCoverage * 100)}% da frase reconhecida
            </p>
          </div>
        ) : null}

        <p className={`text-sm font-medium transition-colors sm:text-lg ${
          listeningPhase === 'arming' || isListeningActive ? 'text-primary' : 'text-text-muted'
        } ${listeningPhase === 'arming' ? 'animate-pulse' : ''}`}>
          {isAssessingPronunciation
            ? 'Avaliando pronúncia...'
            : listeningPhase === 'arming'
              ? 'Ativando microfone...'
              : isListeningActive
                ? isResumingListening
                  ? 'Continue falando no seu ritmo...'
                  : 'Ouvindo — fale a frase no seu ritmo'
                : submitted
                  ? 'Resultado da pronúncia'
                  : 'Toque no microfone e fale quando quiser'}
        </p>

        {transcript && (
          <div className={`w-full rounded-[1.2rem] border px-3 py-3 text-center text-sm font-semibold leading-relaxed transition-all sm:rounded-[1.4rem] sm:px-6 sm:py-4 sm:text-xl ${
            submitted
              ? isAcceptedAnswer
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-[var(--color-accent)]/30 bg-[var(--color-accent-light)] text-[var(--color-accent)]'
              : 'border-border bg-[var(--color-surface-container-low)] text-text'
          }`}>
            <span className="block text-xs uppercase tracking-widest text-text-muted mb-1 font-bold">O que eu ouvi:</span>
            {submitted ? (
              <span className="mx-auto block max-h-24 overflow-y-auto break-words sm:max-h-none">
                &quot;
                {speakingDiff.transcript.map((result, index) => (
                  <span
                    key={`${result.word}-${index}`}
                    className={result.isCorrect ? 'text-primary' : 'text-[var(--color-accent)] line-through'}
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
        <div className="mt-5 flex animate-fade-in flex-col gap-3 sm:mt-8 sm:gap-4">
          <div className={`rounded-2xl border p-3 sm:p-6 ${
            isAcceptedAnswer
              ? 'border-primary/20 bg-primary/5'
              : 'border-[var(--color-accent)]/25 bg-[var(--color-accent-light)]'
          }`}>
            <div className="mb-3 flex items-center gap-3 sm:gap-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                isAcceptedAnswer ? 'bg-primary text-on-primary' : 'bg-[var(--color-accent)] text-on-primary'
              }`}>
                {isAcceptedAnswer ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
              </div>
              <p className={`text-base font-bold leading-tight sm:text-xl ${isAcceptedAnswer ? 'text-primary' : 'text-[var(--color-accent)]'}`}>
                {isAcceptedAnswer ? 'Excelente pronúncia!' : 'Quase lá! Tente novamente.'}
              </p>
            </div>
            {pronunciationAssessment && (
              <div className="mb-3 rounded-[1.1rem] border border-border bg-surface-container-lowest px-3 py-3 sm:mb-4 sm:px-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
                    Avaliação local de pronúncia
                  </p>
                  <p className={`text-sm font-black ${pronunciationAssessment.accepted ? 'text-primary' : 'text-[var(--color-accent)]'}`}>
                    {pronunciationAssessment.score}/100
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px] font-semibold text-text-muted sm:gap-2 sm:text-xs">
                  <div className="rounded-lg bg-[var(--color-surface-container-low)] px-2 py-2">
                    Voz<br />
                    <span className="text-text">{pronunciationAssessment.clarityScore}</span>
                  </div>
                  <div className="rounded-lg bg-[var(--color-surface-container-low)] px-2 py-2">
                    Som<br />
                    <span className="text-text">{pronunciationAssessment.rhythmScore ?? '--'}</span>
                  </div>
                  <div className="rounded-lg bg-[var(--color-surface-container-low)] px-2 py-2">
                    Tempo<br />
                    <span className="text-text">{Math.round(pronunciationAssessment.voicedDurationMs / 100) / 10}s</span>
                  </div>
                </div>
                {pronunciationAssessment.reasons.length > 0 && (
                  <p className="mt-3 text-xs text-text-muted sm:text-sm">
                    {pronunciationAssessment.reasons[0]}
                  </p>
                )}
              </div>
            )}
            {hasSpeechReviewWords && (
              <div className="space-y-3">
                <div className="rounded-[1.1rem] border border-border bg-surface-container-lowest px-3 py-3 sm:px-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
                    Frase correta
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed sm:text-lg">
                    &quot;
                    {speakingDiff.expected.map((result, index) => (
                      <span
                        key={`${result.word}-${index}`}
                        className={result.isCorrect ? 'text-primary' : 'text-[var(--color-accent)]'}
                      >
                        {result.word}
                        {index < speakingDiff.expected.length - 1 ? ' ' : ''}
                      </span>
                    ))}
                    &quot;
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-text-muted sm:text-base">
                  Dica: as palavras em destaque precisam ser revisadas; as verdes foram reconhecidas corretamente.
                </p>
              </div>
            )}

            <div className="mb-4 mt-3 sm:mb-6 sm:mt-4">
              <PronunciationXRay expected={speakingDiff.expected} spoken={speakingDiff.transcript} />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  clearRestartTimer()
                  clearListeningTimeout()
                  clearResultSettleTimer()
                  stopRecognition(recognitionRef.current)
                  evaluatedRef.current = false
                  wantsRecordingRef.current = false
                  setListeningPhase('idle')
                  setSubmitted(false)
                  setTranscript('')
                  transcriptRef.current = ''
                  latestAudioBlobRef.current = null
                  audioCaptureStartPromiseRef.current = null
                  audioCaptureActiveRef.current = false
                  audioCaptureStoppedRef.current = true
                  setIsAcceptedAnswer(false)
                  setPronunciationAssessment(null)
                  setIsAssessingPronunciation(false)
                  setError(null)
                  resetRecording()
                  onRetry?.()
                }}
                className="btn-ghost flex items-center justify-center gap-2 border-border py-3 sm:py-4"
              >
                <RefreshCw className="h-5 w-5" />
                Repetir
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary py-3 sm:py-4"
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
