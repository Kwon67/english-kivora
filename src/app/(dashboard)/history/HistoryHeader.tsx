import { BarChart3, BookOpen } from 'lucide-react'
import WorkspaceHeading from '@/components/ui/WorkspaceHeading'
import { homeSecondaryButton } from '@/lib/homeStyles'

export default function HistoryHeader({ filterDate }: { filterDate?: string }) {
  return (
    <WorkspaceHeading
      title="Seu histórico"
      breadcrumb="Histórico"
      description={
        filterDate
          ? `Sessões de ${filterDate.split('-').reverse().join('/')}`
          : undefined
      }
      actions={
        <>
          <a href="#graficos" className={homeSecondaryButton}>
            <BarChart3 size={16} /> Gráficos
          </a>
          <a href="#sessoes" className={homeSecondaryButton}>
            <BookOpen size={16} /> Sessões
          </a>
        </>
      }
    />
  )
}
