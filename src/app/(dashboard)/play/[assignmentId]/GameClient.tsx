'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    setConfig({
      cards: shuffleArray(cards),
      gameMode,
      assignmentId,
      packName,
    })
  }, [assignmentId, cards, gameMode, packName, setConfig])

  const ready = storeAssignmentId === assignmentId && storeCardsCount > 0

  if (!ready) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="premium-card w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
            <Loader2 className="h-8 w-8 animate-spin" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">Preparando a sessão</h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
            Carregando o pack e organizando os cards para a rodada.
          </p>
        </div>
      </div>
    )
  }

  return <GameWrapper key={assignmentId} timerConfig={timerConfig} />
}
