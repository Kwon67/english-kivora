'use client'

import { useEffect, useRef, useState } from 'react'
import { CreditCard, Crown, Loader2 } from 'lucide-react'
import { cancelProSubscriptionAction, createProCheckoutAction } from '@/app/billing-actions'
import type { BillingSummary } from '@/features/billing/lib/billingSummary'
import SectionBadge from '@/components/ui/SectionBadge'
import { notify } from '@/lib/toast'
import {
  settingsIconBox,
  settingsNoteBox,
  settingsPanel,
  settingsSectionHeader,
  settingsSectionTitle,
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
  const autoStarted = useRef(false)
  const isAdmin = summary.access === 'admin'
  const isPro = summary.access === 'pro'

  async function startCheckout() {
    setLoading('checkout')
    const result = await createProCheckoutAction()
    if (!result.ok) {
      setLoading(null)
      notify.error(result.error)
      return
    }
    window.location.assign(result.url)
  }

  async function cancelSubscription() {
    if (!window.confirm('Cancelar agora remove imediatamente o acesso Pro e interrompe cobranças futuras. Deseja continuar?')) return
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
    <section id="subscription" className="scroll-mt-28" aria-labelledby="subscription-title">
      <article className={settingsPanel}>
        <div className={settingsSectionHeader}>
          <span className={`h-11 w-11 shrink-0 ${settingsIconBox}`}>
            <CreditCard className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <SectionBadge label="Plano e cobrança" animate={false} />
            <h2 id="subscription-title" className={`${settingsSectionTitle} mt-3`}>Assinatura</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
              Gerencie seu acesso Pro e as cobranças recorrentes com segurança.
            </p>
          </div>
        </div>

        <div className={`${settingsNoteBox} mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className="flex items-center gap-2 font-heading text-sm font-bold text-brand-dark">
              <Crown className="h-4 w-4" />
              {isAdmin ? 'Acesso administrativo integral' : isPro ? 'Plano Pro' : 'Plano Free'}
            </p>
            <p className="mt-1 font-body text-xs leading-relaxed text-brand-secondary">
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border border-brand-dark bg-brand-accent px-4 font-heading text-sm font-bold text-brand-dark shadow-[3px_3px_0_#1C1915] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === 'checkout' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Assinar Pro
            </button>
          ) : null}

          {!isAdmin && isPro && summary.canCancel ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={cancelSubscription}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border border-brand-dark bg-bg-card px-4 font-heading text-sm font-bold text-brand-dark disabled:opacity-50"
            >
              {loading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cancelar assinatura
            </button>
          ) : null}
        </div>
      </article>
    </section>
  )
}
