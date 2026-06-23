import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import TutorHeader from '@/features/tutor/components/TutorHeader'
import { TUTOR_SCENARIOS } from '@/features/tutor/lib/scenarios'
import { pageBgGlow, pageBgGrid } from '@/lib/pageShellBackground'

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'

export { TUTOR_SCENARIOS as SCENARIOS }

export default function TutorPage() {
  return (
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-12 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#050704] dark:text-text">
      <div className={pageBgGrid} />
      <div className={pageBgGlow} />

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
                className={`${glassTile} group block p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${scenario.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-text-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className={`${softKicker} mt-4`}>{scenario.level}</p>
                <h2 className="mt-3 font-montserrat text-xl font-bold text-text group-hover:text-primary">
                  {scenario.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{scenario.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-text-subtle">
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