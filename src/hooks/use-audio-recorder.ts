'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

export type AudioRecorderStatus =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'stopping'
  | 'uploading'
  | 'transcribing'
  | 'success'
  | 'error'

type UseAudioRecorderOptions = {
  maxDurationMs?: number
}

type UseAudioRecorderResult = {
  status: AudioRecorderStatus
  setRecordingStatus: Dispatch<SetStateAction<AudioRecorderStatus>>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob>
  resetRecording: () => void
  audioBlob: Blob | null
  error: string | null
  recordingDurationMs: number
  mimeType: string | null
}

const PREFERRED_AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
] as const

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

function getBestMimeType() {
  if (typeof MediaRecorder === 'undefined') return null

  return PREFERRED_AUDIO_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? null
}

function getMicrophoneErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return 'Não consegui iniciar o microfone. Tente novamente.'
  }

  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'Acesso ao microfone negado.'
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'Nenhum microfone foi encontrado neste dispositivo.'
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'O microfone está indisponível ou em uso por outro aplicativo.'
  }

  return 'Não consegui acessar o microfone. Tente novamente.'
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderResult {
  const [status, setStatus] = useState<AudioRecorderStatus>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recordingDurationMs, setRecordingDurationMs] = useState(0)
  const [mimeType, setMimeType] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const durationIntervalRef = useRef<number | null>(null)
  const maxDurationTimeoutRef = useRef<number | null>(null)
  const stopResolverRef = useRef<((blob: Blob) => void) | null>(null)
  const stopRejecterRef = useRef<((error: Error) => void) | null>(null)
  const stopPromiseRef = useRef<Promise<Blob> | null>(null)

  const clearDurationInterval = useCallback(() => {
    if (durationIntervalRef.current === null) return

    window.clearInterval(durationIntervalRef.current)
    durationIntervalRef.current = null
  }, [])

  const clearMaxDurationTimeout = useCallback(() => {
    if (maxDurationTimeoutRef.current === null) return

    window.clearTimeout(maxDurationTimeoutRef.current)
    maxDurationTimeoutRef.current = null
  }, [])

  const cleanupStream = useCallback(() => {
    stopMediaStream(streamRef.current)
    streamRef.current = null
  }, [])

  const rejectStopPromise = useCallback((message: string) => {
    const nextError = new Error(message)
    stopRejecterRef.current?.(nextError)
    stopResolverRef.current = null
    stopRejecterRef.current = null
    stopPromiseRef.current = null
    return nextError
  }, [])

  const resetRecording = useCallback(() => {
    clearDurationInterval()
    clearMaxDurationTimeout()

    if (mediaRecorderRef.current?.state === 'recording') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // The browser can throw when the recorder has already stopped.
      }
    }

    cleanupStream()
    mediaRecorderRef.current = null
    chunksRef.current = []
    stopResolverRef.current = null
    stopRejecterRef.current = null
    stopPromiseRef.current = null
    startedAtRef.current = 0
    setAudioBlob(null)
    setError(null)
    setRecordingDurationMs(0)
    setMimeType(null)
    setStatus('idle')
  }, [cleanupStream, clearDurationInterval, clearMaxDurationTimeout])

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current

    if (!recorder || recorder.state === 'inactive') {
      if (audioBlob) return audioBlob

      const nextError = new Error('Nenhuma gravação ativa para finalizar.')
      setError(nextError.message)
      setStatus('error')
      throw nextError
    }

    if (stopPromiseRef.current) return stopPromiseRef.current

    setStatus('stopping')
    clearDurationInterval()
    clearMaxDurationTimeout()

    stopPromiseRef.current = new Promise<Blob>((resolve, reject) => {
      stopResolverRef.current = resolve
      stopRejecterRef.current = reject
    })

    try {
      recorder.stop()
    } catch {
      cleanupStream()
      setStatus('error')
      setError('Não consegui finalizar a gravação.')
      throw rejectStopPromise('Não consegui finalizar a gravação.')
    }

    return stopPromiseRef.current
  }, [audioBlob, cleanupStream, clearDurationInterval, clearMaxDurationTimeout, rejectStopPromise])

  const startRecording = useCallback(async () => {
    if (status === 'recording' || status === 'requesting-permission' || status === 'stopping') return

    setError(null)
    setAudioBlob(null)
    setRecordingDurationMs(0)
    chunksRef.current = []

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError('Este navegador não permite capturar áudio do microfone.')
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      setStatus('error')
      setError('Este navegador não suporta gravação de áudio.')
      return
    }

    const selectedMimeType = getBestMimeType()
    if (!selectedMimeType) {
      setStatus('error')
      setError('Este navegador não oferece um formato de áudio compatível.')
      return
    }

    setStatus('requesting-permission')

    try {
      cleanupStream()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: selectedMimeType })

      streamRef.current = stream
      mediaRecorderRef.current = recorder
      setMimeType(selectedMimeType)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        clearDurationInterval()
        clearMaxDurationTimeout()
        cleanupStream()
        setStatus('error')
        setError('O navegador encontrou um erro durante a gravação.')
        rejectStopPromise('O navegador encontrou um erro durante a gravação.')
      }

      recorder.onstop = () => {
        clearDurationInterval()
        clearMaxDurationTimeout()
        cleanupStream()

        const blob = new Blob(chunksRef.current, { type: selectedMimeType })
        mediaRecorderRef.current = null
        chunksRef.current = []
        setRecordingDurationMs(startedAtRef.current ? Date.now() - startedAtRef.current : 0)

        if (blob.size === 0) {
          setStatus('error')
          setError('O áudio gravado está vazio. Tente novamente.')
          rejectStopPromise('O áudio gravado está vazio. Tente novamente.')
          return
        }

        setAudioBlob(blob)
        setStatus('success')
        setError(null)
        stopResolverRef.current?.(blob)
        stopResolverRef.current = null
        stopRejecterRef.current = null
        stopPromiseRef.current = null
      }

      startedAtRef.current = Date.now()
      recorder.start(250)
      setStatus('recording')

      durationIntervalRef.current = window.setInterval(() => {
        setRecordingDurationMs(Date.now() - startedAtRef.current)
      }, 250)

      if (options.maxDurationMs && options.maxDurationMs > 0) {
        maxDurationTimeoutRef.current = window.setTimeout(() => {
          void stopRecording().catch(() => {
            // State is already updated by stopRecording/onerror.
          })
        }, options.maxDurationMs)
      }
    } catch (caughtError) {
      clearDurationInterval()
      clearMaxDurationTimeout()
      cleanupStream()
      mediaRecorderRef.current = null
      setStatus('error')
      setError(getMicrophoneErrorMessage(caughtError))
    }
  }, [
    cleanupStream,
    clearDurationInterval,
    clearMaxDurationTimeout,
    options.maxDurationMs,
    status,
    stopRecording,
    rejectStopPromise,
  ])

  useEffect(() => {
    return () => {
      clearDurationInterval()
      clearMaxDurationTimeout()
      cleanupStream()
    }
  }, [cleanupStream, clearDurationInterval, clearMaxDurationTimeout])

  return {
    status,
    setRecordingStatus: setStatus,
    startRecording,
    stopRecording,
    resetRecording,
    audioBlob,
    error,
    recordingDurationMs,
    mimeType,
  }
}
