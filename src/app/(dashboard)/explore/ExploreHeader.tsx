import Link from 'next/link'
import { ArrowUpRight, BookOpen, List } from 'lucide-react'
import WorkspaceHeading from '@/components/ui/WorkspaceHeading'
import { homePrimaryButton, homeSecondaryButton } from '@/lib/homeStyles'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
}

export default function ExploreHeader({
  featuredPack,
}: {
  featuredPack?: PackRow
}) {
  return (
    <WorkspaceHeading
      title="Sua trilha de inglês"
      breadcrumb="Explorar"
      description="Veja as lições disponíveis e os próximos níveis da sua trilha."
      actions={
        <>
          <Link
            href="/home"
            transitionTypes={navForwardTransitionTypes}
            className={homePrimaryButton}
          >
            <BookOpen size={16} /> Plano de hoje
          </Link>
          <a href="#packs" className={homeSecondaryButton}>
            <List size={16} /> Ver a trilha
          </a>
        </>
      }
      aside={
        featuredPack && (
          <Link
            href={`/explore/pack/${featuredPack.id}`}
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="workspace-summary workspace-summary-link"
          >
            <span className="workspace-summary-icon">
              <BookOpen size={22} />
            </span>
            <div>
              <p>
                {featuredPack.level
                  ? `Pack em destaque · ${featuredPack.level}`
                  : 'Pack em destaque'}
              </p>
              <strong>{featuredPack.name}</strong>
            </div>
            <ArrowUpRight size={18} />
          </Link>
        )
      }
    />
  )
}
