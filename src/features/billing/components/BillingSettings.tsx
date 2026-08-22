'use client'

import { useEffect, useRef, useState } from 'react'
import { Crown, Loader2 } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { cancelProSubscriptionAction, createProCheckoutAction } from '@/app/billing-actions'
import type { BillingSummary } from '@/features/billing/lib/billingSummary'
import { notify } from '@/lib/toast'
import { ANALYTICS_EVENT, trackEvent } from '@/lib/analytics'
import {
  settingsGroup,
  settingsGroupLabel,
  settingsRow,
  settingsRowIcon,
} from '@/features/profile/lib/settingsPageUi'

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Maceio' }).format(new Date(value))
}

export default function BillingSettings({
  summary,
  autoStartCheckout = false,
}: {
  summary: BillingSummary
  autoStartCheckout?: boolean
}) {
  const [loading, setLoading] = useState<'checkout' | 'cancel' | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const autoStarted = useRef(false)
  const isAdmin = summary.access === 'admin'
  const isPro = summary.access === 'pro'

  async function startCheckout() {
    setLoading('checkout')
    trackEvent(ANALYTICS_EVENT.CHECKOUT_STARTED, { access: summary.access })
    const result = await createProCheckoutAction()
    if (!result.ok) {
      setLoading(null)
      notify.error(result.error)
      return
    }
    window.location.assign(result.url)
  }

  // window.confirm() saiu: nativo, não estilizado, trava a thread, e o Chrome passa a
  // devolver false direto depois de alguns confirms seguidos na mesma aba — silenciosamente
  // cancelando o cancelamento. Uma ação financeira irreversível merece o mesmo tratamento
  // visual/a11y do resto do app; ConfirmDialog já existe e já é usado em outros lugares.
  async function cancelSubscription() {
    setConfirmingCancel(false)
    setLoading('cancel')
    const result = await cancelProSubscriptionAction()
    setLoading(null)
    if (!result.ok) {
      notify.error(result.error || 'Não foi possível cancelar.')
      return
    }
    notify.success('Assinatura cancelada.')
    window.location.reload()
  }

  useEffect(() => {
    if (!autoStartCheckout || autoStarted.current || summary.access !== 'free' || !summary.checkoutConfigured) return
    autoStarted.current = true
    void startCheckout()
  }, [autoStartCheckout, summary.access, summary.checkoutConfigured])

  return (
    <section id="subscription" className="scroll-mt-28 space-y-2.5" aria-labelledby="subscription-title">
      <h2 id="subscription-title" className={settingsGroupLabel}>
        Assinatura
      </h2>
      <div className={settingsGroup}>
        <div className={`${settingsRow} flex-col items-stretch gap-4 sm:flex-row sm:items-center`}>
          <span className={`${settingsRowIcon} self-start sm:self-center`}>
            <Crown className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-bold text-brand-dark">
              {isAdmin ? 'Acesso administrativo integral' : isPro ? 'Plano Pro' : 'Plano Free'}
            </p>
            <p className="mt-0.5 font-body text-xs leading-relaxed text-brand-secondary">
              {isAdmin
                ? 'Sua conta administrativa possui todos os recursos liberados.'
                : summary.status === 'past_due'
                  ? `Pagamento pendente${formatDate(summary.gracePeriodEndsAt) ? ` até ${formatDate(summary.gracePeriodEndsAt)}` : ''}.`
                  : isPro
                    ? `Assinatura ativa${formatDate(summary.currentPeriodEnd) ? ` até ${formatDate(summary.currentPeriodEnd)}` : ''}.`
                    : summary.checkoutConfigured
                      ? 'Assine para liberar Tutor IA, Blitz IA e geração de packs.'
                      : 'O checkout será liberado assim que as credenciais da AbacatePay forem configuradas.'}
            </p>
          </div>

          {!isAdmin && !isPro ? (
            <button
              type="button"
              disabled={!summary.checkoutConfigured || loading !== null}
              onClick={startCheckout}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[11px] border border-brand-dark bg-brand-accent px-4 font-heading text-sm font-bold text-brand-dark shadow-offset-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === 'checkout' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Assinar Pro
            </button>
          ) : null}

          {!isAdmin && isPro && summary.canCancel ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => setConfirmingCancel(true)}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[11px] border border-brand-dark bg-bg-card px-4 font-heading text-sm font-bold text-brand-dark disabled:opacity-50"
            >
              {loading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cancelar assinatura
            </button>
          ) : null}
        </div>
      </div>

      {confirmingCancel ? (
        <ConfirmDialog
          title="Cancelar assinatura Pro?"
          description="Cancelar agora remove imediatamente o acesso Pro e interrompe cobranças futuras."
          confirmLabel="Cancelar assinatura"
          cancelLabel="Manter Pro"
          variant="danger"
          onConfirm={cancelSubscription}
          onCancel={() => setConfirmingCancel(false)}
        />
      ) : null}
    </section>
  )
}
