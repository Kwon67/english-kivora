'use client'

import { useState, useTransition } from 'react'
import { Bell } from 'lucide-react'
import { updateWeeklyReportPreferenceAction } from '@/app/actions'
import { notify } from '@/lib/toast'
import SettingsSwitch from '@/features/profile/components/SettingsSwitch'
import { settingsIconBox } from '@/features/profile/lib/settingsPageUi'

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className={`h-10 w-10 shrink-0 ${settingsIconBox}`}>
          <Bell className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
            Notificações
          </p>
          <h3 className="mt-2 font-heading text-base font-bold text-brand-dark sm:text-lg">
            Receber relatório semanal por email
          </h3>
          <p className="mt-1 font-body text-sm leading-relaxed text-brand-secondary">
            Enviado aos domingos com cards estudados, precisão, streak e progresso de nível.
          </p>
        </div>
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

  return <section className="rounded-[13px] border border-brand-dark bg-bg-card p-6 sm:p-8">{content}</section>
}