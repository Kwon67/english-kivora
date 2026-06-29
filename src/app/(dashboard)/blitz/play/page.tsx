import { redirect } from 'next/navigation'
import BlitzClient from '@/features/blitz/components/BlitzClient'
import EmptyState from '@/components/ui/EmptyState'
import { generateBlitzAiPack, getBlitzCards, getUserBlitzBestScore } from '@/app/actions'
import type { BlitzAiPackDraft } from '@/app/actions'
import { isLearnerCefrLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import BlitzShell from '@/features/blitz/components/BlitzShell'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BlitzPlayPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string; level?: string }>
}) {
  const params = await searchParams
  const isAiMode = params?.mode === 'ai'

  if (isAiMode && !isLearnerCefrLevel(params?.level)) {
    redirect('/blitz')
  }

  const aiLevel = (isLearnerCefrLevel(params?.level) ? params.level : 'A2') as LearnerCefrLevel
  const result = isAiMode ? await generateBlitzAiPack(32, aiLevel) : await getBlitzCards(40)
  const { cards, error } = result
  const aiResult = isAiMode
    ? result as Awaited<ReturnType<typeof generateBlitzAiPack>>
    : null
  const aiPack: BlitzAiPackDraft | null =
    aiResult?.pack ?? null
  const personalBest = await getUserBlitzBestScore()

  if (error) {
    if (!isAiMode) {
      redirect('/blitz')
    }

    return (
      <BlitzShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <EmptyState
            imageSrc="/images/home/undraw-online-learning.svg"
            imageAlt="Ilustração de IA indisponível"
            title="Blitz IA indisponível"
            description={error}
            actionHref="/blitz/play"
            actionLabel="Jogar modo padrão"
            transitionTypes={navBackTransitionTypes}
            variant="glass"
            className="w-full max-w-xl"
          />
        </div>
      </BlitzShell>
    )
  }

  if (!cards || cards.length < 2) {
    return (
      <BlitzShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <EmptyState
            imageSrc="/images/home/undraw-online-learning.svg"
            imageAlt="Ilustração de cards insuficientes"
            title="Cards insuficientes"
            description="Você precisa de pelo menos alguns cards para jogar Blitz. Explore packs ou complete atividades primeiro."
            actionHref="/explore"
            actionLabel="Explorar packs"
            transitionTypes={navBackTransitionTypes}
            variant="glass"
            className="w-full max-w-xl"
          />
        </div>
      </BlitzShell>
    )
  }

  return (
    <BlitzClient
      cards={cards}
      personalBest={personalBest}
      source={isAiMode ? 'ai' : 'standard'}
      aiPack={aiPack}
    />
  )
}
