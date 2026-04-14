'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { Check, X } from 'lucide-react'
import { isCloseEnough } from '@/lib/utils'
import type { Card } from '@/types/database.types'

interface TypingModeProps {
  card: Card
  onCorrect: () => void
  onWrong: () => void
}

export default function TypingMode({ card, onCorrect, onWrong }: TypingModeProps) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false)

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

    const translation = card.portuguese_translation || card.pt || ''
    const correct = isCloseEnough(input, translation)

    setIsCorrectAnswer(correct)
    setSubmitted(true)

    if (correct) {
      triggerConfetti()
      onCorrect()
    } else {
      onWrong()
    }
  }

  return (
    <div className="premium-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker">Write the translation</p>
        <h2
          data-testid="typing-question"
          className="mt-6 text-3xl font-semibold leading-[1.04] text-[var(--color-text)] sm:text-5xl"
        >
          {card.english_phrase || card.en}
        </h2>
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
                ? isCorrectAnswer
                  ? 'border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)]'
                  : 'border-red-300 bg-red-50 animate-shake'
                : 'border-[var(--color-border)] bg-white/78 focus:border-[var(--color-primary)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(43,122,11,0.12)]'
            }`}
          />

          {submitted && (
            <div
              className={`absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full ${
                isCorrectAnswer ? 'bg-[var(--color-primary)] text-white' : 'bg-red-500 text-white'
              }`}
            >
              {isCorrectAnswer ? (
                <Check className="h-4 w-4" strokeWidth={3} />
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
        <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-white/72 p-5 text-center animate-fade-in">
          {!isCorrectAnswer ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Resposta correta
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-error)]">
                &quot;{card.portuguese_translation || card.pt}&quot;
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                Excelente
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--color-primary)]">
                Boa lembrança. O próximo card já vem.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
