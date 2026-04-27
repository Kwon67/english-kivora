'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Check, Loader2, Mic, MicOff, RefreshCw, X } from 'lucide-react'
import type { Card } from '@/types/database.types'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { feedback } from '@/lib/feedback'
import AudioButton, { AUDIO_STOP_EVENT } from '../shared/AudioButton'

export type ArenaSpeechEvaluationResult = {
  ok: true
  duplicate: boolean
  transcript: string
  expected: string
  score: number
  accepted: boolean
  playerScore: number
  playerWrong: number
  details: {
    similarity: number
    missingWords: string[]
    extraWords: string[]
    durationMs: number
  }
}

type ArenaSpeechErrorResponse = {
  ok: false
  error: string
}

type ArenaSpeakingModeProps = {
  card: Card
  duelId: string
  onEvaluated: (result: ArenaSpeechEvaluationResult) => void
  onNext: () => void
}

const CONFETTI_COLORS = ['#466259', '#5e7a71', '#735802', '#cae9de'] as const
const ARENA_RECORDING_LIMIT_MS = 10_000

function formatSeconds(durationMs: number) {
  return Math.max(0, Math.ceil(durationMs / 1000))
}

function getStatusLabel(status: ReturnType<typeof useAudioRecorder>['status'], hasResult: boolean) {
  if (hasResult) return 'Resultado'
  if (status === 'requesting-permission') return 'Solicitando permissão...'
  if (status === 'recording') return 'Gravando... Fale agora'
  if (status === 'stopping') return 'Finalizando gravação...'
  if (status === 'uploading') return 'Enviando áudio...'
  if (status === 'transcribing') return 'Transcrevendo...'
  return 'Toque no microfone para falar'
}

export default function ArenaSpeakingMode({ card, duelId, onEvaluated, onNext }: ArenaSpeakingModeProps) {
  const {
    status,
    setRecordingStatus,
    startRecording,
    stopRecording,
    resetRecording,
    audioBlob,
    error: recorderError,
    recordingDurationMs,
  } = useAudioRecorder({ maxDurationMs: ARENA_RECORDING_LIMIT_MS })

  const [result, setResult] = useState<ArenaSpeechEvaluationResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [audioStopSignal, setAudioStopSignal] = useState(0)
  const submittedBlobRef = useRef<Blob | null>(null)
  const isSubmittingRef = useRef(false)
  const durationAtSubmitRef = useRef(0)

  const englishPhrase = card.english_phrase || card.en || ''
  const audioUrl = card.audio_url || `/api/tts/preview?text=${encodeURIComponent(englishPhrase)}`
  const isBusy =
    status === 'requesting-permission' ||
    status === 'stopping' ||
    status === 'uploading' ||
    status === 'transcribing'
  const hasResult = Boolean(result)
  const statusLabel = getStatusLabel(status, hasResult)
  const remainingSeconds = useMemo(
    () => Math.max(0, formatSeconds(ARENA_RECORDING_LIMIT_MS - recordingDurationMs)),
    [recordingDurationMs]
  )

  const submitRecording = useCallback(async (blob: Blob) => {
    if (isSubmittingRef.current || result) return

    if (blob.size <= 0) {
      setSubmitError('O áudio gravado está vazio. Tente novamente.')
      setRecordingStatus('error')
      return
    }

    isSubmittingRef.current = true
    submittedBlobRef.current = blob
    setSubmitError(null)
    setRecordingStatus('uploading')

    const requestBody = new FormData()
    requestBody.append('audio', blob, `arena-${duelId}-${card.id}.webm`)
    requestBody.append('duelId', duelId)
    requestBody.append('cardId', card.id)
    requestBody.append('durationMs', String(durationAtSubmitRef.current || recordingDurationMs))

    const request = fetch('/api/arena/speech/evaluate', {
      method: 'POST',
      body: requestBody,
    })

    setRecordingStatus('transcribing')

    try {
      const response = await request
      const payload = (await response.json().catch(() => null)) as
        | ArenaSpeechEvaluationResult
        | ArenaSpeechErrorResponse
        | null

      if (!response.ok || !payload || payload.ok !== true) {
        const message = payload && payload.ok === false
          ? payload.error
          : 'Não consegui avaliar sua fala. Tente novamente.'
        throw new Error(message)
      }

      setResult(payload)
      setRecordingStatus('success')
      onEvaluated(payload)

      if (payload.accepted) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Serviço de transcrição indisponível.'
      submittedBlobRef.current = null
      setSubmitError(message)
      setRecordingStatus('error')
    } finally {
      isSubmittingRef.current = false
    }
  }, [card.id, duelId, onEvaluated, recordingDurationMs, result, setRecordingStatus])

  const handleRecordButton = async () => {
    if (hasResult || isBusy) return

    if (status === 'recording') {
      durationAtSubmitRef.current = recordingDurationMs
      await stopRecording().catch((error) => {
        setSubmitError(error instanceof Error ? error.message : 'Não consegui finalizar a gravação.')
      })
      return
    }

    submittedBlobRef.current = null
    durationAtSubmitRef.current = 0
    setResult(null)
    setSubmitError(null)
    resetRecording()
    window.dispatchEvent(new Event(AUDIO_STOP_EVENT))
    setAudioStopSignal((value) => value + 1)
    await startRecording()
  }

  const handleRetryUpload = async () => {
    if (!audioBlob || isBusy || hasResult) return

    durationAtSubmitRef.current = recordingDurationMs
    await submitRecording(audioBlob)
  }

  useEffect(() => {
    if (status !== 'success' || !audioBlob || submittedBlobRef.current || result || isSubmittingRef.current) return

    durationAtSubmitRef.current = recordingDurationMs
    void submitRecording(audioBlob)
  }, [audioBlob, recordingDurationMs, result, status, submitRecording])

  return (
    <div className="premium-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker uppercase tracking-widest text-[var(--color-primary)] font-bold mb-2">
          Treino de Pronúncia
        </p>
        <h2 className="text-3xl font-bold text-[var(--color-text)] mb-6">Ouça e Repita</h2>

        <div className="flex flex-col items-center justify-center gap-6 mb-8">
          <div className="rounded-2xl bg-[var(--color-surface-container-low)] p-6 border border-[var(--color-border)] shadow-inner w-full">
            <p className="text-2xl font-bold text-[var(--color-text)] mb-2 italic">&quot;{englishPhrase}&quot;</p>
            <p className="text-[var(--color-text-muted)]">{card.portuguese_translation || card.pt}</p>
          </div>

          <AudioButton
            url={audioUrl}
            autoPlay={true}
            className="h-16 w-16"
            stopSignal={audioStopSignal}
            disabled={status === 'recording' || isBusy}
          />
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            {status === 'recording' ? 'Áudio bloqueado durante a gravação' : 'Aperte para ouvir a pronúncia correta'}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={handleRecordButton}
          disabled={hasResult || isBusy}
          className={`group relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
            status === 'recording'
              ? 'bg-[var(--color-error)] text-[var(--color-on-primary)] scale-110 shadow-[0_0_20px_rgba(186,26,26,0.4)]'
              : hasResult
                ? 'bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)]'
                : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:scale-105 shadow-[0_0_15px_rgba(70,98,89,0.3)]'
          }`}
        >
          {isBusy ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : status === 'recording' ? (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-error)] opacity-20" />
              <MicOff className="h-10 w-10" />
            </>
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </button>

        <div className="text-center">
          <p
            className={`text-lg font-medium transition-colors ${
              status === 'recording' ? 'text-[var(--color-error)] animate-pulse' : 'text-[var(--color-text-muted)]'
            }`}
          >
            {statusLabel}
          </p>
          {status === 'recording' && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-subtle)]">
              Limite: {remainingSeconds}s
            </p>
          )}
        </div>

        {result && (
          <div
            className={`w-full rounded-[1.4rem] border px-6 py-4 text-center text-xl font-semibold transition-all ${
              result.accepted
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                : 'border-[var(--color-error)] bg-[var(--color-error)]/5 text-[var(--color-error)]'
            }`}
          >
            <span className="block text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-bold">
              O que eu ouvi:
            </span>
            <span>&quot;{result.transcript || 'sem fala detectada'}&quot;</span>
            <span className="mt-3 block text-sm font-black text-[var(--color-text)]">
              Score: {result.score}
            </span>
          </div>
        )}

        {(recorderError || submitError) && !result && (
          <div className="flex w-full flex-col items-center gap-3 rounded-lg bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)] font-medium">
            <span>{submitError || recorderError}</span>
            {audioBlob && submitError && (
              <button
                type="button"
                onClick={handleRetryUpload}
                disabled={isBusy}
                className="btn-ghost flex items-center justify-center gap-2 border-[var(--color-border)] px-4 py-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>

      {result && (
        <div className="mt-8 animate-fade-in flex flex-col gap-4">
          <div
            className={`rounded-2xl p-6 border ${
              result.accepted
                ? 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5'
                : 'border-[var(--color-error)]/20 bg-[var(--color-error)]/5'
            }`}
          >
            <div className="flex items-center gap-4 mb-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  result.accepted
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                    : 'bg-[var(--color-error)] text-[var(--color-on-primary)]'
                }`}
              >
                {result.accepted ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
              </div>
              <p className={`text-xl font-bold ${result.accepted ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                {result.accepted ? 'Pronúncia aceita!' : 'Quase lá! Resultado registrado.'}
              </p>
            </div>

            {!result.accepted && (
              <div className="space-y-3">
                <div className="rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    Frase correta
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-relaxed">&quot;{result.expected}&quot;</p>
                </div>
                {(result.details.missingWords.length > 0 || result.details.extraWords.length > 0) && (
                  <p className="text-[var(--color-text-muted)]">
                    {result.details.missingWords.length > 0
                      ? `Faltou: ${result.details.missingWords.join(', ')}. `
                      : ''}
                    {result.details.extraWords.length > 0
                      ? `Sobrou: ${result.details.extraWords.join(', ')}.`
                      : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button type="button" onClick={onNext} className="btn-primary py-4">
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
