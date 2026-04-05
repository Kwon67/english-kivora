'use client'

import { useGameStore } from '@/store/gameStore'
import { submitGameResult } from '@/app/actions'
import MultipleChoice from './MultipleChoice'
import Flashcard from './Flashcard'
import TypingMode from './TypingMode'
import MatchingGame from './MatchingGame'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Layers, Keyboard, Puzzle, X, Flame, Trophy, BookOpen, TrendingUp, ArrowRight, Loader2, SkipForward } from 'lucide-react'

const gameModeConfig: Record<string, { label: string; icon: typeof Target }> = {
  multiple_choice: { label: 'Múltipla Escolha', icon: Target },
  flashcard: { label: 'Flashcard', icon: Layers },
  typing: { label: 'Digitação', icon: Keyboard },
  matching: { label: 'Combinação', icon: Puzzle },
}

export default function GameWrapper() {
  const {
    phase,
    cards,
    gameMode,
    packName,
    assignmentId,
    correct,
    wrong,
    currentStreak,
    maxStreak,
    currentIndex,
    startGame,
    answerCorrect,
    answerWrong,
    nextCard,
    finishGame,
  } = useGameStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const currentCard = cards[currentIndex]
  const total = correct + wrong
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0

  async function handleFinish() {
    setSaving(true)
    try {
      await submitGameResult({
        packId: currentCard?.pack_id || cards[0]?.pack_id || '',
        assignmentId: assignmentId || '',
        correct,
        wrong,
        streakMax: maxStreak,
      })
    } catch (err) {
      console.error('Erro ao salvar resultado:', err)
    }
    setSaving(false)
    router.push('/home')
    router.refresh()
  }

  const modeConfig = gameModeConfig[gameMode] || gameModeConfig.multiple_choice
  const ModeIcon = modeConfig.icon

  // ===== INTRO PHASE =====
  if (phase === 'intro') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card w-full max-w-md p-10 text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
              <ModeIcon className="w-10 h-10" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="font-bold tracking-tight text-2xl text-[var(--color-text)] mb-1.5">
            {packName}
          </h1>
          <div className="badge bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)] mb-6">
            {modeConfig.label}
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">
            {cards.length} card{cards.length > 1 ? 's' : ''} nesta lição
          </p>
          <button
            onClick={startGame}
            className="btn-primary w-full py-4 text-base cursor-pointer"
          >
            Começar Treinamento
            <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </button>
        </motion.div>
      </div>
    )
  }

  // ===== RESULT PHASE =====
  if (phase === 'result') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card w-full max-w-md p-10 text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
              accuracy >= 80
                ? 'bg-amber-50 text-amber-600'
                : accuracy >= 60
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-slate-100 text-slate-500'
            }`}>
              {accuracy >= 80 ? (
                <Trophy className="w-10 h-10" strokeWidth={1.5} />
              ) : accuracy >= 60 ? (
                <TrendingUp className="w-10 h-10" strokeWidth={1.5} />
              ) : (
                <BookOpen className="w-10 h-10" strokeWidth={1.5} />
              )}
            </div>
          </div>
          <h1 className="font-bold tracking-tight text-2xl text-[var(--color-text)] mb-1.5">
            Lição Finalizada
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">
            {accuracy >= 80
              ? 'Excelente resultado! Continue assim.'
              : accuracy >= 60
                ? 'Bom trabalho, continue praticando.'
                : 'Revise mais um pouco para melhorar.'}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="text-2xl font-bold text-emerald-700">{correct}</div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">Acertos</div>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="text-2xl font-bold text-red-700">{wrong}</div>
              <div className="text-xs text-red-600 font-medium mt-0.5">Erros</div>
            </div>
            <div className="rounded-xl bg-[var(--color-primary-light)] border border-teal-200 p-4">
              <div className="text-2xl font-bold text-[var(--color-primary)]">{accuracy}%</div>
              <div className="text-xs text-teal-600 font-medium mt-0.5">Precisão</div>
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={saving}
            className="btn-primary w-full py-4 text-base cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              'Voltar ao Início'
            )}
          </button>
        </motion.div>
      </div>
    )
  }

  // ===== PLAYING PHASE =====
  return (
    <div className="mx-auto w-full px-4 py-8 min-h-screen flex flex-col bg-[var(--color-bg)]">

      {/* Header Row */}
      <div className="card flex items-center justify-between w-full max-w-4xl mx-auto mb-10 gap-4 p-4">

        {/* Close Button */}
        <button
          onClick={handleFinish}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          title="Sair da Lição"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-1.5 font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl text-sm shrink-0">
          <Flame className="w-4 h-4" strokeWidth={2.5} />
          <span className="tabular-nums">{currentStreak}</span>
        </div>
      </div>

      <div className="flex flex-col w-full items-center">
        {/* Game mode renderer */}
        {currentCard && gameMode === 'multiple_choice' && (
          <MultipleChoice
            key={currentCard.id}
            card={currentCard}
            allCards={cards}
            onCorrect={() => {
              answerCorrect()
              setTimeout(nextCard, 800)
            }}
            onWrong={() => {
              answerWrong()
              setTimeout(nextCard, 1200)
            }}
          />
        )}

        {currentCard && gameMode === 'flashcard' && (
          <Flashcard
            key={currentCard.id}
            card={currentCard}
            onCorrect={() => {
              answerCorrect()
              nextCard()
            }}
            onWrong={() => {
              answerWrong()
              nextCard()
            }}
          />
        )}

        {currentCard && gameMode === 'typing' && (
          <TypingMode
            key={currentCard.id}
            card={currentCard}
            onCorrect={() => {
              answerCorrect()
              setTimeout(nextCard, 1000)
            }}
            onWrong={() => {
              answerWrong()
              setTimeout(nextCard, 1500)
            }}
          />
        )}

        {gameMode === 'matching' && (
          <MatchingGame
            cards={cards}
            onCorrect={answerCorrect}
            onWrong={answerWrong}
            onFinish={finishGame}
          />
        )}

        {gameMode !== 'matching' && (
          <div className="mt-12">
            <button
              onClick={() => {
                answerWrong()
                nextCard()
              }}
              className="btn-ghost text-sm cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              Pular
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
