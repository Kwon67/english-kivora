'use client'

import { useMemo, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { Check, X, ArrowRight } from 'lucide-react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'
import { m, AnimatePresence } from 'framer-motion'

const WRONG_OPTIONS_COUNT = 3
const CONFETTI_COLORS = ['#1f2937', '#374151', '#4b5563', '#1f2937'] as const

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

  const options = useMemo(() => {
    const correctTranslation = card.portuguese_translation || card.pt || ''
    const wrongOptions = allCards
      .filter((item) => item.id !== card.id)
      .map((item) => item.portuguese_translation || item.pt || '')

    return shuffleArray([correctTranslation, ...shuffleArray(wrongOptions).slice(0, WRONG_OPTIONS_COUNT)])
  }, [allCards, card])

  const handleSelect = useCallback((option: string) => {
    if (isValidated) return
    setSelected(option)
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
      onCorrect()
    } else {
      onWrong()
    }
  }, [selected, isValidated, onCorrect, onWrong, triggerConfetti])

  const labels = ['A', 'B', 'C', 'D']
  const correctTranslation = card.portuguese_translation || card.pt || ''

  return (
    <div className="flex w-full flex-col gap-6">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card relative overflow-hidden p-6 text-center sm:p-8 lg:p-10"
      >
        {/* Decorative background element */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-secondary/5 blur-3xl" />

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
          <div className="h-0.5 w-8 rounded-full bg-gray-200" />
        </div>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] font-medium">
          Selecione a alternativa que traduz corretamente a frase acima.
        </p>
      </m.div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {options.map((option, index) => {
            let boxStyle =
              'border-gray-100 bg-white text-gray-900 hover:border-gray-300 hover:shadow-sm'

            if (isValidated) {
              if (option === correctTranslation) {
                boxStyle = 'border-gray-900 bg-gray-900 text-white'
              } else if (option === selected) {
                boxStyle = 'border-gray-300 bg-gray-100 text-gray-600'
              } else {
                boxStyle = 'border-gray-100 bg-gray-50 text-gray-400 opacity-50'
              }
            } else if (option === selected) {
              boxStyle =
                'border-gray-900 bg-gray-900 text-white'
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
                onClick={() => handleSelect(option)}
                disabled={isValidated}
                aria-pressed={selected === option}
                aria-label={`Opção: ${option}`}
                className={`group relative flex items-center gap-3 rounded-xl border p-3 sm:p-4 md:p-5 text-left transition-all duration-300 lg:p-5 ${boxStyle}`}
              >
                <div
                  className={`flex h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-xl border text-sm sm:text-base font-semibold transition-all duration-300 ${
                    isValidated && option === correctTranslation
                      ? 'border-gray-900 bg-white text-gray-900'
                      : isValidated && option === selected
                        ? 'border-gray-300 bg-white text-gray-900'
                        : option === selected
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-400 group-hover:border-gray-400'
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
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-primary/60 transition-colors">
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
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
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
              : 'bg-primary text-white shadow-[0_12px_30px_-10px_rgba(43,122,11,0.5)] hover:scale-105 hover:shadow-[0_20px_40px_-12px_rgba(43,122,11,0.6)] active:scale-95'
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
