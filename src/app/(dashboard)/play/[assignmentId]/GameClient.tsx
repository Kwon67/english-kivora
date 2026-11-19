'use client'

import { wordId } from '@/features/words/wordId'
import { useEffect, useRef } from 'react'
import GameWrapper from '@/features/game/components/GameWrapper'
import { useGameStore } from '@/store/gameStore'
import type { Card, GameMode } from '@/types/database.types'
import type { TypingDirection } from '@/features/game/components/TypingMode'
import RouteLoadingSkeleton, { Skeleton, SkeletonText } from '@/components/ui/RouteLoadingSkeleton'

interface GameClientProps {
  cards: Card[]
  gameMode: GameMode
  assignmentId: string
  packName: string
  packDescription?: string
  packCategory?: string | null
  typingDirection?: TypingDirection
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
  typingDirection = 'pt-to-en',
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
      if (!useGameStore.getState().resultSubmissionId) useGameStore.setState({ resultSubmissionId: wordId() })
      return
    }

    if (initializedAssignmentRef.current === initializationKey) return

    initializedAssignmentRef.current = initializationKey
    setConfig({
      // The server supplies the teaching sequence. Choices and SRS reviews still randomize independently.
      cards,
      gameMode,
      assignmentId,
      packName,
      packDescription,
      packCategory,
      typingDirection,
    })
  }, [assignmentId, cards, gameMode, hasHydrated, initializationKey, packCategory, packDescription, packName, setConfig, storeAssignmentId, typingDirection])

  const ready = hasHydrated && storeAssignmentId === assignmentId && storeCardsCount > 0

  if (!ready) {
    return (
      <RouteLoadingSkeleton label="Preparando sua prática">
        <div className="assignment-activity space-y-5" aria-hidden="true">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-10 w-3/4 rounded-control" />
          <SkeletonText className="max-w-sm" />
          <Skeleton className="h-11 w-36 rounded-control" />
        </div>
      </RouteLoadingSkeleton>
    )
  }

  return <GameWrapper key={initializationKey} timerConfig={timerConfig} />
}
