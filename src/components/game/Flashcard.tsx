'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { Eye, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { Card } from '@/types/database.types'

interface FlashcardProps {
  card: Card
  onCorrect: () => void
  onWrong: () => void
}

export default function Flashcard({ card, onCorrect, onWrong }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  function triggerConfetti() {
    confetti({
      particleCount: 90,
      spread: 72,
      origin: { y: 0.6 },
      colors: ['#0F766E', '#1D4ED8', '#EA580C', '#0F9F6E'],
    })
  }

  function handleAnswer(knew: boolean) {
    setFlipped(false)
    if (knew) {
      triggerConfetti()
      onCorrect()
    } else {
      onWrong()
    }
  }

  return (
    <div className="premium-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker">Active recall</p>
        <h2
          data-testid="flashcard-question"
          className="mt-6 text-4xl font-semibold leading-[1.02] text-[var(--color-text)] sm:text-5xl"
        >
          {card.english_phrase || card.en}
        </h2>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(true)}
        data-testid="flashcard-reveal"
        className={`mt-8 flex min-h-[220px] w-full items-center justify-center rounded-[30px] border p-6 text-center transition-all ${
          flipped
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-dashed border-[var(--color-border)] bg-white/72 hover:border-[var(--color-primary)] hover:bg-white'
        }`}
      >
        {flipped ? (
          <div className="animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Tradução</p>
            <p className="mt-4 text-3xl font-semibold leading-tight text-[var(--color-text)] sm:text-4xl">
              {card.portuguese_translation || card.pt}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[var(--color-text-subtle)]">
            <Eye className="h-7 w-7" strokeWidth={1.7} />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">Toque para revelar</p>
          </div>
        )}
      </button>

      {flipped && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 animate-fade-in">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            data-testid="flashcard-wrong"
            className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-left text-red-700 transition-colors hover:bg-red-100"
          >
            <div className="flex items-center gap-3">
              <ThumbsDown className="h-5 w-5" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold">Errei</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-red-500">Volta depois</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAnswer(true)}
            data-testid="flashcard-correct"
            className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-left text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-5 w-5" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold">Acertei</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-500">Segue o fluxo</p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
