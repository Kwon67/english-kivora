'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { submitGameResult } from '@/app/actions'
import MultipleChoice from './MultipleChoice'
import Flashcard from './Flashcard'
import TypingMode from './TypingMode'
import MatchingGame from './MatchingGame'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Layers, Keyboard, Puzzle, X, Flame, Trophy, BookOpen, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'

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
    startGame,
    answerCorrect,
    answerWrong,
    finishGame,
    resetGame,
  } = useGameStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const [q, setQ] = useState(cards)
  const [i, setI] = useState(0)

  const prevCardsRef = useRef(cards)

  useEffect(() => {
    if (cards !== prevCardsRef.current) {
      prevCardsRef.current = cards
      setQ(cards)
      setI(0)
    }
  }, [cards])

  const currentCard = q[i]
  const total = correct + wrong
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const progress = q.length > 0 ? ((i + 1) / q.length) * 100 : 0

  function nx() {
    if (i + 1 >= q.length) {
      finishGame()
      return
    }
    setI((v) => v + 1)
  }

  function ok() {
    answerCorrect()
    nx()
  }

  function er() {
    answerWrong()
    if (!currentCard) return
    const last = i >= q.length - 1
    setQ((v) => {
      const a = v.slice(0, i)
      const b = v.slice(i + 1)
      return [...a, ...b, currentCard, currentCard]
    })
    setI(last ? 0 : i)
  }

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
    // Navigate immediately without refresh - the server will fetch fresh data
    router.push('/home')
  }

  function handleExit() {
    if (window.confirm('Tem certeza que deseja sair? Seu progresso nesta lição não será salvo e você perderá sua ofensiva (foguinho).')) {
      resetGame()
      router.push('/home')
    }
  }

  const modeConfig = gameModeConfig[gameMode] || gameModeConfig.multiple_choice
  const ModeIcon = modeConfig.icon

  // ===== INTRO PHASE =====
  if (phase === 'intro') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="premium-card premium-card-hover w-full max-w-md p-8 sm:p-12 text-center"
        >
          {/* Icon with glow effect */}
          <div className="mb-8 flex justify-center">
            <motion.div 
              className="w-24 h-24 rounded-3xl icon-glow text-[var(--color-primary)] flex items-center justify-center animate-float"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <ModeIcon className="w-12 h-12" strokeWidth={1.5} />
            </motion.div>
          </div>
          
          {/* Title with gradient text option */}
          <motion.h1 
            className="font-bold tracking-tight text-2xl sm:text-3xl text-[var(--color-text)] mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {packName}
          </motion.h1>
          
          {/* Mode badge with glass effect */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 text-sm font-medium text-[var(--color-text-muted)] mb-6 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <ModeIcon className="w-4 h-4" strokeWidth={2} />
            {modeConfig.label}
          </motion.div>
          
          {/* Card count with subtle styling */}
          <motion.p 
            className="text-[var(--color-text-muted)] mb-10 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-sm font-bold">
              {cards.length}
            </span>
            <span className="text-sm">card{cards.length > 1 ? 's' : ''} nesta lição</span>
          </motion.p>
          
          {/* Start button with enhanced styling */}
          <motion.button
            type="button"
            onClick={() => {
              setStarting(true)
              startGame()
            }}
            disabled={starting}
            className="w-full py-4 px-6 rounded-xl font-semibold text-base bg-gradient-to-r from-[var(--color-primary)] to-[#0f766e] text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {starting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                Começar Treinamento
                <ArrowRight className="w-5 h-5" strokeWidth={2} />
              </>
            )}
          </motion.button>
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
          type="button"
          onClick={handleExit}
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

      <div className={`flex flex-col w-full items-center ${gameMode === 'matching' ? 'max-w-6xl' : 'max-w-2xl'} mx-auto`}>
        {/* Game mode renderer */}
        {currentCard && gameMode === 'multiple_choice' && (
          <MultipleChoice
            key={`${currentCard.id}-${i}`}
            card={currentCard}
            allCards={cards}
            onCorrect={() => {
              setTimeout(ok, 800)
            }}
            onWrong={() => {
              setTimeout(er, 1200)
            }}
          />
        )}

        {currentCard && gameMode === 'flashcard' && (
          <Flashcard
            key={`${currentCard.id}-${i}`}
            card={currentCard}
            onCorrect={() => {
              ok()
            }}
            onWrong={() => {
              er()
            }}
          />
        )}

        {currentCard && gameMode === 'typing' && (
          <TypingMode
            key={`${currentCard.id}-${i}`}
            card={currentCard}
            onCorrect={() => {
              setTimeout(ok, 1000)
            }}
            onWrong={() => {
              setTimeout(er, 1500)
            }}
          />
        )}

        {gameMode === 'matching' && cards.length > 0 && (
          <MatchingGame
            key={`matching-${assignmentId}`}
            cards={cards}
            onCorrect={answerCorrect}
            onWrong={answerWrong}
            onFinish={finishGame}
          />
        )}

      </div>
    </div>
  )
}
