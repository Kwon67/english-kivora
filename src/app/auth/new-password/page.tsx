import { cookies } from 'next/headers'
import AuthShell from '@/components/auth/AuthShell'
import NewPasswordForm from './form'

export default async function NewPasswordPage() {
  const jar = await cookies()
  return <AuthShell eyebrow="CONTA" title="Definir nova senha" description="Recuperação de acesso ao Kivora">
    <NewPasswordForm hasTicket={jar.has('kv-recovery-ticket')} />
  </AuthShell>
}
