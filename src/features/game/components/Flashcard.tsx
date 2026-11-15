'use client'

import { CELEBRATION_COLORS } from '@/lib/brandColors'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, ThumbsDown, ThumbsUp, ArrowLeft, ArrowRight } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton from '@/components/ui/AudioButton'
import { feedback } from '@/lib/feedback'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'
import {
  m,
  useMotionValue,
  useTransform,
  PanInfo,
  useAnimation,
} from 'motion/react'

interface FlashcardProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
}

export default function Flashcard({
  card,
  onCorrect,
  onWrong,
}: FlashcardProps) {
  const reducedMotion = useHydratedReducedMotion()
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null)
  const flipped = flippedCardId === card.id
  const response = useRef({ answered: false, active: false, startedAt: 0 })
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
      disableForReducedMotion: true,
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: CELEBRATION_COLORS,
    })
  }

  const handleFlip = useCallback(() => {
    if (flipped) return
    setFlippedCardId(card.id)
    feedback.click()
  }, [flipped, card.id])

  const handleAnswer = useCallback(
    async (knew: boolean) => {
      const current = response.current
      if (!flipped || current.answered || !current.active) return
      // Claim the response synchronously, before keyboard, click or drag can race.
      current.answered = true
      const latencyMs = Date.now() - current.startedAt

      // Animate out of screen before resolving
      if (knew) {
        await controls.start({
          x: reducedMotion ? 0 : 300,
          opacity: 0,
          transition: { duration: reducedMotion ? 0 : 0.2 },
        })
        if (!current.active) return
        triggerConfetti()
        onCorrect(latencyMs)
      } else {
        await controls.start({
          x: reducedMotion ? 0 : -300,
          opacity: 0,
          transition: { duration: reducedMotion ? 0 : 0.2 },
        })
        if (!current.active) return
        onWrong(latencyMs)
      }
    },
    [onCorrect, onWrong, flipped, controls, reducedMotion],
  )

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!flipped) return
      if (info.offset.x > 100) {
        handleAnswer(true)
      } else if (info.offset.x < -100) {
        handleAnswer(false)
      }
    },
    [flipped, handleAnswer],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        Boolean(e.target.closest('button, a, input, textarea, select, [role="dialog"]'))
      )
        return

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
    const current = { answered: false, active: true, startedAt: Date.now() }
    response.current = current
    controls.set({ x: 0, opacity: 1, rotate: 0 })
    x.set(0)
    return () => {
      current.active = false
      controls.stop()
    }
  }, [card.id, controls, x])

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-3 sm:space-y-5">
      <m.div
        animate={controls}
        style={{ x, rotate, opacity, willChange: 'transform' }}
        drag={flipped ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        onClick={!flipped ? handleFlip : undefined}
        role={flipped ? 'group' : 'button'}
        tabIndex={flipped ? -1 : 0}
        data-testid="flashcard-reveal"
        aria-live="polite"
        aria-expanded={flipped}
        aria-label={
          flipped
            ? 'Cartão revelado com tradução. Arraste para a direita para Acertei e para a esquerda para Errei.'
            : 'Toque para revelar tradução'
        }
        data-tone="review"
        className={`exercise-prompt game-glass-card relative flex w-full select-none overflow-hidden text-left transition-colors duration-200 [-webkit-user-drag:none] ${flipped ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:border-primary/40'}`}
      >
        {flipped && (
          <>
            {/* Acertei Overlay */}
            <m.div
              style={{ opacity: rightHintOpacity }}
              className="absolute inset-0 z-10 flex items-center justify-end bg-gradient-to-l from-[var(--color-primary)]/20 to-transparent pr-8 pointer-events-none"
            >
              <div className="rounded-full bg-primary p-4 text-on-primary shadow-lg transform rotate-12">
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

        {/* The 24rem floor was set for desktop; on a 667px-tall phone it reserved 384px for two
              lines of text and pushed Errei/Acertei off screen. Let the card size to its content
              below `sm`, with a floor just tall enough to keep short prompts from looking cramped. */}
        <div className="flex min-h-[14rem] w-full flex-col p-5 sm:min-h-[17rem] sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <span className="workspace-chip text-xs">Flashcard</span>

            {card.audio_url && (
              <AudioButton
                url={card.audio_url}
                fallbackText={card.english_phrase || card.en}
                autoPlay={true}
                variant="game"
                className="!mt-0 shrink-0"
              />
            )}
          </div>

          <div className="relative z-20 flex flex-1 flex-col justify-center py-3 sm:py-8">
            {flipped ? (
              <div className="animate-fade-in pointer-events-none">
                <p className="text-sm font-medium text-primary">Tradução</p>
                <p className="mt-3 max-w-[25ch] text-2xl font-medium leading-tight text-text sm:text-4xl">
                  {card.portuguese_translation || card.pt}
                </p>
              </div>
            ) : (
              <div className="animate-fade-in pointer-events-none">
                <h2
                  data-testid="flashcard-question"
                  className="max-w-[25ch] text-2xl font-medium leading-tight text-text sm:text-4xl"
                >
                  {card.english_phrase || card.en}
                </h2>
                <div className="mt-5 flex items-center gap-2 text-text-subtle">
                  <Eye className="h-5 w-5" strokeWidth={1.5} />
                  <p className="text-sm font-medium">Toque para revelar</p>
                </div>
              </div>
            )}
          </div>

          {flipped && (
            <div className="pointer-events-none mt-2 text-sm text-text-muted">
              Arraste o card
            </div>
          )}
        </div>
      </m.div>

      {/* Two columns from the start: stacking them below `sm` added a whole button row, which is
          what put "Acertei" under the fold on a short phone. The drag arrows are decoration and
          drop out on narrow widths so the labels keep their room. */}
      {flipped && (
        <div className="grid animate-fade-in grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            data-testid="flashcard-wrong"
            className="workspace-button workspace-button-outline text-error"
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowLeft className="hidden h-4 w-4 sm:block" />
              <ThumbsDown className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <p className="text-sm font-semibold">Errei</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAnswer(true)}
            data-testid="flashcard-correct"
            className="premium-primary"
          >
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm font-semibold">Acertei</p>
              <ThumbsUp className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <ArrowRight className="hidden h-4 w-4 sm:block" />
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
