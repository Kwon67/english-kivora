'use client'

import { useCallback, useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Card } from '@/types/database.types'
import { getCardTypingTranslations } from '@/features/cards/lib/cardTranslations'
import { buildMultipleChoiceOptions } from '@/features/game/lib/multipleChoiceOptions'
import { feedback } from '@/lib/feedback'

interface ReadingComprehensionProps {
  card: Card
  allCards: Card[]
  passageText: string
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
}

export default function ReadingComprehension({
  card,
  allCards,
  passageText,
  onCorrect,
  onWrong,
}: ReadingComprehensionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isValidated, setIsValidated] = useState(false)
  const [startTime] = useState(() => Date.now())

  const acceptedAnswers = useMemo(() => getCardTypingTranslations(card), [card])
  const options = useMemo(() => buildMultipleChoiceOptions(card, allCards), [allCards, card])

  const handleCheck = useCallback(() => {
    if (!selected || isValidated) return

    setIsValidated(true)
    const latencyMs = Date.now() - startTime
    const normalizedSelected = selected.trim().toLowerCase()
    const isCorrect = acceptedAnswers.some(
      (answer) => answer.trim().toLowerCase() === normalizedSelected
    )

    if (isCorrect) {
      feedback.success()
      onCorrect(latencyMs)
    } else {
      feedback.error()
      onWrong(latencyMs)
    }
  }, [acceptedAnswers, isValidated, onCorrect, onWrong, selected, startTime])

  return (
    <div className="space-y-5">
      <p className="section-kicker">Leitura com compreensão</p>

      <article className="rounded-[1.25rem] border border-border-muted/20 bg-surface-container-low p-4 text-sm leading-relaxed text-text">
        {passageText}
      </article>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-subtle">Pergunta</p>
        <h3 className="mt-2 font-montserrat text-xl font-bold text-text">
          {card.english_phrase}
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option, index) => {
          const isSelected = selected === option
          const isCorrectOption = acceptedAnswers.some(
            (answer) => answer.trim().toLowerCase() === option.trim().toLowerCase()
          )
          const showResult = isValidated && (isSelected || isCorrectOption)

          return (
            <button
              key={`${option}-${index}`}
              type="button"
              disabled={isValidated}
              onClick={() => setSelected(option)}
              className={`rounded-[1rem] border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                showResult
                  ? isCorrectOption
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : isSelected
                      ? 'border-red-500/30 bg-red-500/10 text-red-600'
                      : 'border-border-muted/20 bg-card text-text-muted'
                  : isSelected
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border-muted/20 bg-card text-text hover:border-primary/20'
              }`}
            >
              <span className="mr-2 font-black text-primary/70">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleCheck}
        disabled={!selected || isValidated}
        className="btn-primary w-full sm:w-auto"
      >
        {isValidated ? (
          acceptedAnswers.some((answer) => answer === selected) ? (
            <>
              <Check className="h-4 w-4" />
              Correto
            </>
          ) : (
            <>
              <X className="h-4 w-4" />
              Incorreto
            </>
          )
        ) : (
          'Confirmar resposta'
        )}
      </button>
    </div>
  )
}