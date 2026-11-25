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
  hasSearch,
}: {
  featuredPack?: PackRow
  hasSearch: boolean
}) {
  return (
    <WorkspaceHeading
      ornament="plane"
      title="Catálogo de lições"
      breadcrumb="Explorar"
      description="Encontre lições por nível ou tema."
      actions={
        <>
          <Link
            href="/home"
            transitionTypes={navForwardTransitionTypes}
            className={homePrimaryButton}
          >
            <BookOpen size={16} /> Plano de hoje
          </Link>
          {hasSearch && <a href="#catalog-search" className={homeSecondaryButton}>
            <List size={16} /> Ir para busca
          </a>}
        </>
      }
      aside={
        featuredPack && (
          <Link
            href={`/explore/pack/${featuredPack.id}`}
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="discovery-featured"
          >
            <span className="discovery-featured-icon">
              <BookOpen size={18} aria-hidden="true" />
            </span>
            <div>
              <p>
                {featuredPack.level
                  ? `Pack em destaque · ${featuredPack.level}`
                  : 'Pack em destaque'}
              </p>
              <strong>{featuredPack.name}</strong>
            </div>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        )
      }
    />
  )
}
