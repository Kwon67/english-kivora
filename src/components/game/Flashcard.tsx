'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'
import { feedback } from '@/lib/feedback'

interface FlashcardProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
}

export default function Flashcard({ card, onCorrect, onWrong }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)
  const [startTime] = useState(() => Date.now())

  const triggerConfetti = async () => {
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#fdfff4', '#b4cc9b', '#f0e266', '#3e4a34'],
      })
  }

  const handleFlip = useCallback(() => {
    if (flipped) return
    setFlipped(true)
    feedback.click()
  }, [flipped])

  const handleAnswer = useCallback((knew: boolean) => {
    const latencyMs = Date.now() - startTime
    setFlipped(false)
    if (knew) {
      triggerConfetti()
      feedback.success()
      onCorrect(latencyMs)
    } else {
      feedback.error()
      onWrong(latencyMs)
    }
  }, [onCorrect, onWrong, startTime])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      if (!flipped && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault()
        handleFlip()
      } else if (flipped) {
        if (e.key === '1') {
          e.preventDefault()
          handleAnswer(false)
        } else if (e.key === '2' || e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault()
          handleAnswer(true)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipped, handleFlip, handleAnswer])

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-5">
      <div className="premium-card p-6 sm:p-8 lg:p-10">
        <div className="text-center">
          <p className="section-kicker">Recordação ativa</p>
        </div>

        <button
          type="button"
          onClick={handleFlip}
          data-testid="flashcard-reveal"
          aria-live="polite"
          aria-expanded={flipped}
          aria-label={flipped ? 'Cartão revelado com tradução' : 'Toque para revelar tradução'}
          className={`relative mt-6 flex w-full overflow-hidden rounded-[2.25rem] border text-center transition-all duration-300 ${
            flipped
              ? 'border-[var(--color-primary)]/20 bg-[var(--color-surface-container-high)] shadow-lg'
              : 'border-[var(--color-border)] bg-[var(--color-surface-container)] hover:border-[var(--color-primary)]/30 hover:shadow-xl'
          }`}
        >
          <div className="flex min-h-[24rem] w-full flex-col p-6 sm:min-h-[26rem] sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <span className="stitch-pill bg-[var(--color-surface-container-high)] text-[var(--color-primary)]/70">
                RECORDAÇÃO ATIVA
              </span>

              {card.audio_url && (
                <AudioButton url={card.audio_url} autoPlay={true} className="!mt-0 shrink-0 bg-[var(--color-surface-container-high)] p-2 rounded-full border border-[var(--color-border)]" />
              )}
            </div>

            <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
              {flipped ? (
                <div className="animate-fade-in">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)] opacity-60">Tradução</p>
                  <p className="text-responsive-lg mx-auto mt-6 max-w-[15ch] text-balance text-[var(--color-text)] tracking-tight">
                    {card.portuguese_translation || card.pt}
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <h2
                    data-testid="flashcard-question"
                    className="text-responsive-lg mx-auto max-w-[15ch] text-balance text-[var(--color-text)] sm:text-responsive-xl tracking-tight"
                  >
                    {card.english_phrase || card.en}
                  </h2>
                  <div className="mt-10 flex flex-col items-center gap-4 text-[var(--color-text-subtle)] opacity-50">
                    <Eye className="h-8 w-8" strokeWidth={1.5} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Toque para revelar</p>
                  </div>
                </div>
              )}
            </div>

            {flipped && (
              <div className="animate-fade-in text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)] opacity-60">
                Quão fácil foi lembrar?
              </div>
            )}
          </div>
        </button>
      </div>

      {flipped && (
        <div className="grid gap-4 animate-fade-in sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            data-testid="flashcard-wrong"
            className="touch-manipulation rounded-[1.75rem] border border-[var(--color-error)]/20 bg-[var(--color-surface-container)] px-6 py-6 text-center text-[var(--color-error)] transition-all hover:bg-[var(--color-error)]/10 active:scale-95"
          >
            <div className="flex flex-col items-center gap-2">
              <ThumbsDown className="h-6 w-6" strokeWidth={2.5} />
              <p className="text-xl font-black">Errei</p>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">Preciso praticar</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAnswer(true)}
            data-testid="flashcard-correct"
            className="touch-manipulation rounded-[1.75rem] bg-[var(--color-primary)] px-6 py-6 text-center text-[var(--color-on-primary)] transition-all hover:brightness-110 shadow-lg active:scale-95"
          >
            <div className="flex flex-col items-center gap-2">
              <ThumbsUp className="h-6 w-6" strokeWidth={2.5} />
              <p className="text-xl font-black">Acertei</p>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80">Estou fluindo</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
