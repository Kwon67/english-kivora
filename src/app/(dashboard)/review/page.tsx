import { redirect } from 'next/navigation'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import { buildReviewSessionPayload, buildTargetedReviewSessionPayload } from '@/features/review/lib/reviewSession'
import { createClient } from '@/lib/supabase/server'
import { withTimeout } from '@/lib/withTimeout'
import ReviewClient, { DueCard } from '@/features/review/components/ReviewClient'
import type { Card } from '@/types/database.types'

const QUERY_TIMEOUT_MS = 10_000

function buildInitialStats(cards: DueCard[], sessionLimit: number) {
  return {
    newCards: cards.filter((card) => card.isNew).length,
    learning: cards.filter((card) => !card.isNew && card.repetitions < 2).length,
    review: cards.filter((card) => !card.isNew && card.repetitions >= 2).length,
    sessionLimit,
  }
}

function parseReviewCardIds(value: string | undefined) {
  if (!value) return []

  return [...new Set(
    value
      .split(',')
      .map((cardId) => cardId.trim())
      .filter((cardId) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cardId))
  )].slice(0, 50)
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ cards?: string; source?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await withTimeout(
    supabase.auth.getUser(),
    QUERY_TIMEOUT_MS,
    { data: { user: null }, error: null } as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>
  )

  if (!user) {
    redirect('/login')
  }

  void materializeScheduledReviewReleasesForUser(user.id).catch(() => undefined)

  const targetedCardIds = params?.source === 'blitz' ? parseReviewCardIds(params.cards) : []
  const isTargetedBlitzReview = targetedCardIds.length > 0

  const queue = await withTimeout(
    isTargetedBlitzReview
      ? buildTargetedReviewSessionPayload(
          supabase as unknown as Parameters<typeof buildTargetedReviewSessionPayload>[0],
          user.id,
          targetedCardIds
        )
      : buildReviewSessionPayload(
          supabase as unknown as Parameters<typeof buildReviewSessionPayload>[0],
          user.id
        ),
    QUERY_TIMEOUT_MS,
    {
      dueCards: [],
      dueToday: 0,
      dueTomorrow: 0,
      newCards: 0,
      totalDue: 0,
      totalBacklogDue: 0,
      deferredDue: 0,
      totalReviews: 0,
      introducedToday: 0,
      newCardsLimit: 10,
      sessionLimit: 30,
      dailyCardsReviewed: 0,
      packCardsByPackId: {},
    }
  ).catch(() => ({
    dueCards: [],
    dueToday: 0,
    dueTomorrow: 0,
    newCards: 0,
    totalDue: 0,
    totalBacklogDue: 0,
    deferredDue: 0,
    totalReviews: 0,
    introducedToday: 0,
    newCardsLimit: 10,
    sessionLimit: 30,
    dailyCardsReviewed: 0,
    packCardsByPackId: {},
  }))

  const initialDueCards = queue.dueCards as unknown as DueCard[]
  const packCardsByPackId = (queue.packCardsByPackId || {}) as Record<string, Card[]>

  return (
    <ReviewClient
      initialDueCards={initialDueCards}
      initialStats={buildInitialStats(initialDueCards, queue.sessionLimit || 0)}
      packCardsByPackId={packCardsByPackId}
      sessionTitle={isTargetedBlitzReview ? 'Revisão do Blitz' : undefined}
      disableStoredSessionRestore={isTargetedBlitzReview}
    />
  )
}
