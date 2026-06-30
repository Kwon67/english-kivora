'use client'

import { Bell, ShieldCheck } from 'lucide-react'
import MFAEnrollment from '@/features/auth/components/MFAEnrollment'
import WeeklyReportPreference from '@/features/profile/components/WeeklyReportPreference'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  settingsIconBox,
  settingsNoteBox,
  settingsPanel,
  settingsSectionHeader,
  settingsSectionTitle,
} from '@/features/profile/lib/settingsPageUi'

type MFAFactor = {
  id: string
  status: string
  friendly_name?: string
}

type ProfileAccountSettingsProps = {
  initialWeeklyReportEnabled: boolean
  initialFactors: MFAFactor[]
}

export default function ProfileAccountSettings({
  initialWeeklyReportEnabled,
  initialFactors,
}: ProfileAccountSettingsProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section id="preferences" className="scroll-mt-28" aria-labelledby="preferences-title">
        <article className={settingsPanel}>
          <div className={settingsSectionHeader}>
            <span className={`h-11 w-11 shrink-0 ${settingsIconBox}`}>
              <Bell className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <SectionBadge label="Comunicação" animate={false} />
              <h2 id="preferences-title" className={`${settingsSectionTitle} mt-3`}>
                Preferências
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                Escolha quais atualizações deseja receber sobre sua rotina de estudos.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <WeeklyReportPreference initialEnabled={initialWeeklyReportEnabled} embedded />
          </div>
        </article>
      </section>

      <section id="security" className="scroll-mt-28" aria-labelledby="security-title">
        <article className={settingsPanel}>
          <div className={settingsSectionHeader}>
            <span className={`h-11 w-11 shrink-0 ${settingsIconBox}`}>
              <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <SectionBadge label="Acesso à conta" animate={false} />
              <h2 id="security-title" className={`${settingsSectionTitle} mt-3`}>
                Segurança
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                Proteja seu acesso com uma segunda etapa de verificação.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <MFAEnrollment initialFactors={initialFactors} />
          </div>

          <div className={`${settingsNoteBox} mt-6`}>
            <p className="font-body text-xs leading-relaxed text-brand-secondary">
              O Kivora também aplica limites automáticos contra tentativas repetidas de acesso.
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}