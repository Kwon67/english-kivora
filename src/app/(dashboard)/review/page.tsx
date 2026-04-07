'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { submitCardReview, getDueCards } from '@/app/actions'
import { getQualityColor } from '@/lib/spacedRepetition'
import { Card, Pack } from '@/types/database.types'
import { 
  Brain, 
  RotateCcw, 
  X, 
  CheckCircle2
} from 'lucide-react'

interface DueCard {
  id: string
  card_id: string
  pack_id: string
  cards: Card
  packs: Pack
  interval_days: number
  ease_factor: number
  repetitions: number
  isNew?: boolean
}

export default function ReviewPage() {
  const router = useRouter()
  const [dueCards, setDueCards] = useState<DueCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)
  const [stats, setStats] = useState({
    newCards: 0,
    learning: 0,
    review: 0
  })

  const loadDueCards = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getDueCards()
      setDueCards(result.dueCards as DueCard[])
      
      // Calculate stats
      const newCards = result.dueCards.filter((c: DueCard) => c.isNew).length
      const learning = result.dueCards.filter((c: DueCard) => !c.isNew && c.repetitions < 2).length
      const review = result.dueCards.filter((c: DueCard) => !c.isNew && c.repetitions >= 2).length
      
      setStats({ newCards, learning, review })
    } catch (error) {
      console.error('Error loading due cards:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDueCards()
  }, [loadDueCards])

  const currentCard = dueCards[currentIndex]

  async function handleReview(quality: number) {
    if (!currentCard) return

    setIsLoading(true)
    try {
      await submitCardReview({
        cardId: currentCard.card_id || currentCard.id,
        packId: currentCard.pack_id,
        quality,
        previousInterval: currentCard.isNew ? undefined : currentCard.interval_days,
        previousEaseFactor: currentCard.isNew ? undefined : currentCard.ease_factor,
        previousRepetitions: currentCard.isNew ? undefined : currentCard.repetitions
      })

      setCompletedCount(prev => prev + 1)
      
      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setShowAnswer(false)
      } else {
        // All cards reviewed
        router.push('/home?reviewComplete=true')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && dueCards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-[var(--color-primary)] animate-pulse mx-auto mb-4" />
          <p className="text-[var(--color-text-muted)]">Carregando cards...</p>
        </div>
      </div>
    )
  }

  if (dueCards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            Parabéns!
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            Você não tem cards para revisar no momento. Todas as revisões estão em dia!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/home')}
              className="btn-primary cursor-pointer"
            >
              Voltar para Home
            </button>
            <button
              onClick={() => loadDueCards()}
              className="btn-ghost cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            Revisão Concluída!
          </h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            Você revisou {completedCount} cards. Continue assim!
          </p>
          <button
            onClick={() => router.push('/home')}
            className="btn-primary cursor-pointer w-full"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    )
  }

  const qualityButtons = [
    { quality: 0, label: 'Errei', shortcut: '1', time: '1 min' },
    { quality: 1, label: 'Difícil', shortcut: '2', time: '10 min' },
    { quality: 2, label: 'Difícil', shortcut: '2', time: '1 dia' },
    { quality: 3, label: 'Bom', shortcut: '3', time: currentCard.isNew ? '1 dia' : `${Math.round(currentCard.interval_days * currentCard.ease_factor)} dias` },
    { quality: 4, label: 'Fácil', shortcut: '4', time: currentCard.isNew ? '4 dias' : `${Math.round(currentCard.interval_days * currentCard.ease_factor * 1.3)} dias` },
    { quality: 5, label: 'Muito Fácil', shortcut: '5', time: currentCard.isNew ? '7 dias' : `${Math.round(currentCard.interval_days * currentCard.ease_factor * 1.5)} dias` }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[var(--color-text)]">Revisão</h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                {currentIndex + 1} de {dueCards.length} cards
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Stats badges */}
            <div className="hidden sm:flex items-center gap-2">
              {stats.newCards > 0 && (
                <span className="badge bg-blue-100 text-blue-700 border-blue-200">
                  Novos: {stats.newCards}
                </span>
              )}
              {stats.learning > 0 && (
                <span className="badge bg-amber-100 text-amber-700 border-amber-200">
                  Aprendendo: {stats.learning}
                </span>
              )}
              {stats.review > 0 && (
                <span className="badge bg-emerald-100 text-emerald-700 border-emerald-200">
                  Revisar: {stats.review}
                </span>
              )}
            </div>
            
            <button
              onClick={() => router.push('/home')}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-[var(--color-surface-hover)]">
          <div 
            className="h-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${((currentIndex) / dueCards.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Card */}
        <div className="mb-8">
          <div className="glass-card p-8 sm:p-12 text-center min-h-[300px] flex flex-col justify-center">
            {/* Card content */}
            <div className="mb-6">
              <span className="text-sm text-[var(--color-text-subtle)] uppercase tracking-wider font-medium">
                {currentCard.isNew ? 'Novo Card' : `Repetição #${currentCard.repetitions}`}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] mt-4 mb-2">
                {currentCard.cards.english_phrase}
              </h2>
              {currentCard.packs?.name && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Pack: {currentCard.packs.name}
                </p>
              )}
            </div>
            
            {/* Answer */}
            {showAnswer ? (
              <div className="animate-fade-in pt-6 border-t border-[var(--color-border)]">
                <p className="text-2xl sm:text-3xl text-[var(--color-primary)] font-semibold">
                  {currentCard.cards.portuguese_translation}
                </p>
                {!currentCard.isNew && (
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
                    <span>Intervalo: {currentCard.interval_days} dias</span>
                    <span>•</span>
                    <span>Fator: {currentCard.ease_factor.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="btn-primary mx-auto mt-4"
              >
                Mostrar Resposta
              </button>
            )}
          </div>
        </div>

        {/* Quality buttons */}
        {showAnswer && (
          <div className="animate-slide-up">
            <p className="text-center text-sm text-[var(--color-text-muted)] mb-4">
              Como foi sua resposta?
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {qualityButtons.slice(0, 2).map((btn) => (
                <button
                  key={btn.quality}
                  onClick={() => handleReview(btn.quality)}
                  disabled={isLoading}
                  className={`py-3 px-2 rounded-xl font-medium text-white text-sm transition-all hover:scale-105 active:scale-95 ${
                    btn.quality === 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">{btn.time}</div>
                  {btn.label}
                  <div className="text-xs opacity-75 mt-1 hidden sm:block">({btn.shortcut})</div>
                </button>
              ))}
              {qualityButtons.slice(2).map((btn) => (
                <button
                  key={btn.quality}
                  onClick={() => handleReview(btn.quality)}
                  disabled={isLoading}
                  className={`py-3 px-2 rounded-xl font-medium text-white text-sm transition-all hover:scale-105 active:scale-95 ${
                    getQualityColor(btn.quality)
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">{btn.time}</div>
                  {btn.label}
                  <div className="text-xs opacity-75 mt-1 hidden sm:block">({btn.shortcut})</div>
                </button>
              ))}
            </div>
            
            {/* Keyboard shortcuts hint */}
            <p className="text-center text-xs text-[var(--color-text-subtle)] mt-4">
              Use as teclas 1-5 ou clique nos botões
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
