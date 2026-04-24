'use client'

import { useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Check, Minus, X } from 'lucide-react'
import { getCardTypingTranslations } from '@/lib/cardTranslations'
import { matchTypingAnswer, type TypingAnswerMatchKind } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'
import { feedback } from '@/lib/feedback'

const CONFETTI_COLORS = ['#466259', '#5e7a71', '#735802', '#cae9de'] as const

interface TypingModeProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
}

export default function TypingMode({ card, onCorrect, onWrong }: TypingModeProps) {
  const [input, setInput] = useState('')
  const [answerResult, setAnswerResult] = useState<TypingAnswerMatchKind | null>(null)
  const [startTime] = useState(() => Date.now())

  const submitted = answerResult !== null
  const isExactAnswer = answerResult === 'exact'
  const isPartialAnswer = answerResult === 'partial'

  const triggerConfetti = useCallback(() => {
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

    if (result === 'exact') {
      triggerConfetti()
      feedback.success()
    } else if (result === 'partial') {
      feedback.click()
    } else {
      feedback.error()
    }
  }, [submitted, input, card, triggerConfetti])

  const handleNext = useCallback(() => {
    if (!answerResult) return
    const latencyMs = Date.now() - startTime

    if (answerResult === 'exact') {
      onCorrect(latencyMs)
      return
    }

    onWrong(latencyMs)
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
    <div className="premium-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker">Escreva a tradução</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <h2
            data-testid="typing-question"
            className="text-3xl font-semibold leading-[1.04] text-[var(--color-text)] sm:text-5xl"
          >
            {card.english_phrase || card.en}
          </h2>
          <AudioButton url={card.audio_url} autoPlay={true} className="mt-1" />
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
            className={`touch-manipulation w-full rounded-[1.4rem] border px-5 py-5 text-base font-semibold text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-subtle)] ${
              submitted
                ? answerResult === 'exact'
                  ? 'border-[rgba(70,98,89,0.16)] bg-[rgba(70,98,89,0.08)]'
                  : answerResult === 'partial'
                    ? 'border-[rgba(115,88,2,0.18)] bg-[rgba(115,88,2,0.08)]'
                    : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.07)] animate-shake'
                : 'border-[rgba(193,200,196,0.28)] bg-[var(--color-surface-container-low)] focus:border-[rgba(70,98,89,0.18)] focus:bg-[var(--color-surface-container-lowest)] focus:shadow-[0_0_0_4px_rgba(202,233,222,0.2)]'
            }`}
          />

          {submitted && (
            <div
              className={`absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full ${
                answerResult === 'exact'
                  ? 'bg-[var(--color-primary)] text-white'
                  : answerResult === 'partial'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-error)] text-white'
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
            className="btn-primary touch-manipulation mt-4 w-full py-4"
          >
            Confirmar resposta
          </button>
        )}
      </form>

      {submitted && (
        <div
          className={`mt-5 animate-fade-in rounded-xl border p-5 ${
            answerResult === 'exact'
              ? 'border-[rgba(70,98,89,0.16)] bg-[var(--color-surface-container-low)]'
              : answerResult === 'partial'
                ? 'border-[rgba(115,88,2,0.16)] bg-[rgba(115,88,2,0.07)]'
                : 'border-gray-200 bg-gray-50'
          }`}
        >
          {answerResult === 'wrong' ? (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                    Quase lá
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-snug text-[var(--color-text)]">
                    O sentido bate, mas a forma ainda não está exata.
                  </p>
                </div>
                <span className="inline-flex shrink-0 rounded-full bg-[var(--color-surface-container-low)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Parcial
                </span>
              </div>
              <div className="mt-4 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)]/76 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Referência
                </p>
                <p className="mt-1 text-base font-semibold text-[var(--color-text)]">
                  &quot;{getCardTypingTranslations(card)[0]}&quot;
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                Excelente
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--color-primary)]">
                Resposta exata. Quando quiser, siga para o próximo card.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            className={`mt-5 w-full py-3 ${
              answerResult === 'partial'
                ? 'btn-ghost border-[var(--color-border)] bg-[var(--color-surface-container-lowest)]/78 text-[var(--color-text)] hover:bg-[var(--color-surface-container-low)]'
                : 'btn-primary'
            }`}
          >
            Ir para a próxima
          </button>
        </div>
      )}
    </div>
  )
}
