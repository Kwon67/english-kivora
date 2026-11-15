import Link from 'next/link'
import LoginFormClient from '@/components/auth/LoginFormClient'
import AuthShell from '@/components/auth/AuthShell'

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="BOM TER VOCÊ DE VOLTA"
      title="Entrar"
      description={
        <>
          Novo no Kivora? <Link href="/register">Criar conta</Link>
        </>
      }


    >
      <LoginFormClient />
    </AuthShell>
  )
}
