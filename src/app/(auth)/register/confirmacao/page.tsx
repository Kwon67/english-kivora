import Link from 'next/link'
import AuthShell from '@/components/auth/AuthShell'
import ResendConfirmation from '@/components/auth/ResendConfirmation'

export const metadata = { title: 'Confirmação de e-mail | Kivora English' }

export default function ConfirmationPage() {
  return <AuthShell eyebrow="ACESSO À CONTA" title="Confirmar e-mail"
    description="Solicite um novo link se o anterior expirou ou não chegou.">
    <ResendConfirmation />
    <Link href="/login" className="product-text-link">Voltar ao login</Link>
  </AuthShell>
}
