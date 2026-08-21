import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { getSubscriptionAlert } from '@/features/billing/lib/subscriptionAlert'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeZone: 'America/Maceio',
  }).format(new Date(value))
}

export default async function SubscriptionAlert() {
  const alert = await getSubscriptionAlert()
  if (!alert) return null

  const grace = alert.kind === 'grace'
  return (
    <aside
      role="status"
      className={`mb-5 flex items-start gap-3 rounded-container border border-brand-dark px-4 py-3 text-sm shadow-[3px_3px_0_#1C1915] ${grace ? 'bg-[#F7C7A6]' : 'bg-brand-accent'}`}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-heading font-bold text-brand-dark">
          {grace ? 'Pagamento pendente' : 'Sua assinatura Pro está próxima da renovação'}
        </p>
        <p className="mt-1 leading-6 text-brand-dark/80">
          {grace
            ? `Regularize o pagamento até ${formatDate(alert.graceDate)} para manter o acesso Pro.`
            : `A próxima cobrança será em ${formatDate(alert.renewalDate)}. Verifique seu método de pagamento.`}
        </p>
      </div>
      <Link href="/settings" className="inline-flex shrink-0 items-center gap-1 font-heading text-xs font-bold underline underline-offset-4">
        Ver assinatura <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </aside>
  )
}

