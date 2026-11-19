import WorkspaceHeading from '@/components/ui/WorkspaceHeading'
import styles from '@/features/profile/components/Settings.module.css'

export default function SettingsHeader() {
  return (
    <WorkspaceHeading
      title="Configurações"
      description="Gerencie sua conta, notificações e dados."
      actions={
        <div className={styles.shortcuts}>
          <a href="#preferences" className="product-text-link">Notificações</a>
          <a href="#security" className="product-text-link">Segurança</a>
        </div>
      }
    />
  )
}
