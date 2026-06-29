import Link from 'next/link'
import { BookOpen, ListChecks, ListPlus, Mic } from 'lucide-react'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

type PacksHubCardProps = {
  isEmptyRoutine?: boolean
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-5 py-2.5 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--color-brand-accent)]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-5 py-2.5 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white'

export default function PacksHubCard({ isEmptyRoutine = false }: PacksHubCardProps) {
  if (isEmptyRoutine) {
    return <OnboardingChecklist variant="panel" showTertiary />
  }

  return (
    <article className="rounded-2xl border-2 border-brand-dark bg-bg-card p-6 shadow-[6px_6px_0_var(--color-brand-dark)] sm:p-8">
      <div className="relative z-10">
        <div className="flex w-fit items-center">
          <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
          <span className="h-px w-8 bg-brand-dark/60" />
          <span className="rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">Seus conteúdos</span>
          <span className="h-px w-8 bg-brand-dark/60" />
          <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
        </div>
        <h2 className="mt-4 font-heading text-2xl font-bold leading-tight text-brand-dark sm:text-3xl">
          Crie ou adicione packs de estudo
        </h2>
        <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
          Monte packs com seus próprios cards na biblioteca ou adicione packs prontos do catálogo Explorar à sua rotina de estudo.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/study"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={primaryButton}
          >
            <ListChecks className="h-4 w-4" />
            Gerenciar rotina
          </Link>
          <Link
            href="/explore"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={secondaryButton}
          >
            <BookOpen className="h-4 w-4" />
            Explorar packs
          </Link>
          <Link
            href="/library#user-packs-title"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={secondaryButton}
          >
            <ListPlus className="h-4 w-4" />
            Criar pack
          </Link>
        </div>

        <div className="mt-6 flex justify-end border-t-2 border-brand-dark pt-4">
          <Link
            href="/tutor"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-brand-secondary transition-colors hover:text-brand-dark"
          >
            <Mic className="h-4 w-4" />
            Conversar com o tutor
          </Link>
        </div>
      </div>
    </article>
  )
}
