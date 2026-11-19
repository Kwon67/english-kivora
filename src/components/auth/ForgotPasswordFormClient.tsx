'use client'

import HydratedAuthForm from '@/components/auth/HydratedAuthForm'

import { type CSSProperties, type FormEvent, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { requestRecovery } from '@/app/auth/recovery/actions'
import { notify } from '@/lib/toast'
import { authInput, authSubmitBtn } from '@/lib/brandUi'

type ForgotPasswordStatus =
  | { type: 'error'; message: string }
  | { type: 'success'; message: string }
  | null

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export default function ForgotPasswordFormClient() {
  const [status, setStatus] = useState<ForgotPasswordStatus>(null)
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
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

    submitting.current = true
    const sent = await requestRecovery(email).catch(() => false)
    submitting.current = false

    setLoading(false)

    if (!sent) {
      setStatus({ type: 'error', message: 'Não foi possível enviar o link agora. Tente novamente em alguns minutos.' })
      return
    }

    setStatus({
      type: 'success',
      message: 'Se este email estiver cadastrado, você receberá um link em breve.',
    })
  }

  return (
    <HydratedAuthForm onSubmit={handleSubmit} className="LoginForm flex w-full max-w-96 flex-col items-start justify-start gap-4">
      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="forgot-password-email" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-text-muted">
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
              placeholder="voce@exemplo.com"
              data-testid="forgot-password-email"
              className="w-full border-none bg-transparent p-0 font-inter text-base font-normal outline-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
            />
          </div>
        </div>
      </div>

      {status && (
        <div
          role={status.type === 'error' ? 'alert' : 'status'}
          className={`flex w-full items-start gap-3 rounded-[0.75rem] border px-4 py-3 text-sm font-medium ${ status.type === 'success' ? 'border-primary/20 bg-primary-light text-primary' : 'border-error/30 bg-error-soft text-[var(--color-error)]' }`}
          data-testid={`forgot-password-${status.type}`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
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
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={1.5} />}
      </button>

      <Link href="/login" className="self-center text-sm font-bold text-primary hover:underline">
        Voltar ao login
      </Link>
    </HydratedAuthForm>
  )
}
