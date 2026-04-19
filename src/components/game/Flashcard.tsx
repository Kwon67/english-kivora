'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'

interface FlashcardProps {
  card: Card
  onCorrect: () => void
  onWrong: () => void
}

export default function Flashcard({ card, onCorrect, onWrong }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  const triggerConfetti = async () => {
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 90,
        spread: 72,
        origin: { y: 0.6 },
        colors: ['#2B7A0B', '#1f5f08', '#163c06', '#2B7A0B'],
      })
  }

  const handleAnswer = useCallback((knew: boolean) => {
    setFlipped(false)
    if (knew) {
      triggerConfetti()
      onCorrect()
    } else {
      onWrong()
    }
  }, [onCorrect, onWrong])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      if (!flipped && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped) {
        if (e.key === '1') {
          e.preventDefault()
          handleAnswer(false)
        } else if (e.key === '2') {
          e.preventDefault()
          handleAnswer(true)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipped, handleAnswer])

  return (
    <div className="premium-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker">Active recall</p>
        <div className="flex items-center justify-center gap-3">
          <h2
            data-testid="flashcard-question"
            className="text-3xl font-semibold leading-[1.04] text-[var(--color-text)] sm:text-5xl"
          >
            {card.english_phrase || card.en}
          </h2>
          <AudioButton url={card.audio_url} autoPlay={true} className="mt-1" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(true)}
        data-testid="flashcard-reveal"
        aria-live="polite"
        aria-expanded={flipped}
        aria-label={flipped ? 'Cartão revelado com tradução' : 'Toque para revelar tradução'}
        className={`touch-manipulation mt-8 flex min-h-[190px] w-full items-center justify-center rounded-[30px] border p-5 text-center transition-all sm:min-h-[220px] sm:p-6 ${
          flipped
            ? 'border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)]'
            : 'border-dashed border-[var(--color-border)] bg-white/72 hover:border-[var(--color-primary)] hover:bg-white'
        }`}
      >
        {flipped ? (
          <div className="animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">Tradução</p>
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
        <div className="mt-5 grid gap-3 animate-fade-in sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            data-testid="flashcard-wrong"
            className="touch-manipulation rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-left text-red-700 transition-colors hover:bg-red-100"
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
            className="touch-manipulation rounded-[24px] border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] px-5 py-4 text-left text-[var(--color-primary)] transition-colors hover:bg-[rgba(43,122,11,0.16)]"
          >
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-5 w-5" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold">Acertei</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-primary)]">Segue o fluxo</p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
