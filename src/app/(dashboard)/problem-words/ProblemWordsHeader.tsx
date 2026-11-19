import Link from 'next/link'
import { Search, Target } from 'lucide-react'
import WorkspaceHeading from '@/components/ui/WorkspaceHeading'
import { homeSecondaryButton } from '@/lib/homeStyles'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export default function ProblemWordsHeader() {
  return (
    <WorkspaceHeading
      title="Dificuldades"
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
    />
  )
}
