'use client'

import { CELEBRATION_COLORS } from '@/lib/brandColors'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, ThumbsDown, ThumbsUp, ArrowLeft, ArrowRight } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton from '@/components/ui/AudioButton'
import { feedback } from '@/lib/feedback'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useDrag } from '@use-gesture/react'

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
  const panel = useRef<HTMLDivElement>(null)
  const rightHint = useRef<HTMLDivElement>(null)
  const leftHint = useRef<HTMLDivElement>(null)
  const offset = useRef({ x: 0 })
  const animation = useRef<gsap.core.Tween | null>(null)
  const draw = useRef<(x: number) => void>(() => {})

  useGSAP(() => {
    const node = panel.current!
    const setX = gsap.quickSetter(node, 'x', 'px')
    const setAngle = gsap.quickSetter(node, 'rotation', 'deg')
    const setOpacity = gsap.quickSetter(node, 'opacity')
    const setRight = rightHint.current && gsap.quickSetter(rightHint.current, 'opacity')
    const setLeft = leftHint.current && gsap.quickSetter(leftHint.current, 'opacity')
    const clamp = gsap.utils.clamp(0, 1)
    draw.current = (x) => {
      offset.current.x = x
      setX(x)
      setAngle(gsap.utils.clamp(-10, 10, x / 20))
      setOpacity(clamp((200 - Math.abs(x)) / 100))
      const hint = clamp(Math.abs(x) <= 50 ? Math.abs(x) / 100 : 0.5 + (Math.abs(x) - 50) / 200)
      setRight?.(x > 0 ? hint : 0)
      setLeft?.(x < 0 ? hint : 0)
    }
    draw.current(0)
  }, { scope: panel, dependencies: [flipped, card.id], revertOnUpdate: true })

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

  const handleAnswer = useCallback((knew: boolean) => {
    const current = response.current
    if (!flipped || current.answered || !current.active || panel.current?.closest('[inert]')) return
    current.answered = true
    const latencyMs = Date.now() - current.startedAt
    animation.current?.kill()
    const finish = () => {
      if (!current.active) return
      if (knew) {
        void triggerConfetti()
        onCorrect(latencyMs)
      } else {
        onWrong(latencyMs)
      }
    }
    if (reducedMotion) {
      gsap.set(panel.current, { opacity: 0 })
      finish()
      return
    }
    animation.current = gsap.to(offset.current, {
      x: knew ? 300 : -300, duration: 0.2, ease: 'power1.inOut',
      onUpdate: () => draw.current(offset.current.x), onComplete: finish,
    })
  }, [flipped, onCorrect, onWrong, reducedMotion])

  const bindDrag = useDrag(({ first, last, xy, initial, canceled, event }) => {
    if (response.current.answered || !response.current.active) return
    if (first) animation.current?.kill()
    const distance = xy[0] - initial[0]
    if (!last) {
      draw.current(distance * 0.8)
      return
    }
    if (!canceled && event.type !== 'pointercancel' && event.type !== 'touchcancel' && Math.abs(distance) > 100) {
      handleAnswer(distance > 0)
      return
    }
    animation.current = gsap.to(offset.current, {
      x: 0, duration: reducedMotion ? 0 : 0.4, ease: 'back.out(0.8)',
      onUpdate: () => draw.current(offset.current.x),
    })
  }, { enabled: flipped, axis: 'x', filterTaps: true })

  useEffect(() => {
    if (reducedMotion) animation.current?.progress(1)
  }, [reducedMotion])

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

  useGSAP(() => {
    const current = { answered: false, active: true, startedAt: Date.now() }
    response.current = current
    return () => {
      current.active = false
      animation.current?.kill()
    }
  }, { scope: panel, dependencies: [card.id], revertOnUpdate: true })

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-3 sm:space-y-5">
      <div
        ref={panel}
        {...bindDrag()}
        style={{ willChange: 'transform', touchAction: flipped ? 'pan-y' : undefined }}
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
            <div ref={rightHint}
              style={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-end bg-gradient-to-l from-[var(--color-primary)]/20 to-transparent pr-8 pointer-events-none"
            >
              <div className="rounded-full bg-primary p-4 text-on-primary shadow-lg transform rotate-12">
                <ThumbsUp className="h-10 w-10" />
              </div>
            </div>

            {/* Errei Overlay */}
            <div ref={leftHint}
              style={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-start bg-gradient-to-r from-[var(--color-error)]/20 to-transparent pl-8 pointer-events-none"
            >
              <div className="rounded-full bg-[var(--color-error)] p-4 text-[var(--color-on-error)] shadow-lg transform -rotate-12">
                <ThumbsDown className="h-10 w-10" />
              </div>
            </div>
          </>
        )}

        {/* The 24rem floor was set for desktop; on a 667px-tall phone it reserved 384px for two
              lines of text and pushed Errei/Acertei off screen. Let the card size to its content
              below `sm`, with a floor just tall enough to keep short prompts from looking cramped. */}
        <div className="flex min-h-[14rem] w-full flex-col p-5 sm:min-h-[17rem] sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <span className="workspace-chip text-xs">Flashcard</span>

            {(card.audio_url || card.english_phrase || card.en) && (
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
      </div>

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
