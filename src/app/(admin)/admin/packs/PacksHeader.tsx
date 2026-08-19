'use client'

import { Layers } from 'lucide-react'
import type { ReactNode } from 'react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import {
  adminPacksHero,
  adminPacksPill,
  adminPacksSoftBtn,
} from '@/features/admin/lib/adminPacksUi'

interface PacksHeaderProps {
  packCount: number
  action?: ReactNode
}

export default function PacksHeader({ packCount, action }: PacksHeaderProps) {
  return (
    <header className={`${adminPacksHero} p-5 sm:p-8 lg:p-10`}>
      <div className="relative z-10 min-w-0">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Packs' },
            ]}
            className="mb-3"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className={adminPacksPill}>{packCount} packs</span>
          </div>

          <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Packs
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Crie packs, importe frases em lote e mantenha a biblioteca com áudio, pastas e níveis CEFR prontos para o
            programa. Os números completos estão logo abaixo.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <a href="#biblioteca" className={`${adminPacksSoftBtn} w-full sm:w-auto`}>
              <Layers className="h-4 w-4 shrink-0" />
              Biblioteca
            </a>
            {action ? <div className="w-full sm:w-auto">{action}</div> : null}
          </div>
        </div>

      </div>
    </header>
  )
}