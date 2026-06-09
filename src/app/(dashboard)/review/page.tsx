import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import { getReviewQueueForUser } from '@/features/review/lib/reviewQueue'
import { createClient } from '@/lib/supabase/server'
import ReviewClient, { DueCard } from '@/features/review/components/ReviewClient'

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
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  await materializeScheduledReviewReleasesForUser(user.id)
  const queue = await getReviewQueueForUser(
    supabase as unknown as Parameters<typeof getReviewQueueForUser>[0],
    user.id
  )

  const initialDueCards = queue.dueCards as unknown as DueCard[]

  return (
    <ReviewClient
      initialDueCards={initialDueCards}
      initialStats={buildInitialStats(initialDueCards, queue.sessionLimit || 0)}
    />
  )
}
