'use client'

import { useState, useMemo } from 'react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import { Puzzle, Check } from 'lucide-react'

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
      onCorrect()

      if (newMatched.size === gameCards.length) {
        setTimeout(onFinish, 1000)
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
    <div className="w-full max-w-5xl mx-auto px-4 animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Puzzle className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={2} />
          <h2 className="text-xl font-bold text-[var(--color-text)]">Combine os Pares</h2>
        </div>
        <span className="badge bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
          {matchedIds.size} / {gameCards.length} encontrados
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {items.map((item, idx) => {
          const isMatched = matchedIds.has(item.id)
          const isSelected = selected?.text === item.text && selected?.type === item.type
          const isError = errorId && (isSelected || (errorId === item.id && !isMatched))

          let statusStyle = 'bg-white border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] cursor-pointer'
          if (isMatched) statusStyle = 'bg-emerald-50 border-emerald-200 text-emerald-400 cursor-default opacity-60 scale-95'
          else if (isError) statusStyle = 'bg-red-50 border-red-300 text-red-700 animate-shake scale-95'
          else if (isSelected) statusStyle = 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)] scale-[1.03] z-10 cursor-pointer'

          return (
            <button
              key={`${item.id}-${item.type}-${idx}`}
              onClick={() => handleSelect(item)}
              disabled={isMatched}
              className={`
                relative h-20 sm:h-24 rounded-xl border-2 p-2 sm:p-3 text-center transition-all duration-200 flex items-center justify-center touch-target
                ${statusStyle}
              `}
            >
              <span className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2">
                {item.text}
              </span>

              {isMatched && (
                <div className="absolute top-2 right-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
