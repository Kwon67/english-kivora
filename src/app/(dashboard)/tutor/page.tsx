import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import TutorHeader from '@/features/tutor/components/TutorHeader'
import { TUTOR_SCENARIOS } from '@/features/tutor/lib/scenarios'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  homeIconBox,
  homeSectionTitleClass,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'
import { tutorCard } from '@/features/tutor/lib/tutorPageUi'

export { TUTOR_SCENARIOS as SCENARIOS }

export default function TutorPage() {
  return (
    <div className={homeShellClass}>
      <div className="relative z-10 mx-auto max-w-5xl space-y-8 pb-12">
        <TutorHeader />

        <section className="space-y-4">
          <div>
            <SectionBadge label="Cenários" />
            <h2 className={`mt-3 ${homeSectionTitleClass}`}>Escolha uma conversa</h2>
            <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
              Cada cenário simula uma situação real — do café ao escritório — com dicas discretas enquanto você pratica.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {TUTOR_SCENARIOS.map((scenario) => {
              const Icon = scenario.icon
              return (
                <Link
                  key={scenario.id}
                  href={`/tutor/${scenario.id}`}
                  transitionTypes={navForwardTransitionTypes}
                  prefetch={false}
                  className={`group block ${tutorCard} p-5 transition-transform hover:-translate-y-0.5 sm:p-6`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`h-12 w-12 shrink-0 ${homeIconBox}`}>
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-brand-dark transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className={`mt-4 ${homeSmallPillClass}`}>{scenario.level}</p>
                  <h3 className="mt-3 font-heading text-xl font-bold text-brand-dark">{scenario.name}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">{scenario.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary">
                    <span>{scenario.duration}</span>
                    <span>·</span>
                    <span>{scenario.focus}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
