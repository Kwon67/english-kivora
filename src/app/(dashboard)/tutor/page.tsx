import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import TutorHeader from '@/features/tutor/components/TutorHeader'
import { TUTOR_SCENARIOS } from '@/features/tutor/lib/scenarios'
import { homeShellClass } from '@/lib/homeStyles'

export default function TutorPage() {
  return (
    <div className={homeShellClass}>
      <div className="tutor-catalog">
        <TutorHeader />

        <section aria-labelledby="tutor-scenarios">
          <h2 id="tutor-scenarios">Escolha uma conversa</h2>
          <ul className="tutor-scenarios" role="list">
            {TUTOR_SCENARIOS.map(({ id, icon: Icon, name, description, level, duration, focus }) => (
              <li key={id}>
                <Link
                  href={`/tutor/${id}`}
                  transitionTypes={navForwardTransitionTypes}
                  prefetch={false}
                  className="tutor-scenario"
                >
                  <Icon className="tutor-scenario-icon" size={20} aria-hidden="true" />
                  <div className="tutor-scenario-copy">
                    <h3>{name}</h3>
                    <p>{description}</p>
                    <p className="tutor-scenario-focus">{focus}</p>
                  </div>
                  <span className="tutor-scenario-meta">
                    <strong>{level}</strong>
                    <span>{duration}</span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
