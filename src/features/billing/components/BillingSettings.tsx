'use client'

import { useState } from 'react'
import { Crown, Loader2 } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { cancelProSubscriptionAction } from '@/app/billing-actions'
import type { BillingSummary } from '@/features/billing/lib/billingSummary'
import styles from '@/features/profile/components/Settings.module.css'
import { notify } from '@/lib/toast'
import {
  settingsGroup,
  settingsGroupLabel,
  settingsFrostedSurface,
  settingsRow,
  settingsRowIcon,
} from '@/features/profile/lib/settingsPageUi'

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Maceio' }).format(new Date(value))
}

export default function BillingSettings({ summary }: { summary: BillingSummary }) {
  const [cancelPending, setCancelPending] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const isAdmin = summary.access === 'admin'
  const isPro = summary.access === 'pro'

  // window.confirm() saiu: nativo, não estilizado, trava a thread, e o Chrome passa a
  // devolver false direto depois de alguns confirms seguidos na mesma aba — silenciosamente
  // cancelando o cancelamento. Uma ação financeira irreversível merece o mesmo tratamento
  // visual/a11y do resto do app; ConfirmDialog já existe e já é usado em outros lugares.
  async function cancelSubscription() {
    setConfirmingCancel(false)
    setCancelPending(true)
    setCancelError('')
    const result = await cancelProSubscriptionAction()
    setCancelPending(false)
    if (!result.ok) {
      setCancelError(result.error || 'Não foi possível cancelar.')
      return
    }
    notify.success('Assinatura cancelada.')
    window.location.reload()
  }

  return (
    <section id="subscription" className="scroll-mt-28 space-y-2.5" aria-labelledby="subscription-title">
      <h2 id="subscription-title" className={settingsGroupLabel}>
        Assinatura
      </h2>
      <div className={settingsGroup}>
        <div className={`${settingsRow} flex-col items-stretch gap-4 sm:flex-row sm:items-center`}>
          <span className={`${settingsRowIcon} self-start sm:self-center`}>
            <Crown className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-bold text-brand-dark">
              {isAdmin ? 'Acesso administrativo integral' : isPro ? 'Plano Pro' : 'Plano Free'}
            </p>
            <p className="mt-0.5 font-body text-xs leading-relaxed text-brand-secondary">
              {isAdmin
                ? 'Sua conta administrativa possui todos os recursos liberados.'
                : isPro && summary.status === 'past_due'
                  ? `Pagamento pendente${formatDate(summary.gracePeriodEndsAt) ? ` até ${formatDate(summary.gracePeriodEndsAt)}` : ''}.`
                  : isPro
                    ? `Assinatura ativa${formatDate(summary.currentPeriodEnd) ? ` até ${formatDate(summary.currentPeriodEnd)}` : ''}.`
                    : 'As ferramentas de estudo estão disponíveis na sua conta. O upgrade para Pro está indisponível.'}
            </p>
          </div>

          {!isAdmin && isPro && summary.canCancel ? (
            <button
              type="button"
              disabled={cancelPending}
              onClick={() => setConfirmingCancel(true)}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[11px] border border-brand-dark bg-bg-card px-4 font-heading text-sm font-bold text-brand-dark disabled:opacity-50"
            >
              {cancelPending ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
              Cancelar assinatura
            </button>
          ) : null}
        </div>
        {cancelError && <p className={styles.feedback} data-state="error" role="alert">{cancelError}</p>}
      </div>

      {confirmingCancel ? (
        <ConfirmDialog
          title="Cancelar assinatura Pro?"
          description="Cancelar agora remove imediatamente o acesso Pro e interrompe cobranças futuras."
          confirmLabel="Cancelar assinatura"
          cancelLabel="Manter Pro"
          variant="danger"
          surfaceClassName={settingsFrostedSurface}
          onConfirm={cancelSubscription}
          onCancel={() => setConfirmingCancel(false)}
        />
      ) : null}
    </section>
  )
}
