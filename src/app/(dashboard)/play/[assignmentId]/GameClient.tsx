'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import GameWrapper from '@/components/game/GameWrapper'
import { shuffleArray } from '@/lib/utils'
import { useGameStore } from '@/store/gameStore'
import type { Card, GameMode } from '@/types/database.types'

interface GameClientProps {
  cards: Card[]
  gameMode: GameMode
  assignmentId: string
  packName: string
  timerConfig: {
    timeLimitMinutes: number | null
    startedAt: string | null
    deadlineAt: string | null
  }
}

export default function GameClient({
  cards,
  gameMode,
  assignmentId,
  packName,
  timerConfig,
}: GameClientProps) {
  const setConfig = useGameStore((state) => state.setConfig)
  const storeAssignmentId = useGameStore((state) => state.assignmentId)
  const storeCardsCount = useGameStore((state) => state.cards.length)
  const initializedAssignmentRef = useRef<string | null>(null)
  const initializationKey = `${assignmentId}:${gameMode}`

  useEffect(() => {
    // If we're already on this assignment and mode, don't reset.
    // This allows resuming after F5.
    if (storeAssignmentId === assignmentId && useGameStore.getState().gameMode === gameMode) {
      return
    }

    if (initializedAssignmentRef.current === initializationKey) return

    initializedAssignmentRef.current = initializationKey
    setConfig({
      cards: shuffleArray(cards),
      gameMode,
      assignmentId,
      packName,
    })
  }, [assignmentId, cards, gameMode, initializationKey, packName, setConfig, storeAssignmentId])

  const ready = storeAssignmentId === assignmentId && storeCardsCount > 0

  if (!ready) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="bg-[#fdfdf8] border border-slate-100 rounded-[2.5rem] w-full max-w-md p-10 text-center editorial-shadow">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-50 text-emerald-600 border border-slate-100">
            <Loader2 className="h-10 w-10 animate-spin" strokeWidth={2.5} />
          </div>
          <h2 className="mt-8 text-3xl font-black text-slate-900 tracking-tighter">Preparando</h2>
          <p className="mt-3 text-sm font-medium text-slate-400">
            Carregando pack e cards para sua rodada de estudo.
          </p>
        </div>
      </div>
    )
  }

  return <GameWrapper key={initializationKey} timerConfig={timerConfig} />
}
