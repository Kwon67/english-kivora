'use client'

import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { Check, X } from 'lucide-react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'

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
      colors: ['#0F766E', '#1D4ED8', '#EA580C', '#0F9F6E'],
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
      <div className="premium-card p-6 text-center sm:p-8 lg:p-10">
        <p className="section-kicker">Choose the right translation</p>
        <h2
          data-testid="multiple-choice-question"
          className="mt-6 text-4xl font-semibold leading-[1.02] text-[var(--color-text)] sm:text-5xl"
        >
          {card.english_phrase || card.en}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
          Leia a frase e escolha a alternativa que corresponde melhor em portugues.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option, index) => {
          let boxStyle =
            'border-[var(--color-border)] bg-white/76 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-white'

          if (isValidated) {
            if (option === correctTranslation) {
              boxStyle = 'border-emerald-300 bg-emerald-50 text-emerald-800'
            } else if (option === selected) {
              boxStyle = 'border-red-300 bg-red-50 text-red-700'
            } else {
              boxStyle = 'border-[var(--color-border)] bg-white/45 text-[var(--color-text-subtle)] opacity-60'
            }
          } else if (option === selected) {
            boxStyle =
              'border-[var(--color-primary)] bg-[linear-gradient(135deg,rgba(216,244,239,0.96),rgba(219,232,255,0.8))] text-[var(--color-text)] shadow-[0_24px_40px_-32px_rgba(15,118,110,0.6)]'
          }

          return (
            <button
              key={`${option}-${index}`}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={isValidated}
              data-testid="multiple-choice-option"
              className={`rounded-[26px] border p-5 text-left transition-all duration-200 ${boxStyle}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    isValidated && option === correctTranslation
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : isValidated && option === selected
                        ? 'border-red-500 bg-red-500 text-white'
                        : option === selected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                          : 'border-[var(--color-border)] bg-white/78 text-[var(--color-text-muted)]'
                  }`}
                >
                  {isValidated && option === correctTranslation ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : isValidated && option === selected ? (
                    <X className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    labels[index]
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                    Opcao {labels[index]}
                  </p>
                  <p className="mt-3 text-lg font-semibold leading-snug">{option}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={handleCheck}
          disabled={!selected || isValidated}
          className={`min-w-[220px] rounded-full px-6 py-4 text-base font-semibold transition-all ${
            !selected || isValidated
              ? 'cursor-not-allowed border border-[var(--color-border)] bg-white/56 text-[var(--color-text-subtle)]'
              : 'btn-primary'
          }`}
        >
          {isValidated ? 'Resposta confirmada' : 'Verificar resposta'}
        </button>
      </div>
    </div>
  )
}
