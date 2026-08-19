'use client'

import { Contact } from 'lucide-react'
import type { ReactNode } from 'react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import {
  adminMembersHero,
  adminMembersPill,
  adminMembersSoftBtn,
} from '@/features/admin/lib/adminMembersUi'

interface MembersHeaderProps {
  totalMembers: number
  action?: ReactNode
}

export default function MembersHeader({ totalMembers, action }: MembersHeaderProps) {
  return (
    <header className={`${adminMembersHero} p-5 sm:p-8 lg:p-10`}>
      <div className="relative z-10 min-w-0">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Membros' },
            ]}
            className="mb-3"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className={adminMembersPill}>{totalMembers} cadastrados</span>
          </div>

          <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Membros
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Gerencie acessos, acompanhe presença e abra o histórico individual de cada membro do programa. A
            composição completa da base está logo abaixo.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <a href="#diretorio" className={`${adminMembersSoftBtn} w-full sm:w-auto`}>
              <Contact className="h-4 w-4 shrink-0" />
              Ver diretório
            </a>
            {action ? <div className="w-full sm:w-auto">{action}</div> : null}
          </div>
        </div>

      </div>
    </header>
  )
}