import GenerateClient from '@/features/ai/components/GenerateClient'
import styles from '@/features/ai/components/Generate.module.css'
import GenerateHeader from './GenerateHeader'

export const maxDuration = 60

export const metadata = {
  title: 'Gerador IA',
  description: 'Gere packs de vocabulário com IA, revise a prévia e salve com áudio neural.',
}

export default function GeneratePage() {
  return (
    <div className={styles.shell}>
      <GenerateHeader />
      <GenerateClient />
    </div>
  )
}
