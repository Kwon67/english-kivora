'use client'

import { useState, useTransition } from 'react'
import { Bell } from 'lucide-react'
import { updateWeeklyReportPreferenceAction } from '@/app/actions'
import { notify } from '@/lib/toast'
import SettingsSwitch from '@/features/profile/components/SettingsSwitch'
import { settingsGroup, settingsRow, settingsRowIcon } from '@/features/profile/lib/settingsPageUi'

type WeeklyReportPreferenceProps = {
  initialEnabled: boolean
  embedded?: boolean
}

export default function WeeklyReportPreference({ initialEnabled, embedded = false }: WeeklyReportPreferenceProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !enabled
    setEnabled(next)

    startTransition(async () => {
      const result = await updateWeeklyReportPreferenceAction(next)

      if (!result.success) {
        setEnabled(!next)
        notify.error(result.error || 'Não foi possível atualizar a preferência.')
        return
      }

      notify.success(next ? 'Relatório semanal ativado.' : 'Relatório semanal desativado.')
    })
  }

  const content = (
    <div className={settingsRow}>
      <span className={settingsRowIcon}>
        <Bell className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-bold text-brand-dark">Relatório semanal por email</p>
        <p className="mt-0.5 font-body text-xs leading-relaxed text-brand-secondary">
          Todo domingo: cards estudados, precisão, streak e nível.
        </p>
      </div>

      <SettingsSwitch
        checked={enabled}
        onChange={handleToggle}
        pending={isPending}
        aria-label="Receber relatório semanal por email"
      />
    </div>
  )

  if (embedded) return content

  return <section className={settingsGroup}>{content}</section>
}