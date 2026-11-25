import Link from 'next/link'
import LoginFormClient from '@/components/auth/LoginFormClient'
import styles from './Login.module.css'
import StreetScene from '@/components/landing/StreetScene'
import AuthShell from '@/components/auth/AuthShell'
import { studyReturnPath } from '@/features/auth/lib/studyReturnPath'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmation?: string; next?: string }> }) {
  const { confirmation, next } = await searchParams
  return (
    <AuthShell
      className={styles.login}
      formIllustration={<div aria-hidden="true" className={styles.landscape}><StreetScene /></div>}
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
      <div className={styles.social}>
        <p id="social-availability">Login com redes sociais em breve</p>
        <button type="button" disabled aria-describedby="social-availability">
          <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15z"/>
            <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3C9.2 39.5 16.1 44 24 44z"/>
            <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8z"/>
            <path fill="#EA4335" d="M24 12c3 0 5.6 1 7.7 3l5.8-5.8A19.3 19.3 0 0 0 24 4C16.1 4 9.2 8.5 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z"/>
          </svg>
          Entrar com Google
        </button>
        <button type="button" disabled aria-describedby="social-availability">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#1877F2"/>
            <path fill="white" d="M13.7 24v-9.2h3l.5-3.5h-3.5V9.1c0-1 .3-1.7 1.8-1.7h1.9V4.3c-.4-.1-1.6-.2-2.8-.2-2.8 0-4.6 1.7-4.6 4.7v2.5H7v3.5h3V24z"/>
          </svg>
          Entrar com Facebook
        </button>
      </div>
      <details className={styles.emailLogin}>
        <summary>e-mail</summary>
        <LoginFormClient returnTo={studyReturnPath(next)} />
      </details>
    </AuthShell>
  )
}
