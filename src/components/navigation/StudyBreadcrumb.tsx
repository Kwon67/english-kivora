import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

type BreadcrumbItem = {
  label: string
  href?: string
}

type StudyBreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

export default function StudyBreadcrumb({ items, className = '' }: StudyBreadcrumbProps) {
  return (
    <nav aria-label="Navegação estrutural" className={className}>
      <ol className="workspace-breadcrumb flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-subtle" aria-hidden="true" />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  transitionTypes={item.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                  className="font-bold text-text-muted transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="font-bold text-text">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
