'use client'

import { useMemo, useState } from 'react'
import { Check, Puzzle } from 'lucide-react'
import { shuffleArrayDeterministic } from '@/lib/utils'
import type { Card } from '@/types/database.types'
import AudioButton from '@/components/ui/AudioButton'

export type MatchingWrongAttempt = {
  english: string
  portuguese: string
}

interface MatchingGameProps {
  cards: Card[]
  onCorrect: () => void
  onWrong: (attempt?: MatchingWrongAttempt) => void
  onFinish: () => void
  layout?: 'default' | 'compact'
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
  layout = 'default',
}: MatchingGameProps) {
  const isCompact = layout === 'compact'
  const gameCards = useMemo(
    () => shuffleArrayDeterministic(cards, cards.map((card) => card.id).join('|')).slice(0, 15),
    [cards]
  )
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

    return shuffleArrayDeterministic(
      [...englishItems, ...portugueseItems],
      `${gameCards.map((card) => card.id).join('|')}:items`
    )
  }, [gameCards])

  async function triggerConfetti() {
    const { default: confetti } = await import('canvas-confetti')
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
        setTimeout(async () => {
          const { default: confetti } = await import('canvas-confetti')
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
      const english =
        selected.type === 'en'
          ? selected.text
          : item.type === 'en'
            ? item.text
            : ''
      const portuguese =
        selected.type === 'pt'
          ? selected.text
          : item.type === 'pt'
            ? item.text
            : ''
      onWrong(
        english && portuguese
          ? { english, portuguese }
          : undefined
      )
      setTimeout(() => {
        setErrorIds(new Set())
        setSelected(null)
      }, 800)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className={`${isCompact ? 'home-frosted-subtle rounded-container border border-brand-dark p-4 sm:p-5' : 'game-glass-card p-6 sm:p-8'} text-center`}>
        <div className="flex items-center justify-center gap-2">
          <Puzzle className="h-5 w-5 text-primary" strokeWidth={2.3} />
          <p className="section-kicker">Combine os pares</p>
        </div>
        <h2 className={`mt-4 font-semibold text-text ${isCompact ? 'text-2xl sm:text-3xl' : 'mt-5 text-3xl sm:text-5xl'}`}>
          Combine inglês e português
        </h2>
        <p className={`leading-relaxed text-text-muted ${isCompact ? 'mt-3 text-sm' : 'mt-4 text-base'}`}>
          Encontre os pares corretos e limpe o tabuleiro sem perder o ritmo.
        </p>
        <div className="mt-4 inline-flex rounded-full border home-frosted-subtle border-brand-dark/15 px-4 py-2 text-sm font-semibold text-text-muted">
          {matchedIds.size} de {gameCards.length} pares encontrados
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const isMatched = matchedIds.has(item.id)
          const isSelected = selected?.id === item.id && selected?.type === item.type
          const isError = errorIds.has(item.id)
          const isHighlighted = isSelected || isMatched

          let statusStyle =
            'home-frosted-subtle border-brand-dark/15 text-brand-dark hover:border-brand-dark hover:shadow-[3px_3px_0_var(--color-brand-accent)]'

          if (isMatched) {
            statusStyle = 'border-[rgba(70,98,89,0.16)] bg-primary text-on-primary opacity-80'
          } else if (isError) {
            statusStyle = 'border-[rgba(186,26,26,0.16)] bg-[rgba(186,26,26,0.08)] text-[var(--color-error)] animate-shake'
          } else if (isSelected) {
            statusStyle = 'border-[rgba(70,98,89,0.14)] bg-primary text-on-primary'
          }

          const badgeStyle = isHighlighted
            ? 'bg-on-primary/16 text-on-primary'
            : 'bg-[#fdfdf8]/90 text-text-subtle'

          return (
            <div
              key={`${item.id}-${item.type}`}
              role="button"
              tabIndex={isMatched ? -1 : 0}
              aria-disabled={isMatched}
              onClick={() => handleSelect(item)}
              onKeyDown={(event) => {
                if (isMatched) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleSelect(item)
                }
              }}
              data-testid="matching-item"
              className={`touch-manipulation flex min-h-[7.5rem] cursor-pointer flex-col rounded-[1.1rem] border p-3 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:min-h-[8.25rem] sm:p-3.5 ${
                isMatched ? 'pointer-events-none' : ''
              } ${statusStyle}`}
            >
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] sm:text-2xs ${badgeStyle}`}
                >
                  {item.type === 'en' ? 'EN' : 'PT'}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  {isMatched && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-on-primary/16 text-on-primary">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  {item.type === 'en' && item.audio_url && !isMatched && (
                    <AudioButton url={item.audio_url} variant="tile" />
                  )}
                </div>
              </div>

              <p className="flex-1 break-words text-sm font-semibold leading-snug sm:text-[0.95rem]">
                {item.text}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
