import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import TutorHeader from '@/features/tutor/components/TutorHeader'
import { TUTOR_SCENARIOS } from '@/features/tutor/lib/scenarios'

export { TUTOR_SCENARIOS as SCENARIOS }

export default function TutorPage() {
  return (
    <div className="home-mobile-optimized landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-5xl space-y-8 pb-12">
        <TutorHeader />

        <section className="grid gap-4 sm:grid-cols-2">
          {TUTOR_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon
            return (
              <Link
                key={scenario.id}
                href={`/tutor/${scenario.id}`}
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className="group block rounded-2xl border-2 border-brand-dark bg-bg-card p-5 shadow-[5px_5px_0_var(--color-brand-dark)] transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-[3px_3px_0_var(--color-brand-dark)] ${scenario.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-brand-dark transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-4 inline-flex rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
                  {scenario.level}
                </p>
                <h2 className="mt-3 font-heading text-xl font-bold text-brand-dark">
                  {scenario.name}
                </h2>
                <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">{scenario.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary">
                  <span>{scenario.duration}</span>
                  <span>·</span>
                  <span>{scenario.focus}</span>
                </div>
              </Link>
            )
          })}
        </section>
      </div>
    </div>
  )
}
