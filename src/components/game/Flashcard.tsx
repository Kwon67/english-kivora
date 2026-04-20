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
    <div className="mx-auto w-full max-w-[760px] space-y-5">
      <div className="premium-card p-6 sm:p-8 lg:p-10">
        <div className="text-center">
          <p className="section-kicker">Active recall</p>
        </div>

        <button
          type="button"
          onClick={() => setFlipped(true)}
          data-testid="flashcard-reveal"
          aria-live="polite"
          aria-expanded={flipped}
          aria-label={flipped ? 'Cartão revelado com tradução' : 'Toque para revelar tradução'}
          className={`relative mt-6 flex w-full overflow-hidden rounded-[1.75rem] border text-center transition-all ${
            flipped
              ? 'border-[rgba(70,98,89,0.16)] bg-[var(--color-surface-container-lowest)]'
              : 'border-[rgba(193,200,196,0.28)] bg-[var(--color-surface-container-lowest)] hover:shadow-[0_16px_48px_rgba(27,28,24,0.08)]'
          }`}
        >
          <div className="flex min-h-[22rem] w-full flex-col p-5 sm:min-h-[24rem] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
                Recall
              </span>

              {card.audio_url && (
                <AudioButton url={card.audio_url} autoPlay={true} className="!mt-0 shrink-0" />
              )}
            </div>

            <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
              {flipped ? (
                <div className="animate-fade-in">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">Tradução</p>
                  <p className="text-responsive-lg mx-auto mt-5 max-w-[12ch] text-balance text-[var(--color-text)]">
                    {card.portuguese_translation || card.pt}
                  </p>
                </div>
              ) : (
                <div>
                  <h2
                    data-testid="flashcard-question"
                    className="text-responsive-lg mx-auto max-w-[12ch] text-balance text-[var(--color-text)] sm:text-responsive-xl"
                  >
                    {card.english_phrase || card.en}
                  </h2>
                  <div className="mt-8 flex flex-col items-center gap-3 text-[var(--color-text-subtle)]">
                    <Eye className="h-7 w-7" strokeWidth={1.7} />
                    <p className="text-sm font-medium">Tap to reveal</p>
                  </div>
                </div>
              )}
            </div>

            {flipped && (
              <div className="animate-fade-in text-center text-sm text-[var(--color-text-subtle)]">
                Avalie abaixo se você lembrou sem esforço.
              </div>
            )}
          </div>
        </button>
      </div>

      {flipped && (
        <div className="grid gap-3 animate-fade-in sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            data-testid="flashcard-wrong"
            className="touch-manipulation rounded-[1.5rem] border border-[rgba(186,26,26,0.1)] bg-[var(--color-surface-container-low)] px-5 py-4 text-center text-[var(--color-error)] transition-colors hover:bg-[rgba(186,26,26,0.08)]"
          >
            <div className="flex flex-col items-center gap-1">
              <ThumbsDown className="h-5 w-5" strokeWidth={2} />
              <p className="text-lg font-semibold">Again</p>
              <p className="text-xs uppercase tracking-[0.14em] opacity-70">Needs work</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAnswer(true)}
            data-testid="flashcard-correct"
            className="touch-manipulation rounded-[1.5rem] border border-[rgba(70,98,89,0.18)] bg-[var(--color-primary)] px-5 py-4 text-center text-white transition-colors hover:bg-[var(--color-primary-container)]"
          >
            <div className="flex flex-col items-center gap-1">
              <ThumbsUp className="h-5 w-5" strokeWidth={2} />
              <p className="text-lg font-semibold">Knew it</p>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-on-primary-container)]/80">Keep flow</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
