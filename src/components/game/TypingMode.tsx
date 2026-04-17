'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { Check, Minus, X } from 'lucide-react'
import { getCardTypingTranslations } from '@/lib/cardTranslations'
import { matchTypingAnswer, type TypingAnswerMatchKind } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'

interface TypingModeProps {
  card: Card
  onCorrect: () => void
  onWrong: () => void
}

export default function TypingMode({ card, onCorrect, onWrong }: TypingModeProps) {
  const [input, setInput] = useState('')
  const [answerResult, setAnswerResult] = useState<TypingAnswerMatchKind | null>(null)

  const submitted = answerResult !== null
  const isExactAnswer = answerResult === 'exact'
  const isPartialAnswer = answerResult === 'partial'

  function triggerConfetti() {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#2B7A0B', '#1f5f08', '#163c06', '#2B7A0B'],
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitted || !input.trim()) return

    const translations = getCardTypingTranslations(card)
    const result = matchTypingAnswer(input, translations)

    setAnswerResult(result)

    if (result === 'exact') {
      triggerConfetti()
    }
  }

  function handleNext() {
    if (!answerResult) return

    if (answerResult === 'exact') {
      onCorrect()
      return
    }

    onWrong()
  }

  return (
    <div className="premium-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker">Write the translation</p>
        <div className="flex items-center justify-center gap-3">
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
            className={`touch-manipulation w-full rounded-[28px] border px-5 py-5 text-base font-semibold text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-subtle)] ${
              submitted
                ? answerResult === 'exact'
                  ? 'border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)]'
                  : answerResult === 'partial'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-red-300 bg-red-50 animate-shake'
                : 'border-[var(--color-border)] bg-white/78 focus:border-[var(--color-primary)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(43,122,11,0.12)]'
            }`}
          />

          {submitted && (
            <div
              className={`absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full ${
                answerResult === 'exact'
                  ? 'bg-[var(--color-primary)] text-white'
                  : answerResult === 'partial'
                    ? 'bg-amber-500 text-white'
                    : 'bg-red-500 text-white'
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
          className={`mt-5 animate-fade-in rounded-[24px] border p-5 ${
            answerResult === 'exact'
              ? 'border-[rgba(43,122,11,0.18)] bg-[linear-gradient(135deg,rgba(223,236,205,0.78),rgba(255,255,255,0.92))]'
              : answerResult === 'partial'
                ? 'border-[rgba(184,126,39,0.22)] bg-[linear-gradient(135deg,rgba(255,248,235,0.96),rgba(255,255,255,0.92))] shadow-[0_18px_44px_-34px_rgba(184,126,39,0.42)]'
                : 'border-[rgba(220,38,38,0.16)] bg-[linear-gradient(135deg,rgba(254,242,242,0.96),rgba(255,255,255,0.92))]'
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
                    Quase lá
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-snug text-[var(--color-text)]">
                    O sentido bate, mas a forma ainda não está exata.
                  </p>
                </div>
                <span className="inline-flex shrink-0 rounded-full bg-[rgba(184,126,39,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Parcial
                </span>
              </div>
              <div className="mt-4 rounded-[18px] border border-[rgba(184,126,39,0.14)] bg-white/76 px-4 py-3">
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
                ? 'btn-ghost border-[rgba(184,126,39,0.16)] bg-white/78 text-[var(--color-text)] hover:bg-white'
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
