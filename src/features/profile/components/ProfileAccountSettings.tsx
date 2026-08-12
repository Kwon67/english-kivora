'use client'

import MFAEnrollment from '@/features/auth/components/MFAEnrollment'
import PushNotificationPreference from '@/features/profile/components/PushNotificationPreference'
import WeeklyReportPreference from '@/features/profile/components/WeeklyReportPreference'
import {
  settingsGroup,
  settingsGroupLabel,
  settingsNoteBox,
} from '@/features/profile/lib/settingsPageUi'

type MFAFactor = {
  id: string
  status: string
  friendly_name?: string
}

type ProfileAccountSettingsProps = {
  initialWeeklyReportEnabled: boolean
  initialFactors: MFAFactor[]
  publicVapidKey: string | null
}

export default function ProfileAccountSettings({
  initialWeeklyReportEnabled,
  initialFactors,
  publicVapidKey,
}: ProfileAccountSettingsProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section id="preferences" className="scroll-mt-28 space-y-2.5" aria-labelledby="preferences-title">
        <h2 id="preferences-title" className={settingsGroupLabel}>
          Preferências
        </h2>
        <div className={settingsGroup}>
          <WeeklyReportPreference initialEnabled={initialWeeklyReportEnabled} embedded />
          <PushNotificationPreference publicVapidKey={publicVapidKey} />
        </div>
      </section>

      <section id="security" className="scroll-mt-28 space-y-2.5" aria-labelledby="security-title">
        <h2 id="security-title" className={settingsGroupLabel}>
          Segurança
        </h2>
        <div className={settingsGroup}>
          <MFAEnrollment initialFactors={initialFactors} />
        </div>
        <div className={settingsNoteBox}>
          <p className="font-body text-xs leading-relaxed text-brand-secondary">
            O Kivora também aplica limites automáticos contra tentativas repetidas de acesso.
          </p>
        </div>
      </section>
    </div>
  )
}
