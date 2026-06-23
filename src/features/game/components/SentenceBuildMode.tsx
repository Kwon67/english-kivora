'use client'

import { useCallback, useMemo, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import type { Card } from '@/types/database.types'
import { feedback } from '@/lib/feedback'

const CONNECTOR_HINTS = ['however', 'although', 'whereas', 'therefore', 'moreover', 'nevertheless']

interface SentenceBuildModeProps {
  card: Card
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
}

function normalizeSentence(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function tokenizeSentence(value: string) {
  return value
    .replace(/[.!?]+$/g, '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function shuffleTokens(tokens: string[]) {
  const copy = [...tokens]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

export default function SentenceBuildMode({ card, onCorrect, onWrong }: SentenceBuildModeProps) {
  const targetSentence = card.english_phrase || card.en || ''
  const prompt = card.portuguese_translation || card.pt || 'Monte a frase em inglês.'
  const targetTokens = useMemo(() => tokenizeSentence(targetSentence), [targetSentence])
  const [pool, setPool] = useState(() => shuffleTokens(targetTokens))
  const [built, setBuilt] = useState<string[]>([])
  const [isValidated, setIsValidated] = useState(false)
  const [startTime] = useState(() => Date.now())

  const connectorHints = useMemo(
    () => CONNECTOR_HINTS.filter((hint) => targetSentence.toLowerCase().includes(hint)),
    [targetSentence]
  )

  const addToken = useCallback(
    (token: string, index: number) => {
      if (isValidated) return
      setBuilt((current) => [...current, token])
      setPool((current) => current.filter((_, tokenIndex) => tokenIndex !== index))
    },
    [isValidated]
  )

  const removeToken = useCallback(
    (index: number) => {
      if (isValidated) return
      setBuilt((current) => {
        const next = [...current]
        const [token] = next.splice(index, 1)
        setPool((poolTokens) => [...poolTokens, token])
        return next
      })
    },
    [isValidated]
  )

  const reset = useCallback(() => {
    setBuilt([])
    setPool(shuffleTokens(targetTokens))
    setIsValidated(false)
  }, [targetTokens])

  const handleCheck = useCallback(() => {
    if (isValidated || built.length !== targetTokens.length) return

    setIsValidated(true)
    const latencyMs = Date.now() - startTime
    const isCorrect = normalizeSentence(built.join(' ')) === normalizeSentence(targetSentence)

    if (isCorrect) {
      feedback.success()
      onCorrect(latencyMs)
    } else {
      feedback.error()
      onWrong(latencyMs)
    }
  }, [built, isValidated, onCorrect, onWrong, startTime, targetSentence, targetTokens.length])

  return (
    <div className="space-y-5">
      <p className="section-kicker">Escrita guiada</p>
      <p className="text-sm font-semibold text-text-muted">{prompt}</p>

      {connectorHints.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {connectorHints.map((hint) => (
            <span
              key={hint}
              className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary"
            >
              {hint}
            </span>
          ))}
        </div>
      ) : null}

      <div className="min-h-14 rounded-[1rem] border border-dashed border-border-muted/25 bg-card px-3 py-3">
        <div className="flex flex-wrap gap-2">
          {built.length === 0 ? (
            <span className="text-sm text-text-subtle">Toque nos blocos para montar a frase.</span>
          ) : (
            built.map((token, index) => (
              <button
                key={`${token}-${index}`}
                type="button"
                onClick={() => removeToken(index)}
                disabled={isValidated}
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary"
              >
                {token}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {pool.map((token, index) => (
          <button
            key={`${token}-${index}`}
            type="button"
            onClick={() => addToken(token, index)}
            disabled={isValidated}
            className="rounded-full border border-border-muted/20 bg-surface-container-low px-3 py-1.5 text-sm font-semibold text-text transition-colors hover:border-primary/20 hover:text-primary"
          >
            {token}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={built.length !== targetTokens.length || isValidated}
          className="btn-primary"
        >
          {isValidated ? (
            normalizeSentence(built.join(' ')) === normalizeSentence(targetSentence) ? (
              <>
                <Check className="h-4 w-4" />
                Frase correta
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                Tente novamente na próxima
              </>
            )
          ) : (
            'Verificar frase'
          )}
        </button>
        <button type="button" onClick={reset} disabled={isValidated} className="btn-ghost">
          <RotateCcw className="h-4 w-4" />
          Recomeçar
        </button>
      </div>
    </div>
  )
}