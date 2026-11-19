import Link from 'next/link'
import WorkspaceHeading from '@/components/ui/WorkspaceHeading'
import styles from './History.module.css'

export default function HistoryHeader({ filterDate }: { filterDate?: string }) {
  return (
    <WorkspaceHeading
      title="Seu histórico"
      description={filterDate ? `Sessões de ${filterDate.split('-').reverse().join('/')}` : 'Acompanhe suas sessões, revisões e evolução.'}
      actions={
        <div className={styles.headerActions}>
          <form action="/history#sessoes" className={styles.filter}>
            <label htmlFor="history-date">Data da sessão</label>
            <input key={filterDate ?? 'recent'} id="history-date" name="date" type="date" required defaultValue={filterDate} />
            <button type="submit" className="btn-ghost">Filtrar</button>
            {filterDate && <Link href="/history#sessoes" className="product-text-link">Limpar data</Link>}
          </form>
          <a href="#graficos" className="product-text-link">Gráficos</a>
          <a href="#sessoes" className="product-text-link">Sessões</a>
        </div>
      }
    />
  )
}
