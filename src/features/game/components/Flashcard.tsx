'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, ThumbsDown, ThumbsUp, ArrowLeft, ArrowRight } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton from '@/components/ui/AudioButton'
import { feedback } from '@/lib/feedback'
import { m, useMotionValue, useTransform, PanInfo, useAnimation } from 'framer-motion'

interface FlashcardProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
}

export default function Flashcard({ card, onCorrect, onWrong }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)
  const [startTime] = useState(() => Date.now())
  const controls = useAnimation()
  
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-10, 10])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  
  // Opacity for the "Acertei" / "Errei" hints overlay
  const rightHintOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1])
  const leftHintOpacity = useTransform(x, [0, -50, -150], [0, 0.5, 1])

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

  const handleAnswer = useCallback(async (knew: boolean) => {
    const latencyMs = Date.now() - startTime
    
    // Animate out of screen before resolving
    if (knew) {
      await controls.start({ x: 300, opacity: 0, transition: { duration: 0.2 } })
      triggerConfetti()
      onCorrect(latencyMs)
    } else {
      await controls.start({ x: -300, opacity: 0, transition: { duration: 0.2 } })
      onWrong(latencyMs)
    }
  }, [onCorrect, onWrong, startTime, controls])

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!flipped) return
    if (info.offset.x > 100) {
      handleAnswer(true)
    } else if (info.offset.x < -100) {
      handleAnswer(false)
    }
  }, [flipped, handleAnswer])

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

  // Reset animations when card changes
  useEffect(() => {
    controls.set({ x: 0, opacity: 1, rotate: 0 })
    x.set(0)
    setTimeout(() => setFlipped(false), 0)
  }, [card.id, controls, x])

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-5">
      <div className="premium-card p-6 sm:p-8 lg:p-10 overflow-hidden">
        <div className="text-center">
          <p className="section-kicker">Recordação ativa</p>
          {flipped && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)] animate-fade-in flex items-center justify-center gap-2">
              <ArrowLeft className="h-3 w-3" />
              Arraste para responder
              <ArrowRight className="h-3 w-3" />
            </p>
          )}
        </div>

        <m.div
          animate={controls}
          style={{ x, rotate, opacity, willChange: 'transform' }}
          drag={flipped ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={handleDragEnd}
          onClick={!flipped ? handleFlip : undefined}
          data-testid="flashcard-reveal"
          aria-live="polite"
          aria-expanded={flipped}
          aria-label={flipped ? 'Cartão revelado com tradução. Arraste para a direita para Acertei e para a esquerda para Errei.' : 'Toque para revelar tradução'}
          className={`relative mt-6 flex w-full overflow-hidden rounded-[2.25rem] border text-center transition-colors duration-300 ${
            flipped
              ? 'border-[var(--color-primary)]/20 bg-[var(--color-surface-container-high)] shadow-lg cursor-grab active:cursor-grabbing'
              : 'border-[var(--color-border)] bg-[var(--color-surface-container)] hover:border-[var(--color-primary)]/30 hover:shadow-xl cursor-pointer'
          }`}
        >
          {flipped && (
            <>
              {/* Acertei Overlay */}
              <m.div 
                style={{ opacity: rightHintOpacity }}
                className="absolute inset-0 z-10 flex items-center justify-end bg-gradient-to-l from-[var(--color-primary)]/20 to-transparent pr-8 pointer-events-none"
              >
                <div className="rounded-full bg-[var(--color-primary)] p-4 text-[var(--color-on-primary)] shadow-lg transform rotate-12">
                  <ThumbsUp className="h-10 w-10" />
                </div>
              </m.div>

              {/* Errei Overlay */}
              <m.div 
                style={{ opacity: leftHintOpacity }}
                className="absolute inset-0 z-10 flex items-center justify-start bg-gradient-to-r from-[var(--color-error)]/20 to-transparent pl-8 pointer-events-none"
              >
                <div className="rounded-full bg-[var(--color-error)] p-4 text-[var(--color-on-error)] shadow-lg transform -rotate-12">
                  <ThumbsDown className="h-10 w-10" />
                </div>
              </m.div>
            </>
          )}

          <div className="flex min-h-[24rem] w-full flex-col p-6 sm:min-h-[26rem] sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <span className="stitch-pill bg-[var(--color-surface-container-high)] text-[var(--color-primary)]/70">
                RECORDAÇÃO ATIVA
              </span>

              {card.audio_url && (
                <AudioButton url={card.audio_url} autoPlay={true} variant="game" className="!mt-0 shrink-0" />
              )}
            </div>

            <div className="flex flex-1 flex-col justify-center py-6 sm:py-8 relative z-20">
              {flipped ? (
                <div className="animate-fade-in pointer-events-none">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-primary)] opacity-60">Tradução</p>
                  <p className="text-responsive-lg mx-auto mt-6 max-w-[15ch] text-balance text-[var(--color-text)] tracking-tight">
                    {card.portuguese_translation || card.pt}
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in pointer-events-none">
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
              <div className="animate-fade-in text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)] opacity-60 pointer-events-none">
                Arraste o card
              </div>
            )}
          </div>
        </m.div>
      </div>

      {flipped && (
        <div className="grid gap-4 animate-fade-in sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            data-testid="flashcard-wrong"
            className="touch-manipulation rounded-[1.75rem] border border-[var(--color-error)]/20 bg-[var(--color-surface-container)] px-6 py-4 text-center text-[var(--color-error)] transition-all hover:bg-[var(--color-error)]/10 active:scale-95"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <ThumbsDown className="h-5 w-5" strokeWidth={2.5} />
              <p className="text-lg font-black">Errei</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAnswer(true)}
            data-testid="flashcard-correct"
            className="touch-manipulation rounded-[1.75rem] bg-[var(--color-primary)] px-6 py-4 text-center text-[var(--color-on-primary)] transition-all hover:brightness-110 shadow-lg active:scale-95"
          >
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-black">Acertei</p>
              <ThumbsUp className="h-5 w-5" strokeWidth={2.5} />
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
