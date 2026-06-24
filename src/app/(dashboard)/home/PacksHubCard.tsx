import Link from 'next/link'
import { BookOpen, ListChecks, ListPlus, Mic } from 'lucide-react'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { cardSheen, glassPanel, primaryBtn, softBtn, softKicker } from '@/lib/dashboardUi'

type PacksHubCardProps = {
  isEmptyRoutine?: boolean
}

export default function PacksHubCard({ isEmptyRoutine = false }: PacksHubCardProps) {
  if (isEmptyRoutine) {
    return <OnboardingChecklist variant="panel" showTertiary />
  }

  return (
    <article className={`${glassPanel} p-5 sm:p-7`}>
      <div className={cardSheen} />

      <div className="relative z-10">
        <p className={softKicker}>Seus conteúdos</p>
        <h2 className="mt-4 font-montserrat text-2xl font-bold leading-tight text-text dark:text-text sm:text-3xl">
          Crie ou adicione packs de estudo
        </h2>
        <p className="mt-3 max-w-2xl font-inter text-sm leading-relaxed text-text-muted sm:text-base dark:text-text-muted">
          Monte packs com seus próprios cards na biblioteca ou adicione packs prontos do catálogo Explorar à sua rotina de estudo.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/study"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={primaryBtn}
          >
            <ListChecks className="h-4 w-4" />
            Gerenciar rotina
          </Link>
          <Link
            href="/explore"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={softBtn}
          >
            <BookOpen className="h-4 w-4" />
            Explorar packs
          </Link>
          <Link
            href="/library#user-packs-title"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={softBtn}
          >
            <ListPlus className="h-4 w-4" />
            Criar pack
          </Link>
        </div>

        <div className="mt-6 flex justify-end border-t border-dashed border-border-muted/20 pt-4 dark:border-border-accent/20">
          <Link
            href="/tutor"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm font-bold text-text-subtle transition-colors hover:text-primary dark:text-text-subtle"
          >
            <Mic className="h-4 w-4" />
            Conversar com o tutor
          </Link>
        </div>
      </div>
    </article>
  )
}
