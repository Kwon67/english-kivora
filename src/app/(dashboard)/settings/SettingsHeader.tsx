import { Bell, ShieldCheck, ShieldAlert } from 'lucide-react'
import WorkspaceHeading from '@/components/ui/WorkspaceHeading'
import { homeSecondaryButton } from '@/lib/homeStyles'

type Props = { weeklyReportEnabled: boolean; mfaEnabled: boolean }

export default function SettingsHeader({
  weeklyReportEnabled,
  mfaEnabled,
}: Props) {
  const Shield = mfaEnabled ? ShieldCheck : ShieldAlert
  return (
    <WorkspaceHeading
      title="Preferências e segurança"
      breadcrumb="Configurações"
      actions={
        <>
          <a href="#preferences" className={homeSecondaryButton}>
            <Bell size={16} /> Preferências
          </a>
          <a href="#security" className={homeSecondaryButton}>
            <Shield size={16} /> Segurança
          </a>
        </>
      }
      aside={
        <div className="workspace-summary">
          <span className="workspace-summary-icon">
            <Shield size={22} />
          </span>
          <div>
            <strong>{mfaEnabled ? '2FA ativo' : '2FA desativado'}</strong>
            <p>
              Relatório semanal {weeklyReportEnabled ? 'ativo' : 'desativado'}
            </p>
          </div>
        </div>
      }
    />
  )
}
