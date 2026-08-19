'use client'

import { ClipboardList, Send } from 'lucide-react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import {
  adminAssignHero,
  adminAssignPill,
  adminAssignSoftBtn,
} from '@/features/admin/lib/adminAssignUi'

interface AssignHeaderProps {
  groupCount: number
  templateCount: number
  activeRulesCount: number
  questCount: number
}

export default function AssignHeader({
  groupCount,
  templateCount,
  activeRulesCount,
  questCount,
}: AssignHeaderProps) {
  const pipelineLoad = groupCount + templateCount + activeRulesCount + questCount

  return (
    <header className={`${adminAssignHero} p-5 sm:p-8 lg:p-10`}>
      <div className="relative z-10 min-w-0">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Atribuições' },
            ]}
            className="mb-3"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className={adminAssignPill}>{pipelineLoad} itens no pipeline</span>
          </div>

          <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Atribuições
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Despache tarefas, monte grupos, lance missões diárias e configure ciclos de revisão automática para toda a
            operação do programa. Os números completos estão logo abaixo.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <a href="#assign-form" className={`${adminAssignSoftBtn} w-full sm:w-auto`}>
              <Send className="h-4 w-4 shrink-0" />
              Atribuir tarefa
            </a>
            <a href="#grupos" className={`${adminAssignSoftBtn} w-full sm:w-auto`}>
              <ClipboardList className="h-4 w-4 shrink-0" />
              Grupos e missões
            </a>
          </div>
        </div>

      </div>
    </header>
  )
}