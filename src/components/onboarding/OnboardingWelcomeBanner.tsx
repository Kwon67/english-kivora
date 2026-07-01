import Link from 'next/link'
import { ArrowRight, Clock, ClipboardCheck, Sparkles } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import { getDailyGoalLabel } from '@/features/onboarding/lib/onboardingInterests'
import type { OnboardingDailyGoalMinutes } from '@/features/onboarding/lib/onboardingInterests'
import type { OnboardingLevelSource } from '@/features/onboarding/lib/onboardingStatus'
import {
  homeWelcomePrimaryButton,
  homeWelcomeSecondaryButton,
  onboardingPackMetaPill,
} from '@/features/onboarding/lib/onboardingUi'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { homeCardClass, homeSectionTitleClass } from '@/lib/homeStyles'

type OnboardingWelcomeBannerProps = {
  dailyGoalMinutes: OnboardingDailyGoalMinutes
  levelSource?: OnboardingLevelSource | null
  placementConfidence?: number | null
  starterPackName?: string | null
  starterPackHref?: string | null
}

export default function OnboardingWelcomeBanner({
  dailyGoalMinutes,
  levelSource,
  placementConfidence,
  starterPackName,
  starterPackHref,
}: OnboardingWelcomeBannerProps) {
  const showPlacementConfidence =
    levelSource === 'placement' &&
    placementConfidence != null &&
    placementConfidence >= 0

  return (
    <section data-testid="onboarding-welcome-banner" className={`${homeCardClass} min-w-0 p-6 sm:p-8`}>
      <SectionBadge label="Perfil configurado" />
      <h2 className={`mt-4 ${homeSectionTitleClass}`}>Sua rotina está pronta</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-secondary sm:text-base">
        Meta diária de {dailyGoalMinutes} minutos e nível ajustado. Comece pela primeira sessão para
        ganhar ritmo.
      </p>

      <div className="mt-4 flex min-w-0 flex-wrap gap-2">
        <span className={`${onboardingPackMetaPill} inline-flex max-w-full items-center gap-2`}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{getDailyGoalLabel(dailyGoalMinutes)}</span>
        </span>
        {showPlacementConfidence ? (
          <span
            className={`${onboardingPackMetaPill} inline-flex max-w-full items-center gap-2 bg-brand-accent/50`}
            data-testid="onboarding-placement-confidence-pill"
          >
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate sm:hidden">Teste: {placementConfidence}%</span>
            <span className="hidden truncate sm:inline">
              Teste de nível: {placementConfidence}% de confiança
            </span>
          </span>
        ) : null}
        {starterPackName ? (
          <span
            className={`${onboardingPackMetaPill} inline-flex max-w-full items-center gap-2 bg-brand-accent/50`}
            title={starterPackName}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Pack inicial: {starterPackName}</span>
          </span>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {starterPackHref ? (
          <Link
            href={starterPackHref}
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={homeWelcomePrimaryButton}
          >
            Começar pack inicial
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        ) : (
          <Link
            href="/explore"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={homeWelcomePrimaryButton}
          >
            Explorar packs
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        )}
        <Link
          href="/study"
          transitionTypes={navForwardTransitionTypes}
          prefetch={false}
          className={homeWelcomeSecondaryButton}
        >
          Ver minha rotina
        </Link>
      </div>
    </section>
  )
}