'use client'

import { type CSSProperties, type FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/toast'
import { authInput, authSubmitBtn } from '@/lib/brandUi'

type ForgotPasswordStatus =
  | { type: 'error'; message: string }
  | { type: 'success'; message: string }
  | null

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? 'https://english-kivora.vercel.app'

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function getResetErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() || ''

  if (normalized.includes('email')) {
    return 'Informe um email válido para receber o link de recuperação.'
  }

  return message || 'Não foi possível enviar o link agora. Tente novamente em alguns minutos.'
}

export default function ForgotPasswordFormClient() {
  const [status, setStatus] = useState<ForgotPasswordStatus>(null)
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = normalizeEmail(String(formData.get('email') || ''))

    if (!email.includes('@') || email.length < 6) {
      setLoading(false)
      notify.error('Verifique os campos')
      setStatus({ type: 'error', message: 'Informe um email válido para receber o link de recuperação.' })
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
    })

    setLoading(false)

    if (error) {
      notify.error('Verifique os campos')
      setStatus({ type: 'error', message: getResetErrorMessage(error.message) })
      return
    }

    setStatus({
      type: 'success',
      message: 'Se este email estiver cadastrado, você receberá um link em breve.',
    })
    notify.success('Senha atualizada com sucesso')
  }

  return (
    <form onSubmit={handleSubmit} className="LoginForm flex w-full max-w-96 flex-col items-start justify-start gap-4">
      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="forgot-password-email" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-text-muted dark:text-text-muted">
          Email
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div
            className={`${authInput} px-4`}
          >
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Enter"
              data-testid="forgot-password-email"
              className="w-full border-none bg-transparent p-0 font-inter text-base font-normal outline-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
            />
          </div>
        </div>
      </div>

      {status && (
        <div
          className={`flex w-full items-start gap-3 rounded-[0.75rem] border px-4 py-3 text-sm font-medium ${ status.type === 'success' ? 'border-primary/20 bg-primary-light text-primary dark:bg-primary/10' : 'border-red-200 bg-red-50 text-[var(--color-error)] dark:border-red-400/20 dark:bg-red-400/10' }`}
          data-testid={`forgot-password-${status.type}`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        data-testid="forgot-password-submit"
        className={authSubmitBtn}
      >
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />}
      </button>

      <Link href="/login" className="self-center text-sm font-bold text-primary hover:underline">
        Voltar ao login
      </Link>
    </form>
  )
}
