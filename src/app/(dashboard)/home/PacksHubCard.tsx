import Link from 'next/link'
import { BookOpen, ListChecks, ListPlus, Mic } from 'lucide-react'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import SectionBadge from '@/components/ui/SectionBadge'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  homeCardClass,
  homeSecondaryButton,
  homeSectionTitleClass,
} from '@/lib/homeStyles'

type PacksHubCardProps = {
  isEmptyRoutine?: boolean
}

export default function PacksHubCard({ isEmptyRoutine = false }: PacksHubCardProps) {
  if (isEmptyRoutine) {
    return <OnboardingChecklist variant="panel" showTertiary />
  }

  return (
    <article className={`${homeCardClass} p-6 sm:p-8`}>
      <div className="relative z-10">
        <SectionBadge label="Seus conteúdos" />
        <h2 className={`mt-4 ${homeSectionTitleClass}`}>
          Crie ou adicione packs de estudo
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-secondary sm:text-base">
          Monte packs com seus próprios cards na biblioteca ou adicione packs prontos do catálogo Explorar à sua rotina de estudo.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/study"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={homeSecondaryButton}
          >
            <ListChecks className="h-4 w-4" />
            Gerenciar rotina
          </Link>
          <Link
            href="/explore"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={homeSecondaryButton}
          >
            <BookOpen className="h-4 w-4" />
            Explorar packs
          </Link>
          <Link
            href="/library#user-packs-title"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={homeSecondaryButton}
          >
            <ListPlus className="h-4 w-4" />
            Criar pack
          </Link>
        </div>

        <div className="mt-6 flex justify-end border-t border-brand-dark pt-4">
          <Link
            href="/tutor"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary transition-colors hover:text-brand-dark"
          >
            <Mic className="h-4 w-4" />
            Conversar com o tutor
          </Link>
        </div>
      </div>
    </article>
  )
}
