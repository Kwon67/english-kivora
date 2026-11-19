import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import styles from '@/features/ai/components/Generate.module.css'

export default function GenerateHeader() {
  return (
    <header className={styles.header}>
      <StudyBreadcrumb items={[{ label: 'Início', href: '/home' }, { label: 'Gerador IA' }]} />
      <h1>Gerador IA</h1>
      <p>Gere frases em inglês com tradução. Revise a prévia antes de salvar o pack com áudio.</p>
    </header>
  )
}
