'use client'

import { CELEBRATION_COLORS } from '@/lib/brandColors'
import { useState, useCallback, useEffect, useId } from 'react'
import { ArrowRight, Check, Headphones, X } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton from '@/components/ui/AudioButton'
import { evaluateSpeakingAnswer, isPerfectSpeakingPhrase } from '@/features/game/lib/speakingListening'
import { scoreSpeechTranscript } from '@/features/game/lib/speech-scoring'
import { feedback } from '@/lib/feedback'


interface ListeningModeProps {
  card: Card
  onCorrect: (latencyMs?: number, mode?: 'report' | 'move' | 'both') => void
  onWrong: (latencyMs?: number, mode?: 'report' | 'move' | 'both') => void
  onWrongAnswer?: (answer: string) => void
  variant?: 'practice' | 'blitz'
}

export default function ListeningMode({ card, onCorrect, onWrong, onWrongAnswer, variant = 'practice' }: ListeningModeProps) {
  const isBlitzVariant = variant === 'blitz'
  const answerId = useId()
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const onAudioError = useCallback(() => setAudioUnavailable(true), [])
  const onAudioStarted = useCallback(() => setAudioUnavailable(false), [])
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isExactAnswer, setIsExactAnswer] = useState(false)
  const [diffResult, setDiffResult] = useState<{ word: string; isCorrect: boolean }[]>([])
  const [startTime] = useState(() => Date.now())

  const englishPhrase = card.english_phrase || card.en || ''
  
  // Use audio_url if available, otherwise fallback to the preview endpoint
  const audioUrl = card.audio_url || `/api/tts/preview?text=${encodeURIComponent(englishPhrase)}`

  const triggerConfetti = useCallback(async () => {
    const { default: confetti } = await import('canvas-confetti')
    confetti({
      disableForReducedMotion: true,
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: CELEBRATION_COLORS,
    })
  }, [])

  const handleSubmit = useCallback((event?: React.FormEvent) => {
    event?.preventDefault()
    if (audioUnavailable || submitted || !input.trim()) return

    const exact = isPerfectSpeakingPhrase(input, englishPhrase)
    const accepted = exact || evaluateSpeakingAnswer({ expectedPhrase: englishPhrase, transcript: input })
    const scoreResult = scoreSpeechTranscript(englishPhrase, input)
    const inputDisplayWords = input.trim().split(/\s+/)
    const alignmentWords = scoreResult.alignment.transcript

    const result =
      alignmentWords.length > 0
        ? alignmentWords.map(({ word, isCorrect }) => ({ word, isCorrect }))
        : inputDisplayWords.map((word) => ({ word, isCorrect: false }))

    setIsExactAnswer(accepted)
    setDiffResult(result)
    setSubmitted(true)

    if (accepted) {
      if (!isBlitzVariant) triggerConfetti()
      feedback.success()
      onCorrect(undefined, 'report')
    } else {
      feedback.error()
      onWrongAnswer?.(input)
      onWrong(undefined, 'report')
    }
  }, [audioUnavailable, submitted, input, englishPhrase, isBlitzVariant, triggerConfetti, onCorrect, onWrong, onWrongAnswer])

  const handleNext = useCallback(() => {
    if (!submitted) return
    const latencyMs = Date.now() - startTime

    if (isExactAnswer) {
      onCorrect(latencyMs, 'move')
    } else {
      onWrong(latencyMs, 'move')
    }
  }, [submitted, isExactAnswer, onCorrect, onWrong, startTime])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && submitted) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitted, handleNext])

  return (
    <div data-tone="listening" className={isBlitzVariant ? 'blitz-listening' : 'exercise-prompt game-glass-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10'}>
      {isBlitzVariant ? (
        <>
          <div className="blitz-listening-heading">
            <span className="blitz-icon"><Headphones size={22} aria-hidden="true" /></span>
            <h2>Ouça e digite</h2>
          </div>
          <div className="blitz-listening-audio">
            <p>Ouça a frase em inglês.</p>
            <AudioButton onPlaybackError={onAudioError} onPlaybackStarted={onAudioStarted} url={audioUrl} autoPlay variant="game" />
          </div>
        </>
      ) : <div className="text-center">
        <p className="section-kicker">Ouça e digite</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <AudioButton onPlaybackError={onAudioError} onPlaybackStarted={onAudioStarted} url={audioUrl} autoPlay={true} variant="game" />
          <p className="text-sm font-semibold text-text-muted">
            Aperte para ouvir novamente
          </p>
        </div>
      </div>}

      {audioUnavailable && <div role="status" className="product-error"><p>O áudio não está disponível. Tente novamente no botão de áudio ou volte à revisão. Nenhuma resposta foi avaliada.</p><a href="/review" className="product-text-link">Voltar à revisão</a></div>}
      <form hidden={audioUnavailable} onSubmit={handleSubmit} className={isBlitzVariant ? 'mt-5' : 'mt-8'}>
        {isBlitzVariant && !submitted && <label className="blitz-answer-label" htmlFor={answerId}>Sua resposta em inglês</label>}
        <div className="relative">
          <input
            id={answerId}
            type="text"
            value={input}
            onChange={(event) => {
              if (submitted) return
              setInput(event.target.value)
            }}
            placeholder={isBlitzVariant ? 'Digite a frase' : 'Digite o que você ouviu em inglês...'}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            inputMode="text"
            data-testid="listening-input"
            className={`touch-manipulation w-full rounded-[1.4rem] border px-5 py-5 text-base font-semibold text-text outline-none transition-all placeholder:text-text-subtle ${
              submitted
                ? isExactAnswer
                  ? 'border-[rgba(70,98,89,0.16)] bg-[rgba(70,98,89,0.08)] hidden'
                  : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.07)] hidden'
                : 'home-frosted-subtle border-brand-dark/15 focus:border-brand-dark focus:shadow-offset-accent'
            }`}
          />
          
          {/* Se foi submetido, mostramos a frase renderizada com as cores */}
          {submitted && (
             <div className={`w-full break-words rounded-[1.4rem] border py-5 pl-5 pr-16 text-base font-semibold text-text ${
               isExactAnswer 
                ? 'border-[rgba(70,98,89,0.16)] bg-[rgba(70,98,89,0.08)]' 
                : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.07)]'
             }`}>
                {diffResult.map((res, idx) => (
                  <span key={idx} className={res.isCorrect ? 'text-text' : 'text-error line-through'}>
                    {res.word}{' '}
                  </span>
                ))}
             </div>
          )}

          {submitted && (
            <div
              className={`absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full ${
                isExactAnswer
                  ? 'bg-primary text-on-primary'
                  : 'bg-[var(--color-error)] text-on-primary'
              }`}
            >
              {isExactAnswer ? (
                <Check className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <X className="h-4 w-4" strokeWidth={1.5} />
              )}
            </div>
          )}
        </div>

        {!submitted && (
          <button
            type="submit"
            disabled={!input.trim()}
            data-testid="listening-submit"
            className="btn-primary touch-manipulation mt-4 w-full py-4"
          >
            Confirmar resposta
            {isBlitzVariant && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        )}
      </form>

      {submitted && (
        <div
          className={`mt-5 animate-fade-in rounded-container border p-5 ${
            isExactAnswer
              ? 'home-frosted-subtle border-brand-dark/20'
              : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.05)]'
          }`}
        >
          {!isExactAnswer ? (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
                Frase correta
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-error)]">
                &quot;{englishPhrase}&quot;
              </p>
              <p className="mt-3 text-sm text-text-muted">
                Tradução: {card.portuguese_translation || card.pt}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Excelente
              </p>
              <p className="mt-3 text-lg font-semibold text-primary">
                Você ouviu perfeitamente!
              </p>
              <p className="mt-3 text-sm text-text-muted">
                Tradução: {card.portuguese_translation || card.pt}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="mt-5 w-full py-3 btn-primary"
          >
            Ir para a próxima
          </button>
        </div>
      )}
    </div>
  )
}
