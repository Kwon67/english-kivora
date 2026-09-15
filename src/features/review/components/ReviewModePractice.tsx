'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye } from 'lucide-react'
import { m } from 'motion/react'
import MultipleChoice from '@/features/game/components/MultipleChoice'
import TypingMode, { type TypingDirection } from '@/features/game/components/TypingMode'
import SpeakingMode from '@/features/game/components/SpeakingMode'
import ListeningMode from '@/features/game/components/ListeningMode'
import MatchingGame from '@/features/game/components/MatchingGame'
import AudioButton from '@/components/ui/AudioButton'
import { getReviewModeLabel } from '@/features/review/lib/reviewModes'
import { worstPracticeOutcome, type PracticeOutcome } from '@/features/review/lib/practiceOutcome'
import {
  SPEECH_FALLBACK_NOTICE,
  hasSpeechRecognitionSupport,
  resolvePlayableMode,
} from '@/features/game/lib/speechSupport'
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
  /** Produção (PT → EN) para card maduro, compreensão (EN → PT) enquanto aprende. Vale para a digitação e para o flashcard. */
  typingDirection?: TypingDirection
  /**
   * Leva o veredito da prática para a tela de nota. Antes era `() => void`: acerto e erro
   * chamavam o mesmo avanço, e quem errou a digitação podia se dar "Fácil" em seguida.
   *
   * `playedMode` é o modo que DE FATO rodou (fala vira escuta sem microfone) — é ele que vira
   * evidência de habilidade no nível, não o que foi sorteado.
   */
  onComplete: (outcome: PracticeOutcome, playedMode: GameMode) => void
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

/**
 * O cartão que vira antes da nota.
 *
 * `pt-to-en` (card maduro): frente em português, "Como se diz em inglês?", e o inglês — com o
 * áudio — só aparece na resposta. Antes a frente era sempre o inglês, ou seja, reconhecimento: ler
 * a frase e dizer "lembrei" é muito mais fácil do que produzi-la. `en-to-pt` (aprendendo): frente
 * em inglês com áudio, como antes.
 *
 * O áudio deixou de depender de `audio_url`: 82% dos cards usam a síntese de fallback, e o guard
 * antigo escondia o botão exatamente neles.
 */
function ReviewFlashcardPractice({
  card,
  direction,
  onComplete,
}: {
  card: Card & { audio_url?: string | null }
  direction: TypingDirection
  onComplete: () => void
}) {
  const [showAnswer, setShowAnswer] = useState(false)
  const recallsEnglish = direction === 'pt-to-en'

  return (
    <div className="flex min-h-[14rem] flex-col sm:min-h-[18rem] md:min-h-[22rem]">
      <div className="flex items-start justify-between gap-3">
        <span className={reviewPill}>Flashcard</span>
        {!recallsEnglish ? (
          <AudioButton url={card.audio_url} fallbackText={card.english_phrase} autoPlay className="!mt-0 shrink-0" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-center py-4 text-center sm:py-6 md:py-8">
        <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary opacity-80">
          {recallsEnglish ? 'Como se diz em inglês?' : 'Frase do pack'}
        </p>
        <h2 className={`${reviewPhraseTitle} mt-3`}>
          {recallsEnglish ? card.portuguese_translation : card.english_phrase}
        </h2>

        {showAnswer ? (
          <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${reviewMeaningCard} mt-5`}>
            <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary">
              {recallsEnglish ? 'Em inglês' : 'Significado'}
            </p>
            <p className="mt-1.5 font-body text-base font-semibold leading-relaxed text-brand-secondary sm:text-lg">
              {recallsEnglish ? card.english_phrase : card.portuguese_translation}
            </p>
            {recallsEnglish ? (
              <AudioButton url={card.audio_url} fallbackText={card.english_phrase} autoPlay variant="game" className="mx-auto mt-3" />
            ) : null}
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
  typingDirection = 'pt-to-en',
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

  // O veredito fica num ref porque os modos disparam `report` e `move` em chamadas separadas
  // (responder, depois avançar), e o pior resultado precisa sobreviver entre elas.
  const outcomeRef = useRef<PracticeOutcome | null>(null)
  const record = (outcome: PracticeOutcome) => {
    outcomeRef.current = worstPracticeOutcome(outcomeRef.current, outcome)
  }
  // Fala sem reconhecimento de voz vira escuta (speechSupport.ts) — a mesma frase, digitada em vez
  // de repetida — em lugar de um card sem saída ou de um erro que a pessoa não cometeu.
  const [speechAvailable, setSpeechAvailable] = useState(true)
  useEffect(() => {
    if (!hasSpeechRecognitionSupport()) setTimeout(() => setSpeechAvailable(false), 0)
  }, [])
  const playedMode = resolvePlayableMode(mode, speechAvailable)
  const isSpeechFallback = playedMode !== mode
  const advance = (fallback: PracticeOutcome = 'unscored') => onComplete(outcomeRef.current ?? fallback, playedMode)
  const shouldAdvance = (mode?: 'report' | 'move' | 'both') => mode === 'move' || mode === 'both'
  const cardEnglish = (card.english_phrase || card.en || '').trim().toLowerCase()
  const cardPortuguese = (card.portuguese_translation || card.pt || '').trim().toLowerCase()

  return (
    <div className="review-mode-practice space-y-4">
      {mode !== 'flashcard' ? (
        <div className="flex items-center justify-between gap-3">
          <span className={`${reviewPill} bg-brand-accent`}>{getReviewModeLabel(playedMode)}</span>
        </div>
      ) : null}
      {isSpeechFallback ? (
        <p className="font-body text-xs font-semibold text-brand-secondary">{SPEECH_FALLBACK_NOTICE}</p>
      ) : null}

      {mode === 'flashcard' ? (
        <ReviewFlashcardPractice card={card} direction={typingDirection} onComplete={() => advance('unscored')} />
      ) : null}

      {mode === 'multiple_choice' ? (
        <MultipleChoice
          key={`review-mc-${card.id}`}
          card={card}
          allCards={distractorPool}
          onCorrect={() => {
            record('correct')
            setTimeout(() => advance(), 700)
          }}
          onWrong={() => {
            record('wrong')
            setTimeout(() => advance(), 1100)
          }}
        />
      ) : null}

      {mode === 'typing' ? (
        <TypingMode
          key={`review-typing-${card.id}`}
          card={card}
          direction={typingDirection}
          onResult={(result) => record(result === 'exact' ? 'correct' : result === 'partial' ? 'partial' : 'wrong')}
          onCorrect={(_, advanceMode) => {
            if (shouldAdvance(advanceMode)) advance()
          }}
          onWrong={(_, advanceMode) => {
            if (shouldAdvance(advanceMode)) advance()
          }}
        />
      ) : null}

      {playedMode === 'speaking' ? (
        <SpeakingMode
          key={`review-speaking-${card.id}`}
          card={card}
          onSpeechUnavailable={() => setSpeechAvailable(false)}
          onCorrect={(_, advanceMode) => {
            record('correct')
            if (shouldAdvance(advanceMode)) advance()
          }}
          onWrong={(_, advanceMode) => {
            record('wrong')
            if (shouldAdvance(advanceMode)) advance()
          }}
        />
      ) : null}

      {playedMode === 'listening' ? (
        <ListeningMode
          key={`review-listening-${card.id}`}
          card={card}
          onCorrect={(_, advanceMode) => {
            record('correct')
            if (shouldAdvance(advanceMode)) advance()
          }}
          onWrong={(_, advanceMode) => {
            record('wrong')
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
          // A combinação mistura quatro cards; só um erro que envolva ESTA frase conta contra ela.
          onWrong={(attempt) => {
            if (!attempt) return
            const touchesThisCard =
              attempt.english.trim().toLowerCase() === cardEnglish ||
              attempt.portuguese.trim().toLowerCase() === cardPortuguese
            if (touchesThisCard) record('wrong')
          }}
          onFinish={() => advance('correct')}
        />
      ) : null}
    </div>
  )
}
