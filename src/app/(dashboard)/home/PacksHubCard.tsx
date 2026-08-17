import Link from 'next/link'
import { BookOpen, ListChecks, ListPlus } from 'lucide-react'
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
  isRecentSignup?: boolean
}

export default function PacksHubCard({
  isEmptyRoutine = false,
  isRecentSignup = false,
}: PacksHubCardProps) {
  if (isEmptyRoutine && isRecentSignup) {
    return <OnboardingChecklist variant="panel" showTertiary />
  }

  return (
    <article className={`${homeCardClass} p-6 sm:p-8`}>
      <div className="relative z-10">
        <SectionBadge label="Seus conteúdos" />
        <h2 className={`mt-4 ${homeSectionTitleClass}`}>
          Packs e rotina
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-secondary sm:text-base">
          Crie seus cards ou adicione packs prontos à rotina.
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
      </div>
    </article>
  )
}
