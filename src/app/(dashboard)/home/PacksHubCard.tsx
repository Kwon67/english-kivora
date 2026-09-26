import Link from 'next/link'
import { BookOpen, ListPlus } from 'lucide-react'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import SectionBadge from '@/components/ui/SectionBadge'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  homeCardClass,
  homeSecondaryButton,
  homeSectionTitleClass,
} from '@/lib/homeStyles'
import HomeGlassBackdrop from './HomeGlassBackdrop'

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
    <div className="relative">
      <HomeGlassBackdrop />
      <article className={`${homeCardClass} home-frosted-surface home-frosted-surface-soft relative z-10 p-6 sm:p-8`}>
        <div className="relative z-10">
        <SectionBadge label="Seus conteúdos" />
        <h2 className={`mt-4 ${homeSectionTitleClass}`}>
          Seus packs
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-secondary sm:text-base">
          Crie seus próprios cards ou veja o que já está liberado no seu nível.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
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
    </div>
  )
}
