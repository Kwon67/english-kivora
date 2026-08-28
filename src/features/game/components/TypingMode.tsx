'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check, Minus, X } from 'lucide-react'
import { getCardTypingTranslations } from '@/features/cards/lib/cardTranslations'
import { matchTypingAnswer, type TypingAnswerMatchKind } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '@/components/ui/AudioButton'
import { feedback } from '@/lib/feedback'
import { primaryBtn } from '@/lib/brandUi'

const CONFETTI_COLORS = ['#6B6560', '#6B6560', '#735802', '#F4F1EA'] as const

interface TypingModeProps {
  card: Card
  onCorrect: (latencyMs?: number, mode?: 'report' | 'move' | 'both') => void
  onWrong: (latencyMs?: number, mode?: 'report' | 'move' | 'both') => void
  variant?: 'practice' | 'blitz'
}

export default function TypingMode({ card, onCorrect, onWrong, variant = 'practice' }: TypingModeProps) {
  const isBlitzVariant = variant === 'blitz'
  const [input, setInput] = useState('')
  const [answerResult, setAnswerResult] = useState<TypingAnswerMatchKind | null>(null)
  const [startTime] = useState(() => Date.now())

  const submitted = answerResult !== null
  const isExactAnswer = answerResult === 'exact'
  const isPartialAnswer = answerResult === 'partial'

  const triggerConfetti = useCallback(async () => {
    const { default: confetti } = await import('canvas-confetti')
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: [...CONFETTI_COLORS],
    })
  }, [])

  const handleSubmit = useCallback((event?: React.FormEvent) => {
    event?.preventDefault()
    if (submitted || !input.trim()) return

    const translations = getCardTypingTranslations(card)
    const result = matchTypingAnswer(input, translations)

    setAnswerResult(result)
    const latencyMs = Date.now() - startTime

    if (isBlitzVariant) {
      if (result === 'exact') {
        triggerConfetti()
        feedback.success()
        onCorrect(latencyMs, 'move')
      } else {
        feedback.error()
        onWrong(latencyMs, 'move')
      }
      return
    }

    if (result === 'exact') {
      triggerConfetti()
      feedback.success()
      onCorrect(undefined, 'report')
    } else if (result === 'partial') {
      feedback.click()
      onWrong(undefined, 'report')
    } else {
      feedback.error()
      onWrong(undefined, 'report')
    }
  }, [isBlitzVariant, submitted, input, card, startTime, triggerConfetti, onCorrect, onWrong])

  const handleNext = useCallback(() => {
    if (!answerResult) return
    const latencyMs = Date.now() - startTime

    if (answerResult === 'exact') {
      onCorrect(latencyMs, 'move')
      return
    }

    onWrong(latencyMs, 'move')
  }, [answerResult, onCorrect, onWrong, startTime])

  // Teclado para avançar
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
    <div className={`${isBlitzVariant ? 'home-frosted-subtle rounded-container border border-brand-dark' : 'game-glass-card'} mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10`}>
      <div className="text-center">
        <p className="section-kicker">Escreva a tradução</p>
        {/* Stacked on phones: sitting inline, the audio button stole enough width that a long
            prompt wrapped to one word per line. Side by side again from `sm` where there's room. */}
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <h2
            data-testid="typing-question"
            className="max-w-full break-words text-2xl font-semibold leading-[1.1] text-text sm:text-4xl lg:text-5xl"
          >
            {card.english_phrase || card.en}
          </h2>
          <AudioButton url={card.audio_url} fallbackText={card.english_phrase || card.en} autoPlay={true} variant="game" className="shrink-0 sm:mt-1" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(event) => {
              if (submitted) return
              setInput(event.target.value)
            }}
            placeholder="Digite a tradução em português..."
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            inputMode="text"
            data-testid="typing-input"
            className={`touch-manipulation w-full rounded-[1.4rem] border px-5 py-5 text-base font-semibold text-text outline-none transition-all placeholder:text-text-subtle ${
              submitted
                ? answerResult === 'exact'
                  ? 'border-[rgba(70,98,89,0.16)] bg-[rgba(70,98,89,0.08)]'
                  : answerResult === 'partial'
                    ? 'border-[rgba(115,88,2,0.18)] bg-[rgba(115,88,2,0.08)]'
                    : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.07)] animate-shake'
                : 'home-frosted-subtle border-brand-dark/15 focus:border-brand-dark focus:shadow-offset-accent'
            }`}
          />

          {submitted && (
            <div
              className={`absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full ${
                answerResult === 'exact'
                  ? 'bg-primary text-on-primary'
                  : answerResult === 'partial'
                    ? 'bg-[var(--color-accent)] text-on-primary'
                    : 'bg-[var(--color-error)] text-on-primary'
              }`}
            >
              {isExactAnswer ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : isPartialAnswer ? (
                <Minus className="h-4 w-4" strokeWidth={3} />
              ) : (
                <X className="h-4 w-4" strokeWidth={3} />
              )}
            </div>
          )}
        </div>

        {!submitted && (
          <button
            type="submit"
            disabled={!input.trim()}
            data-testid="typing-submit"
            className={
              isBlitzVariant
                ? `${primaryBtn} touch-manipulation mt-4 w-full py-4`
                : 'btn-primary touch-manipulation mt-4 w-full py-4'
            }
          >
            Confirmar resposta
          </button>
        )}
      </form>

      {submitted && (
        <div
          className={`mt-5 animate-fade-in rounded-container border p-5 ${
            answerResult === 'exact'
              ? 'home-frosted-subtle border-brand-dark/20'
              : answerResult === 'partial'
                ? 'border-[rgba(115,88,2,0.16)] bg-[rgba(115,88,2,0.07)]'
                : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.05)]'
          }`}
        >
          {answerResult === 'wrong' ? (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
                Resposta correta
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-error)]">
                &quot;{card.portuguese_translation || card.pt}&quot;
              </p>
            </div>
          ) : answerResult === 'partial' ? (
            <div className="text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                    Quase lá
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-snug text-text">
                    O sentido bate, mas a forma ainda não está exata.
                  </p>
                </div>
                <span className="inline-flex shrink-0 rounded-full home-frosted-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Parcial
                </span>
              </div>
              <div className="mt-4 rounded-container home-frosted-subtle border border-brand-dark/15 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-subtle">
                  Referência
                </p>
                <p className="mt-1 text-base font-semibold text-text">
                  &quot;{getCardTypingTranslations(card)[0]}&quot;
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Excelente
              </p>
              <p className="mt-3 text-lg font-semibold text-primary">
                Resposta exata. Quando quiser, siga para o próximo card.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            className={`mt-5 w-full py-3 ${ answerResult === 'partial' ? 'btn-ghost border-border bg-surface-container-lowest/78 text-text hover:bg-surface-container-low' : 'btn-primary' }`}
          >
            Ir para a próxima
          </button>
        </div>
      )}
    </div>
  )
}
