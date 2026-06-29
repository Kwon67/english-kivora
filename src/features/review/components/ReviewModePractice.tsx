'use client'

import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { m } from 'framer-motion'
import MultipleChoice from '@/features/game/components/MultipleChoice'
import TypingMode from '@/features/game/components/TypingMode'
import SpeakingMode from '@/features/game/components/SpeakingMode'
import ListeningMode from '@/features/game/components/ListeningMode'
import MatchingGame from '@/features/game/components/MatchingGame'
import AudioButton from '@/components/ui/AudioButton'
import { getReviewModeLabel } from '@/features/review/lib/reviewModes'
import type { Card, GameMode } from '@/types/database.types'

type ReviewModePracticeProps = {
  mode: GameMode
  card: Card & { audio_url?: string | null }
  packCards: Card[]
  onComplete: () => void
}

function buildMatchingPool(card: Card, packCards: Card[]) {
  const unique = new Map<string, Card>()
  unique.set(card.id, card)
  for (const packCard of packCards) {
    unique.set(packCard.id, packCard)
    if (unique.size >= 4) break
  }

  const pool = [...unique.values()]
  if (pool.length >= 4) return pool

  while (pool.length < 4 && pool.length > 0) {
    pool.push(pool[pool.length % unique.size])
  }

  return pool
}

function ReviewFlashcardPractice({
  card,
  onComplete,
}: {
  card: Card & { audio_url?: string | null }
  onComplete: () => void
}) {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="flex min-h-[18rem] flex-col sm:min-h-[22rem]">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
          Flashcard
        </span>
        {card.audio_url ? (
          <AudioButton url={card.audio_url} autoPlay className="!mt-0 shrink-0" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-center py-6 text-center sm:py-8">
        <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary opacity-80">
          Frase do pack
        </p>
        <h2 className="mx-auto mt-3 max-w-[16ch] text-balance font-heading text-3xl font-bold leading-tight text-brand-dark sm:text-5xl">
          {card.english_phrase}
        </h2>

        {showAnswer ? (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-5 w-full max-w-xl rounded-xl border-2 border-brand-dark bg-bg-primary px-4 py-3 text-left shadow-[4px_4px_0_var(--color-brand-dark)] sm:px-6 sm:py-4"
          >
            <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary">
              Significado
            </p>
            <p className="mt-1.5 font-body text-base font-semibold leading-relaxed text-brand-secondary sm:text-lg">
              {card.portuguese_translation}
            </p>
          </m.div>
        ) : (
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowAnswer(true)}
            className="mx-auto mt-6 inline-flex items-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-5 py-3 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] hover:brightness-105"
          >
            <Eye className="h-4 w-4" strokeWidth={2} />
            Mostrar resposta
          </m.button>
        )}
      </div>

      {showAnswer ? (
        <button type="button" onClick={onComplete} className="mt-2 inline-flex w-full items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-dark px-5 py-3 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)]">
          Continuar
        </button>
      ) : null}
    </div>
  )
}

export default function ReviewModePractice({
  mode,
  card,
  packCards,
  onComplete,
}: ReviewModePracticeProps) {
  const matchingPool = useMemo(() => buildMatchingPool(card, packCards), [card, packCards])
  const distractorPool = useMemo(() => {
    const pool = [...packCards]
    if (!pool.some((packCard) => packCard.id === card.id)) {
      pool.unshift(card)
    }
    return pool
  }, [card, packCards])

  const advance = () => onComplete()
  const shouldAdvance = (mode?: 'report' | 'move' | 'both') => mode === 'move' || mode === 'both'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
          {getReviewModeLabel(mode)}
        </span>
      </div>

      {mode === 'flashcard' ? (
        <ReviewFlashcardPractice card={card} onComplete={advance} />
      ) : null}

      {mode === 'multiple_choice' ? (
        <MultipleChoice
          key={`review-mc-${card.id}`}
          card={card}
          allCards={distractorPool}
          onCorrect={() => setTimeout(advance, 700)}
          onWrong={() => setTimeout(advance, 1100)}
        />
      ) : null}

      {mode === 'typing' ? (
        <TypingMode
          key={`review-typing-${card.id}`}
          card={card}
          onCorrect={(_, advanceMode) => {
            if (shouldAdvance(advanceMode)) advance()
          }}
          onWrong={(_, advanceMode) => {
            if (shouldAdvance(advanceMode)) advance()
          }}
        />
      ) : null}

      {mode === 'speaking' ? (
        <SpeakingMode
          key={`review-speaking-${card.id}`}
          card={card}
          onCorrect={(_, advanceMode) => {
            if (shouldAdvance(advanceMode)) advance()
          }}
          onWrong={(_, advanceMode) => {
            if (shouldAdvance(advanceMode)) advance()
          }}
        />
      ) : null}

      {mode === 'listening' ? (
        <ListeningMode
          key={`review-listening-${card.id}`}
          card={card}
          onCorrect={(_, advanceMode) => {
            if (shouldAdvance(advanceMode)) advance()
          }}
          onWrong={(_, advanceMode) => {
            if (shouldAdvance(advanceMode)) advance()
          }}
        />
      ) : null}

      {mode === 'matching' ? (
        <MatchingGame
          key={`review-matching-${card.id}`}
          cards={matchingPool}
          layout="compact"
          onCorrect={() => undefined}
          onWrong={() => undefined}
          onFinish={advance}
        />
      ) : null}
    </div>
  )
}
