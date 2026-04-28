'use client'

import { useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Check, X } from 'lucide-react'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'
import { feedback } from '@/lib/feedback'

const CONFETTI_COLORS = ['#466259', '#5e7a71', '#735802', '#cae9de'] as const

interface ListeningModeProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
}

/**
 * Strip everything except a-z and 0-9 from a single word.
 * Handles curly/smart apostrophes, accents, and any Unicode punctuation.
 */
function cleanWord(word: string) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

/**
 * Normalize a full phrase for comparison.
 * Strips accents, removes ALL non-alphanumeric characters except spaces,
 * collapses whitespace, and lowercases.
 *
 * Examples:
 *   "I\u2019m not ready yet, give me five more minutes." -> "im not ready yet give me five more minutes"
 *   "I'm not ready yet, give me five more minutes."  -> "im not ready yet give me five more minutes"
 */
function normalizePhrase(phrase: string) {
  return phrase
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
}

export default function ListeningMode({ card, onCorrect, onWrong }: ListeningModeProps) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isExactAnswer, setIsExactAnswer] = useState(false)
  const [diffResult, setDiffResult] = useState<{ word: string; isCorrect: boolean }[]>([])
  const [startTime] = useState(() => Date.now())

  const englishPhrase = card.english_phrase || card.en || ''
  
  // Use audio_url if available, otherwise fallback to the preview endpoint
  const audioUrl = card.audio_url || `/api/tts/preview?text=${encodeURIComponent(englishPhrase)}`

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: [...CONFETTI_COLORS],
    })
  }, [])

  const handleSubmit = useCallback((event?: React.FormEvent) => {
    event?.preventDefault()
    if (submitted || !input.trim()) return

    // Normalize both sides for word-by-word diff display
    const normalizedInput = normalizePhrase(input)
    const normalizedCorrect = normalizePhrase(englishPhrase)

    const correctWords = normalizedCorrect.split(/\s+/)
    
    // Word-by-word comparison using the original input words for display
    const inputDisplayWords = input.trim().split(/\s+/)
    const result = inputDisplayWords.map((word, i) => {
      const isCorrect = correctWords[i] ? cleanWord(word) === correctWords[i] : false
      return { word, isCorrect }
    })

    const exact = normalizedInput === normalizedCorrect

    setIsExactAnswer(exact)
    setDiffResult(result)
    setSubmitted(true)

    if (exact) {
      triggerConfetti()
      feedback.success()
    } else {
      feedback.error()
    }
  }, [submitted, input, englishPhrase, triggerConfetti])

  const handleNext = useCallback(() => {
    if (!submitted) return
    const latencyMs = Date.now() - startTime

    if (isExactAnswer) {
      onCorrect(latencyMs)
    } else {
      onWrong(latencyMs)
    }
  }, [submitted, isExactAnswer, onCorrect, onWrong, startTime])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && submitted) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitted, handleNext])

  return (
    <div className="premium-card mx-auto w-full max-w-[760px] p-6 sm:p-8 lg:p-10">
      <div className="text-center">
        <p className="section-kicker">Ouça e digite</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <AudioButton url={audioUrl} autoPlay={true} variant="game" />
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            Aperte para ouvir novamente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(event) => {
              if (submitted) return
              setInput(event.target.value)
            }}
            placeholder="Digite o que você ouviu em inglês..."
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            inputMode="text"
            data-testid="listening-input"
            className={`touch-manipulation w-full rounded-[1.4rem] border px-5 py-5 text-base font-semibold text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-subtle)] ${
              submitted
                ? isExactAnswer
                  ? 'border-[rgba(70,98,89,0.16)] bg-[rgba(70,98,89,0.08)] hidden'
                  : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.07)] hidden'
                : 'border-[rgba(193,200,196,0.28)] bg-[var(--color-surface-container-low)] focus:border-[rgba(70,98,89,0.18)] focus:bg-[var(--color-surface-container-lowest)] focus:shadow-[0_0_0_4px_rgba(202,233,222,0.2)]'
            }`}
          />
          
          {/* Se foi submetido, mostramos a frase renderizada com as cores */}
          {submitted && (
             <div className={`w-full rounded-[1.4rem] border px-5 py-5 text-base font-semibold text-[var(--color-text)] ${
               isExactAnswer 
                ? 'border-[rgba(70,98,89,0.16)] bg-[rgba(70,98,89,0.08)]' 
                : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.07)]'
             }`}>
                {diffResult.map((res, idx) => (
                  <span key={idx} className={res.isCorrect ? 'text-[var(--color-text)]' : 'text-red-500 line-through'}>
                    {res.word}{' '}
                  </span>
                ))}
             </div>
          )}

          {submitted && (
            <div
              className={`absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full ${
                isExactAnswer
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'bg-[var(--color-error)] text-[var(--color-on-primary)]'
              }`}
            >
              {isExactAnswer ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                <X className="h-4 w-4" strokeWidth={3} />
              )}
            </div>
          )}
        </div>

        {!submitted && (
          <button
            type="submit"
            disabled={!input.trim()}
            data-testid="listening-submit"
            className="btn-primary touch-manipulation mt-4 w-full py-4"
          >
            Confirmar resposta
          </button>
        )}
      </form>

      {submitted && (
        <div
          className={`mt-5 animate-fade-in rounded-xl border p-5 ${
            isExactAnswer
              ? 'border-[rgba(70,98,89,0.16)] bg-[var(--color-surface-container-low)]'
              : 'border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.05)]'
          }`}
        >
          {!isExactAnswer ? (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Frase correta
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-error)]">
                &quot;{englishPhrase}&quot;
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Tradução: {card.portuguese_translation || card.pt}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                Excelente
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--color-primary)]">
                Você ouviu perfeitamente!
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Tradução: {card.portuguese_translation || card.pt}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="mt-5 w-full py-3 btn-primary"
          >
            Ir para a próxima
          </button>
        </div>
      )}
    </div>
  )
}
