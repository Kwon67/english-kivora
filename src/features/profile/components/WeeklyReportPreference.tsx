'use client'

import { useState, useTransition } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { updateWeeklyReportPreferenceAction } from '@/app/actions'
import { notify } from '@/lib/toast'

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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary dark:bg-primary/12">
          <Bell className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-subtle dark:text-text-subtle">
            Notificações
          </p>
          <h3 className="mt-2 text-base font-bold text-text dark:text-text">
            Receber relatório semanal por email
          </h3>
          <p className="mt-1 text-sm leading-6 text-text-muted dark:text-text-muted">
            Enviado aos domingos com cards estudados, precisão, streak e progresso de nível.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        role="switch"
        aria-checked={enabled}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60 ${ enabled ? 'bg-primary' : 'bg-[#d8dcc8] dark:bg-[#1a1f16]' }`}
      >
        <span
          className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${ enabled ? 'translate-x-6' : 'translate-x-1' }`}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : null}
        </span>
      </button>
    </div>
  )

  if (embedded) return content

  return <section className="premium-card p-6 sm:p-8">{content}</section>
}
