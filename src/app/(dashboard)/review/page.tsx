import { redirect } from 'next/navigation'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import { getReviewQueueForUser } from '@/features/review/lib/reviewQueue'
import { createClient } from '@/lib/supabase/server'
import { withTimeout } from '@/lib/withTimeout'
import ReviewClient, { DueCard } from '@/features/review/components/ReviewClient'

const QUERY_TIMEOUT_MS = 10_000

function buildInitialStats(cards: DueCard[], sessionLimit: number) {
  return {
    newCards: cards.filter((card) => card.isNew).length,
    learning: cards.filter((card) => !card.isNew && card.repetitions < 2).length,
    review: cards.filter((card) => !card.isNew && card.repetitions >= 2).length,
    sessionLimit,
  }
}

export default async function ReviewPage() {
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

  const queue = await withTimeout(
    getReviewQueueForUser(
      supabase as unknown as Parameters<typeof getReviewQueueForUser>[0],
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
  }))

  const initialDueCards = queue.dueCards as unknown as DueCard[]

  return (
    <ReviewClient
      initialDueCards={initialDueCards}
      initialStats={buildInitialStats(initialDueCards, queue.sessionLimit || 0)}
    />
  )
}
