'use client'

import { type CSSProperties, type FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
      setStatus({ type: 'error', message: 'Informe um email válido para receber o link de recuperação.' })
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
    })

    setLoading(false)

    if (error) {
      setStatus({ type: 'error', message: getResetErrorMessage(error.message) })
      return
    }

    setStatus({
      type: 'success',
      message: 'Se este email estiver cadastrado, você receberá um link em breve.',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="LoginForm flex w-full max-w-96 flex-col items-start justify-start gap-5">
      <div className="flex w-full flex-col items-start gap-2">
        <label htmlFor="forgot-password-email" className="cursor-pointer font-inter text-sm font-semibold leading-5 text-[var(--color-text)]">
          Email
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div
            className="Input self-stretch py-3.5 pl-10 pr-4 bg-gray-50/20 rounded-[32px] outline outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-center items-start overflow-hidden focus-within:outline-2 w-full transition-all focus-within:shadow-[0_0_12px_rgba(39,99,86,0.12)] focus-within:bg-white/50"
            style={{ outlineColor: 'var(--color-border)' }}
          >
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="learner@example.com"
              data-testid="forgot-password-email"
              className="w-full border-none bg-transparent p-0 font-inter text-base font-normal outline-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
            />
          </div>
          <div className="pointer-events-none absolute left-0 top-0 inline-flex h-12 items-center justify-start pl-3 text-[var(--color-text-subtle)]">
            <Mail className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
      </div>

      {status && (
        <div
          className={`flex w-full items-start gap-3 rounded-[0.75rem] border px-4 py-3 text-sm font-medium ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-[var(--color-error)]'
          }`}
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
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[32px] bg-emerald-800 py-4 font-montserrat text-lg font-bold leading-7 text-white shadow-[0px_8px_15px_0px_rgba(0,0,0,0.10)] transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-5 w-5" strokeWidth={2.3} />}
      </button>

      <Link href="/login" className="self-center text-sm font-bold text-[var(--color-primary)] hover:underline">
        Voltar ao login
      </Link>
    </form>
  )
}
