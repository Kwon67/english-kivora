'use client'

import { useState } from 'react'
import type { Card } from '@/types/database.types'
import { Eye, ThumbsDown, ThumbsUp } from 'lucide-react'

interface FlashcardProps {
  card: Card
  onCorrect: () => void
  onWrong: () => void
}

export default function Flashcard({ card, onCorrect, onWrong }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() {
    setFlipped(true)
  }

  function handleAnswer(knew: boolean) {
    setFlipped(false)
    if (knew) {
      onCorrect()
    } else {
      onWrong()
    }
  }

  return (
    <div className="card relative overflow-hidden p-4 sm:p-8 animate-slide-up max-w-[560px] mx-auto w-full">
      {/* Title */}
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-2 sm:mb-3">
          Memorização Ativa
        </p>
        <h2 className="text-xl sm:text-3xl font-bold text-[var(--color-text)] tracking-tight leading-tight">
          {card.english_phrase || card.en}
        </h2>
      </div>

      {/* Flip Box */}
      <div
        className={`min-h-[80px] sm:min-h-[100px] rounded-xl border-2 p-4 sm:p-6 text-center transition-all duration-200 flex items-center justify-center mb-4 sm:mb-6 select-none touch-target ${
          flipped
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)] cursor-pointer'
        }`}
        onClick={handleFlip}
      >
        {flipped ? (
          <div className="animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">Tradução</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--color-text)]">{card.portuguese_translation || card.pt}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-subtle)]">
            <Eye className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            <p className="text-xs font-semibold uppercase tracking-wider">Toque para revelar</p>
          </div>
        )}
      </div>

      {/* Answer buttons */}
      {flipped && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 animate-fade-in">
          <button
            onClick={() => handleAnswer(false)}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 sm:py-4 text-center font-semibold text-red-700 transition-colors hover:bg-red-100 cursor-pointer touch-target"
          >
            <ThumbsDown className="w-4 h-4" strokeWidth={2} />
            <span className="text-sm sm:text-base">Errei</span>
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 sm:py-4 text-center font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 cursor-pointer touch-target"
          >
            <ThumbsUp className="w-4 h-4" strokeWidth={2} />
            <span className="text-sm sm:text-base">Acertei</span>
          </button>
        </div>
      )}
    </div>
  )
}
