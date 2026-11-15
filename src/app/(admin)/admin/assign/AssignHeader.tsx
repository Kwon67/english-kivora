'use client'

import { Send } from 'lucide-react'
import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'
import { primaryBtn } from '@/features/admin/lib/adminUi'

interface AssignHeaderProps {
  groupCount: number
  templateCount: number
  activeRulesCount: number
  questCount: number
}
export default function AssignHeader({ groupCount, templateCount, activeRulesCount, questCount }: AssignHeaderProps) {
  return <AdminSectionHeader
    breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Atribuições' }]} title="Atribuições"
    description="A rotina diária é automática e se adapta às dificuldades de cada membro. Use esta área para complementar o plano, organizar grupos ou programar revisões."
    accentLabel={`${groupCount + templateCount + activeRulesCount + questCount} itens organizados`}
    action={<a href="#assign-form" className={primaryBtn}><Send className="h-4 w-4" />Atribuir tarefa</a>}
  />
}
