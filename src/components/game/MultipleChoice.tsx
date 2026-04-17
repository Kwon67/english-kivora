import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { Check, X, ArrowRight } from 'lucide-react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'
import { m, AnimatePresence } from 'framer-motion'

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

    return shuffleArray([correctTranslation, ...shuffleArray(wrongOptions).slice(0, 3)])
  }, [allCards, card])

  function handleSelect(option: string) {
    if (isValidated) return
    setSelected(option)
  }

  function triggerConfetti() {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.82,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#2B7A0B', '#1f5f08', '#163c06', '#2B7A0B'],
    }

    confetti({
      ...defaults,
      particleCount: 48,
      scalar: 1.15,
      shapes: ['circle', 'square'],
      origin: { x: 0.5, y: 0.58 },
    })
  }

  function handleCheck() {
    if (!selected || isValidated) return

    setIsValidated(true)
    const correctTranslation = card.portuguese_translation || card.pt || ''

    if (selected === correctTranslation) {
      triggerConfetti()
      onCorrect()
    } else {
      onWrong()
    }
  }

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
              className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {card.english_phrase || card.en}
            </h2>
            <AudioButton url={card.audio_url} autoPlay={true} />
          </div>
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary/40 to-secondary/40" />
        </div>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] font-medium">
          Selecione a alternativa que traduz corretamente a frase acima.
        </p>
      </m.div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {options.map((option, index) => {
            let boxStyle =
              'border-[var(--color-border)] bg-white/80 backdrop-blur-sm text-[var(--color-text)] hover:border-[var(--color-primary-light)] hover:bg-white hover:shadow-md'

            if (isValidated) {
              if (option === correctTranslation) {
                boxStyle = 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
              } else if (option === selected) {
                boxStyle = 'border-red-500 bg-red-50/50 text-red-700'
              } else {
                boxStyle = 'border-[var(--color-border)] bg-white/40 text-[var(--color-text-subtle)] opacity-50'
              }
            } else if (option === selected) {
              boxStyle =
                'border-[var(--color-primary)] bg-primary/5 text-[var(--color-primary)] shadow-lg ring-2 ring-primary/10'
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
                className={`group relative flex items-center gap-4 rounded-[2rem] border p-5 text-left transition-all duration-300 sm:p-6 ${boxStyle}`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 text-base font-black transition-all duration-300 ${
                    isValidated && option === correctTranslation
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                      : isValidated && option === selected
                        ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-200'
                        : option === selected
                          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30'
                          : 'border-gray-200 bg-white text-gray-400 group-hover:border-primary/30 group-hover:text-primary'
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
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 group-hover:text-primary/60 transition-colors">
                    Alternativa {labels[index]}
                  </p>
                  <p className="mt-1 text-lg font-bold leading-tight truncate">{option}</p>
                </div>

                {!isValidated && (
                  <m.div
                    className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                  >
                    <ArrowRight className="h-5 w-5 text-primary" />
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
          className={`group relative min-w-[280px] overflow-hidden rounded-full py-5 text-lg font-black tracking-wide transition-all duration-500 ${
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
          
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isValidated ? (
              <>
                <Check className="h-6 w-6" strokeWidth={3} />
                Validado
              </>
            ) : (
              <>
                Confirmar Resposta
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>

          {/* Shimmer effect when selected */}
          {selected && !isValidated && (
            <m.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
          )}
        </button>
      </m.div>
    </div>
  )
}
