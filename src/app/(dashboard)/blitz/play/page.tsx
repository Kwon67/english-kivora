import { redirect } from 'next/navigation'
import BlitzClient from '@/features/blitz/components/BlitzClient'
import EmptyState from '@/components/ui/EmptyState'
import { getBlitzCards, getUserBlitzBestScore } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BlitzPlayPage() {
  const { cards, error } = await getBlitzCards(40)
  const personalBest = await getUserBlitzBestScore()

  if (error) {
    redirect('/blitz')
  }

  if (!cards || cards.length < 2) {
    return (
      <div className="home-mobile-optimized relative -mx-4 -my-6 flex min-h-[calc(100vh-5rem)] min-h-[calc(100svh-5rem)] items-center justify-center px-4 py-8 sm:-mx-6 sm:-my-8 sm:px-6">
        <EmptyState
          imageSrc="/images/home/undraw-online-learning.svg"
          imageAlt="Ilustração de cards insuficientes"
          title="Cards insuficientes"
          description="Você precisa de pelo menos alguns cards para jogar Blitz. Explore packs ou complete atividades primeiro."
          actionHref="/explore"
          actionLabel="Explorar packs"
          transitionTypes={navBackTransitionTypes}
          className="w-full max-w-xl"
        />
      </div>
    )
  }

  return <BlitzClient cards={cards} personalBest={personalBest} />
}