'use client'

import { useMemo, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { Check, Puzzle } from 'lucide-react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'

interface ArenaMatchingGameProps {
  cards: Card[]
  onCorrect: () => void
  onWrong: () => void
  onFinish: () => void
}

interface MatchItem {
  id: string
  text: string
  type: 'en' | 'pt'
  audio_url?: string | null
}

export default function ArenaMatchingGame({
  cards,
  onCorrect,
  onWrong,
  onFinish,
}: ArenaMatchingGameProps) {
  const gameCards = useMemo(() => shuffleArray(cards).slice(0, 10), [cards])
  const [selected, setSelected] = useState<MatchItem | null>(null)
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set())

  const items = useMemo(() => {
    const englishItems: MatchItem[] = gameCards.map((card) => ({
      id: card.id,
      text: card.english_phrase || card.en || '',
      type: 'en',
      audio_url: card.audio_url,
    }))
    const portugueseItems: MatchItem[] = gameCards.map((card) => ({
      id: card.id,
      text: card.portuguese_translation || card.pt || '',
      type: 'pt',
    }))

    return shuffleArray([...englishItems, ...portugueseItems])
  }, [gameCards])

  const totalPairs = gameCards.length

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#466259', '#5e7a71', '#735802', '#cae9de'],
    })
  }, [])

  const handleSelect = useCallback((item: MatchItem) => {
    if (matchedIds.has(item.id) || errorIds.size > 0) return

    if (selected && selected.type === item.type && selected.id === item.id) {
      setSelected(null)
      return
    }

    if (!selected) {
      setSelected(item)
      return
    }

    if (selected.type === item.type) {
      setSelected(item)
      return
    }

    if (selected.id === item.id) {
      const nextMatched = new Set(matchedIds)
      nextMatched.add(item.id)
      setMatchedIds(nextMatched)
      setSelected(null)
      triggerConfetti()
      onCorrect()

      if (nextMatched.size === totalPairs) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#466259', '#5e7a71', '#735802', '#cae9de'],
          })
          onFinish()
        }, 500)
      }
    } else {
      const nextError = new Set([selected.id, item.id])
      setErrorIds(nextError)
      onWrong()
      setTimeout(() => {
        setErrorIds(new Set())
        setSelected(null)
      }, 600)
    }
  }, [matchedIds, errorIds, selected, onCorrect, onWrong, onFinish, totalPairs, triggerConfetti])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Puzzle className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.3} />
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">Matching</p>
        </div>
        <div className="mt-2 inline-flex rounded-full border border-[rgba(193,200,196,0.3)] bg-[var(--color-surface-container-low)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
          {matchedIds.size} de {totalPairs} pares
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const isMatched = matchedIds.has(item.id)
          const isSelected = selected?.id === item.id && selected?.type === item.type
          const isError = errorIds.has(item.id)

          let statusStyle =
            'border-[rgba(193,200,196,0.28)] bg-[var(--color-surface-container-lowest)] text-[var(--color-text)] hover:border-[rgba(114,121,117,0.35)] hover:bg-[var(--color-surface-container-low)] hover:shadow-sm'

          if (isMatched) {
            statusStyle = 'border-[rgba(70,98,89,0.16)] bg-[var(--color-primary)] text-white opacity-75'
          } else if (isError) {
            statusStyle = 'border-[rgba(186,26,26,0.16)] bg-[rgba(186,26,26,0.08)] text-[var(--color-error)] animate-shake'
          } else if (isSelected) {
            statusStyle =
              'border-[rgba(70,98,89,0.14)] bg-[var(--color-primary)] text-white'
          }

          return (
            <button
              key={`${item.id}-${item.type}`}
              type="button"
              onClick={() => handleSelect(item)}
              disabled={isMatched}
              className={`touch-manipulation relative flex min-h-[70px] items-center justify-center rounded-[1.05rem] border p-2 text-center text-xs font-semibold transition-all duration-200 ${statusStyle}`}
            >
              <span className="break-words leading-tight">{item.text}</span>

              <span className="absolute left-1.5 top-1.5 rounded-full bg-white/82 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                {item.type === 'en' ? 'EN' : 'PT'}
              </span>

              {isMatched && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[var(--color-primary)]">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}

              {item.type === 'en' && item.audio_url && !isMatched && (
                <div className="absolute right-1 bottom-1 z-10">
                  <AudioButton url={item.audio_url} className="scale-70" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
