'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import GameWrapper from '@/features/game/components/GameWrapper'
import { shuffleArray } from '@/lib/utils'
import { useGameStore } from '@/store/gameStore'
import type { Card, GameMode } from '@/types/database.types'
import { homeCardClass, homeIconBoxBase } from '@/lib/homeStyles'
import { landingCtaCardShadow } from '@/lib/landingStyles'

interface GameClientProps {
  cards: Card[]
  gameMode: GameMode
  assignmentId: string
  packName: string
  packDescription?: string
  packCategory?: string | null
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
  packDescription = '',
  packCategory = null,
  timerConfig,
}: GameClientProps) {
  const setConfig = useGameStore((state) => state.setConfig)
  const hasHydrated = useGameStore((state) => state.hasHydrated)
  const storeAssignmentId = useGameStore((state) => state.assignmentId)
  const storeCardsCount = useGameStore((state) => state.cards.length)
  const initializedAssignmentRef = useRef<string | null>(null)
  const initializationKey = `${assignmentId}:${gameMode}`

  useEffect(() => {
    if (!hasHydrated) return

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
      packDescription,
      packCategory,
    })
  }, [assignmentId, cards, gameMode, hasHydrated, initializationKey, packCategory, packDescription, packName, setConfig, storeAssignmentId])

  const ready = hasHydrated && storeAssignmentId === assignmentId && storeCardsCount > 0

  if (!ready) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className={`${homeCardClass} ${landingCtaCardShadow} w-full max-w-md p-10 text-center`}>
          <div className={`mx-auto ${homeIconBoxBase} h-20 w-20 p-5`}>
            <Loader2 className="h-10 w-10 animate-spin" strokeWidth={2.5} />
          </div>
          <h2 className="mt-8 font-heading text-3xl font-bold text-brand-dark">Preparando</h2>
          <p className="mt-3 font-body text-sm font-medium text-brand-secondary">
            Carregando pack e cards para sua rodada de estudo.
          </p>
        </div>
      </div>
    )
  }

  return <GameWrapper key={initializationKey} timerConfig={timerConfig} />
}
