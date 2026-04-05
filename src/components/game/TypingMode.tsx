'use client'

import { useState, useRef, useEffect } from 'react'
import { isCloseEnough } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import { Check, X } from 'lucide-react'

interface TypingModeProps {
  card: Card
  onCorrect: () => void
  onWrong: () => void
}

export default function TypingMode({ card, onCorrect, onWrong }: TypingModeProps) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitted || !input.trim()) return

    const pt = card.portuguese_translation || card.pt || ''
    const correct = isCloseEnough(input, pt)
    setIsCorrectAnswer(correct)
    setSubmitted(true)

    if (correct) {
      onCorrect()
    } else {
      onWrong()
    }
  }

  return (
    <div className="card relative overflow-hidden p-4 sm:p-8 animate-slide-up max-w-[560px] mx-auto w-full">
      {/* Question */}
      <div className="text-center mb-4 sm:mb-8">
        <p className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-2 sm:mb-3">
          Traduza para Português
        </p>
        <h2 className="text-xl sm:text-3xl font-bold text-[var(--color-text)] tracking-tight leading-tight">
          {card.english_phrase || card.en}
        </h2>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mb-3 sm:mb-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted}
            placeholder="Digite a tradução..."
            autoComplete="off"
            className={`w-full border-2 px-4 sm:px-5 py-3 sm:py-4 rounded-xl text-base text-[var(--color-text)] font-medium outline-none transition-all duration-200 placeholder:text-[var(--color-text-subtle)] touch-target ${
              submitted
                ? isCorrectAnswer
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-red-300 bg-red-50 animate-shake'
                : 'border-[var(--color-border)] bg-[var(--color-bg)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15'
            }`}
          />
          {submitted && (
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center ${
              isCorrectAnswer ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
            }`}>
              {isCorrectAnswer ? (
                <Check className="w-4 h-4" strokeWidth={3} />
              ) : (
                <X className="w-4 h-4" strokeWidth={3} />
              )}
            </div>
          )}
        </div>

        {!submitted && (
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-primary w-full mt-3 sm:mt-4 py-3 sm:py-4 text-base cursor-pointer touch-target"
          >
            Confirmar Resposta
          </button>
        )}
      </form>

      {/* Feedback */}
      {submitted && (
        <div className="text-center animate-fade-in px-2">
          {!isCorrectAnswer ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Resposta correta: <span className="text-[var(--color-error)] font-bold block text-base sm:text-lg mt-1">&quot;{card.portuguese_translation || card.pt}&quot;</span>
            </p>
          ) : (
            <p className="text-emerald-700 font-semibold text-sm">Excelente! Próximo...</p>
          )}
        </div>
      )}
    </div>
  )
}
