'use client'

import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { Check, Puzzle } from 'lucide-react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'

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

export default function MatchingGame({
  cards,
  onCorrect,
  onWrong,
  onFinish,
}: MatchingGameProps) {
  const gameCards = useMemo(() => shuffleArray(cards).slice(0, 15), [cards])
  const [selected, setSelected] = useState<MatchItem | null>(null)
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set())

  const items = useMemo(() => {
    const englishItems: MatchItem[] = gameCards.map((card) => ({
      id: card.id,
      text: card.english_phrase || card.en || '',
      type: 'en',
    }))
    const portugueseItems: MatchItem[] = gameCards.map((card) => ({
      id: card.id,
      text: card.portuguese_translation || card.pt || '',
      type: 'pt',
    }))

    return shuffleArray([...englishItems, ...portugueseItems])
  }, [gameCards])

  function triggerConfetti() {
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#0F766E', '#1D4ED8', '#EA580C', '#0F9F6E'],
    })
  }

  function handleSelect(item: MatchItem) {
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

      if (nextMatched.size === gameCards.length) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#0F766E', '#1D4ED8', '#EA580C', '#0F9F6E'],
          })
          onFinish()
        }, 1000)
      }
    } else {
      const nextError = new Set([selected.id, item.id])
      setErrorIds(nextError)
      onWrong()
      setTimeout(() => {
        setErrorIds(new Set())
        setSelected(null)
      }, 800)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="premium-card p-6 text-center sm:p-8">
        <div className="flex items-center justify-center gap-2">
          <Puzzle className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.3} />
          <p className="section-kicker">Match the pairs</p>
        </div>
          <h2 className="mt-5 text-4xl font-semibold text-[var(--color-text)] sm:text-5xl">
          Combine inglês e português
          </h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-text-muted)]">
          Encontre os pares corretos e limpe o tabuleiro sem perder o ritmo.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-[var(--color-border)] bg-white/72 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
          {matchedIds.size} de {gameCards.length} pares encontrados
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => {
          const isMatched = matchedIds.has(item.id)
          const isSelected = selected?.id === item.id && selected?.type === item.type
          const isError = errorIds.has(item.id)

          let statusStyle =
            'border-[var(--color-border)] bg-white/76 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-white'

          if (isMatched) {
            statusStyle = 'border-emerald-200 bg-emerald-50 text-emerald-700 opacity-60'
          } else if (isError) {
            statusStyle = 'border-red-300 bg-red-50 text-red-700 animate-shake'
          } else if (isSelected) {
            statusStyle =
              'border-[var(--color-primary)] bg-[linear-gradient(135deg,rgba(216,244,239,0.96),rgba(219,232,255,0.8))] text-[var(--color-text)] shadow-[0_24px_40px_-32px_rgba(15,118,110,0.6)]'
          }

          return (
            <button
              key={`${item.id}-${item.type}`}
              type="button"
              onClick={() => handleSelect(item)}
              disabled={isMatched}
              data-testid="matching-item"
              className={`relative flex min-h-[120px] items-center justify-center rounded-[26px] border p-4 text-center transition-all duration-300 ${statusStyle}`}
            >
              <span className="text-sm font-semibold leading-tight sm:text-base">{item.text}</span>

              <span className="absolute left-3 top-3 rounded-full bg-white/82 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                {item.type === 'en' ? 'EN' : 'PT'}
              </span>

              {isMatched && (
                <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
