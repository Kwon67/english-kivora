import Link from 'next/link'
import { Brain, Search, Target } from 'lucide-react'
import WorkspaceHeading from '@/components/ui/WorkspaceHeading'
import { homeSecondaryButton } from '@/lib/homeStyles'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

type Props = { problemCount: number; criticalCount: number }

export default function ProblemWordsHeader({
  problemCount,
  criticalCount,
}: Props) {
  return (
    <WorkspaceHeading
      title="Termos que precisam de atenção"
      breadcrumb="Dificuldades"
      description="Revise os termos que você errou nas sessões recentes."
      actions={
        <>
          <a href="#termos" className={homeSecondaryButton}>
            <Search size={16} /> Ver termos
          </a>
          <Link
            href="/review"
            transitionTypes={navForwardTransitionTypes}
            className={homeSecondaryButton}
          >
            <Target size={16} /> Revisão geral
          </Link>
        </>
      }
      aside={
        <div className="workspace-summary">
          <span className="workspace-summary-icon">
            <Brain size={22} />
          </span>
          <div>
            <strong>
              {problemCount}{' '}
              {problemCount === 1 ? 'termo em foco' : 'termos em foco'}
            </strong>
            <p>{criticalCount} de alta prioridade</p>
          </div>
        </div>
      }
    />
  )
}
