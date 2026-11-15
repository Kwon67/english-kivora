import type { Metadata } from 'next'
import Link from 'next/link'
import ForgotPasswordFormClient from '@/components/auth/ForgotPasswordFormClient'
import AuthShell from '@/components/auth/AuthShell'

export const metadata: Metadata = {
  title: 'Recuperar senha | Kivora English',
  description:
    'Receba um link de recuperação de senha para voltar ao Kivora English.',
}
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="VAMOS AJUDAR VOCÊ"
      title="Recuperar senha"
      description={
        <>
          Lembrou sua senha? <Link href="/login">Entrar</Link>
        </>
      }


    >
      <ForgotPasswordFormClient />
    </AuthShell>
  )
}
