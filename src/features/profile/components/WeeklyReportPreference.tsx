'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { Bell } from 'lucide-react'
import { updateWeeklyReportPreferenceAction } from '@/app/actions'
import styles from './Settings.module.css'
import SettingsSwitch from '@/features/profile/components/SettingsSwitch'
import { settingsGroup, settingsRow, settingsRowIcon } from '@/features/profile/lib/settingsPageUi'

type WeeklyReportPreferenceProps = {
  initialEnabled: boolean
  embedded?: boolean
}

export default function WeeklyReportPreference({ initialEnabled, embedded = false }: WeeklyReportPreferenceProps) {
  const lock = useRef(false)
  const feedbackId = useId()
  const [feedback, setFeedback] = useState<{ state: 'success' | 'error'; text: string } | null>(null)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    if (lock.current) return
    lock.current = true
    const previous = enabled
    const next = !previous
    setEnabled(next)
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await updateWeeklyReportPreferenceAction(next)
        if (!result.success) throw new Error(result.error || 'Não foi possível atualizar a preferência.')
        setFeedback({ state: 'success', text: next ? 'Relatório semanal ativado.' : 'Relatório semanal desativado.' })
      } catch {
        setEnabled(previous)
        setFeedback({ state: 'error', text: 'Não foi possível salvar. A preferência anterior foi mantida.' })
      } finally { lock.current = false }
    })
  }

  const content = (
    <div><div className={settingsRow}>
      <span className={settingsRowIcon}>
        <Bell className="h-4 w-4 shrink-0" strokeWidth={1.5} />
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
        aria-describedby={feedback ? feedbackId : undefined}
      />
    </div>
      {feedback && <p id={feedbackId} className={styles.feedback} role={feedback.state === 'error' ? 'alert' : 'status'} data-state={feedback.state}>{feedback.text}</p>}
    </div>
  )

  if (embedded) return content

  return <section className={settingsGroup}>{content}</section>
}