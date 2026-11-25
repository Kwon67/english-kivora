import { getCurriculumState } from '@/features/curriculum/lib/curriculumState'
import { getCurriculumGate, getPackLockReason } from '@/features/learning/lib/levelGate'
import { parseReviewCardIds } from '@/features/review/lib/reviewCardIds'
import { after } from 'next/server'
import { ensureDailyPlanForUser } from '@/features/study/lib/ensureDailyPlan'
import { notFound, redirect } from 'next/navigation'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { buildReviewSessionPayload, buildTargetedReviewSessionPayload } from '@/features/review/lib/reviewSession'
import { createClient } from '@/lib/supabase/server'
import { withTimeout } from '@/lib/withTimeout'
import ReviewClient, { DueCard } from '@/features/review/components/ReviewClient'
import GuidedReviewClient from '@/features/review/components/GuidedReviewClient'
import type { Card } from '@/types/database.types'

export const maxDuration = 180

const QUERY_TIMEOUT_MS = 10_000

type ReviewLoadStatus = 'ok' | 'timeout' | 'error'

type ReviewQueuePayload = Awaited<ReturnType<typeof buildReviewSessionPayload>>

const EMPTY_REVIEW_QUEUE: ReviewQueuePayload = {
  dueCards: [],
  dueToday: 0,
  dueTomorrow: 0,
  newCards: 0,
  totalDue: 0,
  totalBacklogDue: 0,
  deferredDue: 0,
  totalReviews: 0,
  unseenInRoutine: 0,
  introducedToday: 0,
  newCardsLimit: 10,
  sessionLimit: 10,
  dailyCardsReviewed: 0,
  packCardsByPackId: {},
}

async function loadReviewQueue(
  queuePromise: Promise<ReviewQueuePayload>
): Promise<{
  status: ReviewLoadStatus
  queue: ReviewQueuePayload
  errorMessage?: string
}> {
  try {
    const result = await Promise.race([
      queuePromise.then((queue) => ({ kind: 'ok' as const, queue })),
      new Promise<{ kind: 'timeout' }>((resolve) => {
        setTimeout(() => resolve({ kind: 'timeout' }), QUERY_TIMEOUT_MS)
      }),
    ])

    if (result.kind === 'timeout') {
      return { status: 'timeout', queue: EMPTY_REVIEW_QUEUE }
    }

    return { status: 'ok', queue: result.queue }
  } catch (error) {
    return {
      status: 'error',
      queue: EMPTY_REVIEW_QUEUE,
      errorMessage: error instanceof Error ? error.message : 'Não foi possível carregar a revisão.',
    }
  }
}

function buildInitialStats(cards: DueCard[], sessionLimit: number) {
  return {
    newCards: cards.filter((card) => card.isNew).length,
    learning: cards.filter((card) => !card.isNew && card.repetitions < 2).length,
    review: cards.filter((card) => !card.isNew && card.repetitions >= 2).length,
    sessionLimit,
  }
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ cards?: string; source?: string; mode?: string }>
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

  after(async () => {
    try { await ensureDailyPlanForUser(user.id, user.user_metadata) }
    catch { console.error('Não foi possível preparar a rotina em segundo plano.') }
  })

  void materializeScheduledReviewReleasesForUser(user.id).catch(() => undefined)

  const source = params?.source
  const targetedSource = source === 'blitz' || source === 'problem' || source === 'phrases' ? source : null
  const targetedCardIds = targetedSource ? parseReviewCardIds(params?.cards) : []
  if (source === 'phrases') {
    if (!targetedCardIds.length) notFound()
    const { data, error } = await supabase.from('cards').select('id,packs!inner(level,owner_id,is_public)').in('id', targetedCardIds)
    if (error) throw new Error('Não foi possível abrir as frases.')
    const rows = data as unknown as { id: string; packs: { level: string | null; owner_id: string | null; is_public: boolean | null } }[]
    if (rows.length !== targetedCardIds.length) notFound()
    if (rows.some(row => row.packs.owner_id !== user.id)) {
      const gate = getCurriculumGate((await getCurriculumState(user.id)).currentLevel)
      if (rows.some(({ packs }) => packs.owner_id !== user.id && (packs.is_public === false || getPackLockReason(packs.level, gate)))) notFound()
    }
  }
  const isTargetedReview = targetedCardIds.length > 0

  const queuePromise = isTargetedReview
    ? buildTargetedReviewSessionPayload(
        supabase as unknown as Parameters<typeof buildTargetedReviewSessionPayload>[0],
        user.id,
        targetedCardIds
      )
    : getUserCefrProfile(supabase, user.id, user.user_metadata).then((perfil) =>
        buildReviewSessionPayload(
          supabase as unknown as Parameters<typeof buildReviewSessionPayload>[0],
          user.id,
          perfil.level
        )
      )

  const { status: loadStatus, queue, errorMessage: loadErrorMessage } = await loadReviewQueue(queuePromise)

  const initialDueCards = queue.dueCards as unknown as DueCard[]
  const packCardsByPackId = (queue.packCardsByPackId || {}) as Record<string, Card[]>
  const targetedSessionTitle =
    targetedSource === 'blitz'
      ? 'Revisão do Blitz'
      : targetedSource === 'problem'
        ? 'Revisão de dificuldades'
        : targetedSource === 'phrases' ? 'Prática de frases' : undefined

  const Client = params?.mode === 'guided' ? GuidedReviewClient : ReviewClient
  return (
    <Client key={isTargetedReview ? targetedCardIds.join(',') : 'daily'}
      userId={user.id}
      initialDueCards={initialDueCards}
      initialStats={buildInitialStats(initialDueCards, queue.sessionLimit || 0)}
      packCardsByPackId={packCardsByPackId}
      sessionTitle={targetedSessionTitle}
      disableStoredSessionRestore={isTargetedReview}
      initialLoadStatus={loadStatus}
      loadErrorMessage={loadErrorMessage}
    />
  )
}
