'use client'

import { useState, useMemo } from 'react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import { Check, X } from 'lucide-react'
import confetti from 'canvas-confetti'

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
    const pt = card.portuguese_translation || card.pt || ''
    const wrongOptions = allCards
      .filter((c) => c.id !== card.id)
      .map((c) => c.portuguese_translation || c.pt || '')

    const shuffledWrong = shuffleArray(wrongOptions).slice(0, 3)
    return shuffleArray([pt, ...shuffledWrong])
  }, [card, allCards])

  function handleSelect(option: string) {
    if (isValidated) return
    setSelected(option)
  }

  function triggerConfetti() {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#0D9488', '#3B82F6', '#F59E0B', '#10B981', '#EC4899']
    }

    confetti({
      ...defaults,
      particleCount: 50,
      scalar: 1.2,
      shapes: ['circle', 'square'],
      origin: { x: 0.5, y: 0.6 }
    })

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 30,
        scalar: 0.8,
        shapes: ['circle'],
        origin: { x: 0.3, y: 0.7 }
      })
    }, 100)

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 30,
        scalar: 0.8,
        shapes: ['circle'],
        origin: { x: 0.7, y: 0.7 }
      })
    }, 200)
  }

  function handleCheck() {
    if (!selected || isValidated) return

    setIsValidated(true)

    const pt = card.portuguese_translation || card.pt || ''
    if (selected === pt) {
      triggerConfetti()
      onCorrect()
    } else {
      onWrong()
    }
  }

  const labels = ['A', 'B', 'C', 'D']

  return (
    <div className="flex w-full flex-col items-center justify-between min-h-[60vh] sm:min-h-[500px] px-4">

      {/* Question */}
      <div className="glass-card w-full max-w-4xl py-8 sm:py-14 px-4 sm:px-8 mb-6 sm:mb-10 text-center animate-slide-up">
        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)] leading-tight">
          {card.english_phrase || card.en}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl mb-auto">
        {options.map((option, i) => {
          const pt = card.portuguese_translation || card.pt || ''
          let boxStyle = 'bg-white border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] cursor-pointer'

          if (isValidated) {
            if (option === pt) {
              boxStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 scale-[1.02]'
            } else if (option === selected) {
              boxStyle = 'bg-red-50 border-red-300 text-red-700 opacity-80'
            } else {
              boxStyle = 'opacity-30 bg-white border-[var(--color-border)]'
            }
          } else if (option === selected) {
            boxStyle = 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)] scale-[1.02] cursor-pointer'
          }

          return (
            <button
              key={`${option}-${i}`}
              onClick={() => handleSelect(option)}
              disabled={isValidated}
              className={`rounded-xl p-4 sm:p-5 min-h-[100px] sm:min-h-[140px] flex flex-col items-center justify-center text-center border-2 transition-all duration-200 touch-target ${boxStyle}`}
            >
              <div className="w-full flex flex-col items-center space-y-2 sm:space-y-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                  isValidated && option === pt
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : isValidated && option === selected
                      ? 'bg-red-500 text-white border-red-500'
                      : option === selected
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}>
                  {isValidated && option === pt ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : isValidated && option === selected ? (
                    <X className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    labels[i]
                  )}
                </span>
                <span className="text-[15px] font-semibold leading-tight">
                  {option}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer Check Button */}
      <div className="w-full max-w-4xl mt-12 flex justify-center pb-8">
        <button
          onClick={handleCheck}
          disabled={!selected || isValidated}
          className={`px-12 py-4 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer ${
            (!selected || isValidated)
            ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-subtle)] border border-[var(--color-border)] cursor-not-allowed'
            : 'btn-primary'
          }`}
        >
          {isValidated ? 'Verificado' : 'Verificar Resposta'}
        </button>
      </div>
    </div>
  )
}
