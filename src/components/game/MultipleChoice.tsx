'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Check, X, ArrowRight } from 'lucide-react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'
import { m, AnimatePresence } from 'framer-motion'
import { feedback } from '@/lib/feedback'

const WRONG_OPTIONS_COUNT = 3
const CONFETTI_COLORS = ['#466259', '#5e7a71', '#735802', '#cae9de'] as const

interface MultipleChoiceProps {
  card: Card
  allCards: Card[]
  onCorrect: () => void
  onWrong: () => void
}

export default function MultipleChoice({
  card,
  allCards,
  onCorrect,
  onWrong,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isValidated, setIsValidated] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const options = useMemo(() => {
    const correctTranslation = card.portuguese_translation || card.pt || ''
    const wrongOptions = allCards
      .filter((item) => item.id !== card.id)
      .map((item) => item.portuguese_translation || item.pt || '')

    return shuffleArray([correctTranslation, ...shuffleArray(wrongOptions).slice(0, WRONG_OPTIONS_COUNT)])
  }, [allCards, card])

  const handleSelect = useCallback((option: string, index: number) => {
    if (isValidated) return
    setSelected(option)
    setFocusedIndex(index)
    feedback.click()
  }, [isValidated])

  const triggerConfetti = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.82,
      decay: 0.94,
      startVelocity: 30,
      colors: [...CONFETTI_COLORS],
    }

    confetti({
      ...defaults,
      particleCount: 48,
      scalar: 1.15,
      shapes: ['circle', 'square'],
      origin: { x: 0.5, y: 0.58 },
    })
  }, [])

  const handleCheck = useCallback(() => {
    if (!selected || isValidated) return

    setIsValidated(true)
    const correctTranslation = card.portuguese_translation || card.pt || ''

    if (selected === correctTranslation) {
      triggerConfetti()
      feedback.success()
      onCorrect()
    } else {
      feedback.error()
      onWrong()
    }
  }, [selected, isValidated, onCorrect, onWrong, triggerConfetti, card.portuguese_translation, card.pt])

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isValidated) return

      const key = e.key.toLowerCase()
      
      // Atalhos diretos A-D ou 1-4
      if (['a', '1'].includes(key)) handleSelect(options[0], 0)
      else if (['b', '2'].includes(key)) handleSelect(options[1], 1)
      else if (['c', '3'].includes(key)) handleSelect(options[2], 2)
      else if (['d', '4'].includes(key)) handleSelect(options[3], 3)
      
      // Navegação por setas
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFocusedIndex((prev) => {
          const next = prev === null ? 0 : (prev + 1) % options.length
          setSelected(options[next])
          return next
        })
        feedback.click()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFocusedIndex((prev) => {
          const next = prev === null ? options.length - 1 : (prev - 1 + options.length) % options.length
          setSelected(options[next])
          return next
        })
        feedback.click()
      }
      
      // Confirmar com Enter
      else if (e.key === 'Enter') {
        if (selected) {
          handleCheck()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [options, selected, isValidated, handleSelect, handleCheck])

  const labels = ['A', 'B', 'C', 'D']
  const correctTranslation = card.portuguese_translation || card.pt || ''

  return (
    <div className="flex w-full flex-col gap-6">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card relative overflow-hidden p-6 text-center sm:p-8 lg:p-10"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[rgba(70,98,89,0.07)] blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[rgba(115,88,2,0.06)] blur-3xl" />

        <p className="section-kicker mb-4">Traduza a frase</p>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <h2
              data-testid="multiple-choice-question"
              className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text)] lg:text-5xl break-words max-w-full"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {card.english_phrase || card.en}
            </h2>
            <AudioButton url={card.audio_url} autoPlay={true} />
          </div>
          <div className="h-0.5 w-8 rounded-full bg-[rgba(193,200,196,0.55)]" />
        </div>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] font-medium">
          Selecione a alternativa que traduz corretamente a frase acima.
        </p>
      </m.div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {options.map((option, index) => {
            let boxStyle =
              'border-[rgba(193,200,196,0.28)] bg-[var(--color-surface-container-lowest)] text-[var(--color-text)] hover:border-[rgba(114,121,117,0.35)] hover:bg-[var(--color-surface-container-low)]'

            const isFocused = focusedIndex === index

            if (isValidated) {
              if (option === correctTranslation) {
                boxStyle = 'border-[rgba(70,98,89,0.16)] bg-[var(--color-primary)] text-white shadow-[0_8px_20px_rgba(70,98,89,0.18)]'
              } else if (option === selected) {
                boxStyle = 'border-[rgba(186,26,26,0.14)] bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]'
              } else {
                boxStyle = 'border-[rgba(193,200,196,0.2)] bg-[var(--color-surface-container-low)] text-[var(--color-text-subtle)] opacity-55'
              }
            } else if (option === selected) {
              boxStyle =
                'border-[rgba(70,98,89,0.14)] bg-[var(--color-primary)] text-white shadow-[0_8px_20px_rgba(70,98,89,0.18)]'
            }

            if (isFocused && !isValidated && option !== selected) {
              boxStyle += ' ring-2 ring-[var(--color-primary)]/30 ring-offset-2'
            }

            return (
              <m.button
                key={`${option}-${index}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={!isValidated ? { scale: 1.02 } : {}}
                whileTap={!isValidated ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(option, index)}
                disabled={isValidated}
                aria-pressed={selected === option}
                aria-label={`Opção: ${option}`}
                className={`group relative flex items-center gap-3 rounded-[1.25rem] border p-3 text-left transition-all duration-300 sm:p-4 md:p-5 lg:p-5 ${boxStyle}`}
              >
                <div
                  className={`flex h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-[0.95rem] border text-sm sm:text-base font-semibold transition-all duration-300 ${
                    isValidated && option === correctTranslation
                      ? 'border-white/30 bg-white/10 text-white'
                    : isValidated && option === selected
                        ? 'border-[rgba(186,26,26,0.14)] bg-[var(--color-surface-container-lowest)] text-[var(--color-error)]'
                      : option === selected
                          ? 'border-white/30 bg-white/10 text-white'
                          : 'border-[rgba(193,200,196,0.35)] bg-[var(--color-surface-container-lowest)] text-[var(--color-text-subtle)] group-hover:border-[rgba(114,121,117,0.35)]'
                  }`}
                >
                  {isValidated && option === correctTranslation ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : isValidated && option === selected ? (
                    <X className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    labels[index]
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-subtle)] transition-colors group-hover:text-[var(--color-primary)]/70">
                    Alt {labels[index]}
                  </p>
                  <p className="mt-0.5 text-sm sm:text-base lg:text-lg font-bold leading-tight line-clamp-2">{option}</p>
                </div>

                {!isValidated && (
                  <m.div
                    className="hidden sm:block absolute right-4 lg:right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                  >
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 text-[var(--color-primary)]" />
                  </m.div>
                )}
              </m.button>
            )
          })}
        </AnimatePresence>
      </div>

      <m.div
        className="flex justify-center pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          type="button"
          onClick={handleCheck}
          disabled={!selected || isValidated}
          className={`group relative w-full sm:w-auto sm:min-w-[240px] lg:min-w-[280px] overflow-hidden rounded-full py-4 lg:py-5 text-base lg:text-lg font-black tracking-wide transition-all duration-500 ${
            !selected || isValidated
              ? 'cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-400'
              : 'bg-[var(--color-primary)] text-white shadow-[0_12px_30px_-10px_rgba(70,98,89,0.35)] hover:scale-105 hover:bg-[var(--color-primary-container)] hover:shadow-[0_20px_40px_-12px_rgba(70,98,89,0.38)] active:scale-95'
          }`}
        >
          {selected && !isValidated && (
            <m.div
              className="absolute inset-0 bg-white/20"
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.05, 1]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          )}
          
          <span className="relative z-10 flex items-center justify-center gap-2 lg:gap-3">
            {isValidated ? (
              <>
                <Check className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={3} />
                <span className="hidden sm:inline">Validado</span>
                <span className="sm:hidden">OK</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Confirmar Resposta</span>
                <span className="sm:hidden">Confirmar</span>
                <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
        </button>
      </m.div>
    </div>
  )
}
