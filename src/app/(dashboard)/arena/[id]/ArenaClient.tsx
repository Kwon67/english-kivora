'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Flashcard from '@/components/game/Flashcard'
import type { Card } from '@/types/database.types'
import { Trophy, Swords, Loader2 } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface ArenaClientProps {
  duelId: string
  userId: string
  player1: { id: string; username: string }
  player2: { id: string; username: string }
  initialStatus: string
  winnerId: string | null
  packName: string
  cards: Card[]
}

export default function ArenaClient({
  duelId,
  userId,
  player1,
  player2,
  initialStatus,
  winnerId: initialWinnerId,
  packName,
  cards,
}: ArenaClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [winnerId, setWinnerId] = useState(initialWinnerId)
  
  const [myProgress, setMyProgress] = useState(0)
  const [opponentProgress, setOpponentProgress] = useState(0)
  
  const [myScore, setMyScore] = useState(0)

  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  const isPlayer1 = userId === player1.id
  const opponent = isPlayer1 ? player2 : player1

  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to DB changes for duel status
    const dbChannel = supabase.channel(`duel_db_${duelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'arena_duels',
          filter: `id=eq.${duelId}`
        },
        (payload) => {
          const updated = payload.new
          setStatus(updated.status)
          if (updated.winner_id) setWinnerId(updated.winner_id)
        }
      )
      .subscribe()

    // Realtime channel for game events (progress, score)
    const gameChannel = supabase.channel(`duel_game_${duelId}`)
      .on('broadcast', { event: 'progress' }, (payload) => {
        if (payload.payload.userId !== userId) {
          setOpponentProgress(payload.payload.progress)
        }
      })
      .subscribe(async (state) => {
        if (state === 'SUBSCRIBED') {
          // Both join -> update status to active if pending and we are player1
          if (isPlayer1 && status === 'pending') {
            await supabase.from('arena_duels').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', duelId)
          }
        }
      })

    return () => {
      supabase.removeChannel(dbChannel)
      supabase.removeChannel(gameChannel)
    }
  }, [duelId, isPlayer1, status, userId])

  const broadcastProgress = async (newProgress: number, newScore: number) => {
    const supabase = createClient()
    await supabase.channel(`duel_game_${duelId}`).send({
      type: 'broadcast',
      event: 'progress',
      payload: { userId, progress: newProgress, score: newScore }
    })
  }

  const handleFinish = async () => {
    const supabase = createClient()
    // Mark as finished if not already
    // Actually, let's just update the duel with winner if we finish first or if we have more points
    // For simplicity, first to finish gets points checked
    // We can do an atomic RPC, but here we'll just set it.
    
    // Let's just set winner to me if we finish
    const { data: currentDuel } = await supabase.from('arena_duels').select('status, winner_id').eq('id', duelId).single()
    if (currentDuel && currentDuel.status !== 'finished') {
      await supabase.from('arena_duels').update({
        status: 'finished',
        winner_id: userId,
        finished_at: new Date().toISOString()
      }).eq('id', duelId)
    }
  }

  const handleNext = (correct: boolean) => {
    const nextIndex = currentCardIndex + 1
    const newScore = correct ? myScore + 1 : myScore
    
    setMyScore(newScore)
    setMyProgress(nextIndex)
    setCurrentCardIndex(nextIndex)
    
    broadcastProgress(nextIndex, newScore)

    if (nextIndex >= cards.length) {
      handleFinish()
    }
  }

  if (status === 'pending') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="text-center animate-pulse">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--color-primary)] mb-4" />
          <h2 className="text-2xl font-bold">Aguardando Oponente...</h2>
          <p className="text-[var(--color-text-muted)] mt-2">Prepare-se para o duelo de {packName}</p>
        </div>
      </div>
    )
  }

  if (status === 'finished') {
    const iWon = winnerId === userId
    if (iWon) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
    }
    
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <m.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card max-w-md w-full p-8 text-center"
        >
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6 ${iWon ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
            <Trophy className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {iWon ? 'Você Venceu!' : 'Fim do Duelo'}
          </h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            {iWon ? 'Parabéns pela vitória na Arena!' : 'Não foi dessa vez. Continue treinando!'}
          </p>
          <button 
            onClick={() => router.push('/home')}
            className="btn-primary w-full"
          >
            Voltar ao Início
          </button>
        </m.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
      <div className="flex items-center justify-between mb-8 bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-sm">
        {/* Me */}
        <div className="flex-1">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>Você ({isPlayer1 ? player1.username : player2.username})</span>
            <span className="text-[var(--color-primary)]">{myProgress}/{cards.length}</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--color-primary)] transition-all duration-500 ease-out"
              style={{ width: `${(myProgress / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mx-6 flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-500">
          <Swords className="h-6 w-6" />
        </div>

        {/* Opponent */}
        <div className="flex-1">
          <div className="flex justify-between text-sm font-semibold mb-2 text-right">
            <span className="text-orange-500">{opponentProgress}/{cards.length}</span>
            <span>{opponent.username}</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex justify-end">
            <div 
              className="h-full bg-orange-500 transition-all duration-500 ease-out"
              style={{ width: `${(opponentProgress / cards.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={currentCardIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentCardIndex < cards.length && (
            <Flashcard 
              card={cards[currentCardIndex]} 
              onCorrect={() => handleNext(true)} 
              onWrong={() => handleNext(false)} 
            />
          )}
        </m.div>
      </AnimatePresence>
    </div>
  )
}
