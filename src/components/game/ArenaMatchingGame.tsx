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
      colors: ['#2B7A0B', '#1f5f08', '#163c06', '#2B7A0B'],
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
            colors: ['#2B7A0B', '#1f5f08', '#163c06', '#2B7A0B'],
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
          <Puzzle className="h-4 w-4 text-gray-400" strokeWidth={2.3} />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Matching</p>
        </div>
        <div className="mt-2 inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500">
          {matchedIds.size} de {totalPairs} pares
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const isMatched = matchedIds.has(item.id)
          const isSelected = selected?.id === item.id && selected?.type === item.type
          const isError = errorIds.has(item.id)

          let statusStyle =
            'border-gray-100 bg-white text-gray-900 hover:border-gray-300 hover:shadow-sm'

          if (isMatched) {
            statusStyle = 'border-gray-900 bg-gray-900 text-white opacity-60'
          } else if (isError) {
            statusStyle = 'border-gray-300 bg-gray-100 text-gray-600 animate-shake'
          } else if (isSelected) {
            statusStyle =
              'border-gray-900 bg-gray-900 text-white'
          }

          return (
            <button
              key={`${item.id}-${item.type}`}
              type="button"
              onClick={() => handleSelect(item)}
              disabled={isMatched}
              className={`touch-manipulation relative flex min-h-[70px] items-center justify-center rounded-xl border p-2 text-center text-xs font-semibold transition-all duration-200 ${statusStyle}`}
            >
              <span className="break-words leading-tight">{item.text}</span>

              <span className="absolute left-1.5 top-1.5 rounded-full bg-white/82 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                {item.type === 'en' ? 'EN' : 'PT'}
              </span>

              {isMatched && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-white">
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