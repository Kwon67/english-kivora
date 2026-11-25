import Link from 'next/link'
import { ArrowUpRight, Clock3 } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import TutorHeader from '@/features/tutor/components/TutorHeader'
import { TUTOR_SCENARIOS } from '@/features/tutor/lib/scenarios'
import { homeShellClass } from '@/lib/homeStyles'

const groups = [
  { id: 'daily', label: 'Dia a dia' },
  { id: 'work', label: 'Trabalho' },
] as const

export default function TutorPage() {
  return (
    <div className={homeShellClass}>
      <div className="tutor-catalog">
        <TutorHeader />
        <nav className="tutor-index" aria-label="Temas de conversa">
          {groups.map(group => <a key={group.id} href={`#tutor-${group.id}`}>{group.label}</a>)}
        </nav>
        <div className="tutor-groups">
          {groups.map(group => {
            const scenarios = TUTOR_SCENARIOS.filter(scenario => scenario.group === group.id)
            return (
              <section key={group.id} className="tutor-group" id={`tutor-${group.id}`} aria-labelledby={`title-${group.id}`}>
                <header className="tutor-group-heading">
                  <h2 id={`title-${group.id}`}>{group.label}</h2>
                  <span>{scenarios.length} conversas</span>
                </header>
                <ul className="tutor-scenarios" role="list">
                  {scenarios.map(({ id, icon: Icon, name, description, level, duration, focus }) => (
                    <li key={id}>
                      <Link href={`/tutor/${id}`} transitionTypes={navForwardTransitionTypes} prefetch={false} className="tutor-scenario">
                        <Icon className="tutor-scenario-icon" size={20} aria-hidden="true" />
                        <div className="tutor-scenario-copy">
                          <h3>{name}</h3>
                          <p>{description}</p>
                          <p className="tutor-scenario-focus">{focus}</p>
                          <div className="tutor-scenario-meta">
                            <strong><span className="sr-only">Nível </span>{level}</strong>
                            <span><Clock3 size={14} aria-hidden="true" />{duration}</span>
                          </div>
                        </div>
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
