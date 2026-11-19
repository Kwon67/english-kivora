import Link from 'next/link'
import LoginFormClient from '@/components/auth/LoginFormClient'
import AuthShell from '@/components/auth/AuthShell'
import { studyReturnPath } from '@/features/auth/lib/studyReturnPath'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmation?: string; next?: string }> }) {
  const { confirmation, next } = await searchParams
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
      {confirmation === 'check' && (
        <p role="status" className="mb-4 rounded-container bg-brand-accent/25 p-3 text-sm text-brand-dark">
          Se você já confirmou seu e-mail, entre com sua senha. Se o link expirou,{' '}
          <Link className="underline" href="/register/confirmacao">solicite outro link de confirmação</Link>.
        </p>
      )}
      <LoginFormClient returnTo={studyReturnPath(next)} />
    </AuthShell>
  )
}
