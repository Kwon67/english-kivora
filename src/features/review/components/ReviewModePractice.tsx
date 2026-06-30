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
import {
  reviewMeaningCard,
  reviewPhraseTitle,
  reviewPill,
  reviewPrimaryBtn,
} from '@/features/review/lib/reviewPageUi'
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
    <div className="flex min-h-[14rem] flex-col sm:min-h-[18rem] md:min-h-[22rem]">
      <div className="flex items-start justify-between gap-3">
        <span className={reviewPill}>Flashcard</span>
        {card.audio_url ? (
          <AudioButton url={card.audio_url} autoPlay className="!mt-0 shrink-0" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-center py-4 text-center sm:py-6 md:py-8">
        <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary opacity-80">
          Frase do pack
        </p>
        <h2 className={`${reviewPhraseTitle} mt-3`}>
          {card.english_phrase}
        </h2>

        {showAnswer ? (
          <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${reviewMeaningCard} mt-5`}>
            <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary">
              Significado
            </p>
            <p className="mt-1.5 font-body text-base font-semibold leading-relaxed text-brand-secondary sm:text-lg">
              {card.portuguese_translation}
            </p>
          </m.div>
        ) : null}
      </div>

      {!showAnswer ? (
        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => setShowAnswer(true)}
          className={`${reviewPrimaryBtn} mx-auto mt-4 w-full sm:mt-6 sm:w-auto`}
        >
          <Eye className="h-4 w-4" strokeWidth={2} />
          Mostrar resposta
        </m.button>
      ) : (
        <button type="button" onClick={onComplete} className={`${reviewPrimaryBtn} mt-2 w-full`}>
          Continuar
        </button>
      )}
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
        <span className={`${reviewPill} bg-brand-accent`}>{getReviewModeLabel(mode)}</span>
      </div>

      {mode === 'flashcard' ? <ReviewFlashcardPractice card={card} onComplete={advance} /> : null}

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