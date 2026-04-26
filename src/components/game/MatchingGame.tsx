'use client'

import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { Check, Puzzle } from 'lucide-react'
import { shuffleArray } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '../shared/AudioButton'

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
  audio_url?: string | null
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
      audio_url: card.audio_url,
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
      colors: ['#2B7A0B', '#1f5f08', '#163c06', '#2B7A0B'],
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
            colors: ['#2B7A0B', '#1f5f08', '#163c06', '#2B7A0B'],
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
        <h2 className="mt-5 text-3xl font-semibold text-[var(--color-text)] sm:text-5xl">
          Combine inglês e português
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-text-muted)]">
          Encontre os pares corretos e limpe o tabuleiro sem perder o ritmo.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-[rgba(193,200,196,0.28)] bg-[var(--color-surface-container-low)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
          {matchedIds.size} de {gameCards.length} pares encontrados
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => {
          const isMatched = matchedIds.has(item.id)
          const isSelected = selected?.id === item.id && selected?.type === item.type
          const isError = errorIds.has(item.id)

          let statusStyle =
            'border-[rgba(193,200,196,0.28)] bg-[var(--color-surface-container-lowest)] text-[var(--color-text)] hover:border-[rgba(114,121,117,0.35)] hover:bg-[var(--color-surface-container-low)] hover:shadow-sm'

          if (isMatched) {
            statusStyle = 'border-[rgba(70,98,89,0.16)] bg-[var(--color-primary)] text-[var(--color-on-primary)] opacity-75'
          } else if (isError) {
            statusStyle = 'border-[rgba(186,26,26,0.16)] bg-[rgba(186,26,26,0.08)] text-[var(--color-error)] animate-shake'
          } else if (isSelected) {
            statusStyle =
              'border-[rgba(70,98,89,0.14)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
          }

          return (
            <button
              key={`${item.id}-${item.type}`}
              type="button"
              onClick={() => handleSelect(item)}
              disabled={isMatched}
              data-testid="matching-item"
              className={`touch-manipulation relative flex min-h-[100px] items-center justify-center rounded-[1.1rem] border p-3 text-center transition-all duration-300 sm:min-h-[110px] sm:p-4 ${statusStyle}`}
            >
              <span className="break-words text-sm font-semibold leading-tight sm:text-base">{item.text}</span>

              <span className="absolute left-2 top-2 rounded-full bg-[#fdfdf8]/82 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)] sm:left-3 sm:top-3 sm:px-2 sm:py-1 sm:text-[10px]">
                {item.type === 'en' ? 'EN' : 'PT'}
              </span>

              {isMatched && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#fdfdf8] text-[var(--color-primary)] sm:right-3 sm:top-3 sm:h-7 sm:w-7">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}

              {item.type === 'en' && item.audio_url && !isMatched && (
                <div className="absolute right-1 bottom-1 sm:right-2 sm:bottom-2 z-10">
                  <AudioButton url={item.audio_url} className="scale-75" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
