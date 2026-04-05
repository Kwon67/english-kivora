'use client'

import { useState, useMemo } from 'react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import { Puzzle, Check } from 'lucide-react'
import confetti from 'canvas-confetti'

interface MatchingGameProps {
  cards: Card[]
  onCorrect: () => void
  onWrong: () => void
  onFinish: () => void
}

interface MatchItem {
  id: string
  text: string
  type: 'en' | 'pt'
}

export default function MatchingGame({ cards, onCorrect, onWrong, onFinish }: MatchingGameProps) {
  const gameCards = useMemo(() => shuffleArray(cards).slice(0, 15), [cards])

  const [selected, setSelected] = useState<MatchItem | null>(null)
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
  const [errorId, setErrorId] = useState<string | null>(null)

  const items = useMemo(() => {
    const enItems: MatchItem[] = gameCards.map(c => ({ id: c.id, text: c.english_phrase || c.en || '', type: 'en' }))
    const ptItems: MatchItem[] = gameCards.map(c => ({ id: c.id, text: c.portuguese_translation || c.pt || '', type: 'pt' }))
    return shuffleArray([...enItems, ...ptItems])
  }, [gameCards])

  function triggerConfetti() {
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#0D9488', '#3B82F6', '#F59E0B', '#10B981', '#EC4899']
    })
  }

  function handleSelect(item: MatchItem) {
    if (matchedIds.has(item.id) || errorId) return
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
      const newMatched = new Set(matchedIds)
      newMatched.add(item.id)
      setMatchedIds(newMatched)
      setSelected(null)
      triggerConfetti()
      onCorrect()

      if (newMatched.size === gameCards.length) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#0D9488', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6']
          })
          onFinish()
        }, 1000)
      }
    } else {
      setErrorId(item.id)
      onWrong()
      setTimeout(() => {
        setErrorId(null)
        setSelected(null)
      }, 800)
    }
  }

  return (
    <div className="w-full mx-auto px-1 sm:px-4 animate-fade-in">
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <Puzzle className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={2.5} />
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)]">Combine os Pares</h2>
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-xs font-medium">
          {matchedIds.size} / {gameCards.length} pares encontrados
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
        {items.map((item) => {
          const isMatched = matchedIds.has(item.id)
          const isSelected = selected?.id === item.id && selected?.type === item.type
          const isError = errorId === item.id && !isMatched && selected?.id === item.id

          let statusStyle = 'bg-white border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] cursor-pointer'
          if (isMatched) statusStyle = 'bg-emerald-50 border-emerald-100 text-emerald-500 cursor-default opacity-40 scale-95 shadow-none'
          else if (isError) statusStyle = 'bg-red-50 border-red-200 text-red-600 animate-shake'
          else if (isSelected) statusStyle = 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2 scale-105 z-10'

          return (
            <button
              key={`${item.id}-${item.type}`}
              type="button"
              onClick={() => handleSelect(item)}
              disabled={isMatched}
              className={`
                relative h-20 sm:h-28 rounded-2xl border-2 p-3 text-center transition-all duration-300 flex items-center justify-center shadow-sm select-none
                ${statusStyle}
              `}
            >
              <span className="text-sm sm:text-base font-bold leading-tight tracking-tight line-clamp-3">
                {item.text}
              </span>

              {isMatched && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
