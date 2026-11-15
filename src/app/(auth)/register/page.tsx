import type { Metadata } from 'next'
import Link from 'next/link'
import RegisterFormClient from '@/components/auth/RegisterFormClient'
import AuthShell from '@/components/auth/AuthShell'

export const metadata: Metadata = {
  title: 'Criar conta | Kivora English',
  description:
    'Crie sua conta gratuita no Kivora English para começar sua rotina de estudos.',
}
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const params = await searchParams
  return (
    <AuthShell
      eyebrow="SUA JORNADA COMEÇA AQUI"
      title="Criar conta"
      description={
        <>
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </>
      }


    >
      <RegisterFormClient intentPro={params.plan === 'pro'} />
    </AuthShell>
  )
}
