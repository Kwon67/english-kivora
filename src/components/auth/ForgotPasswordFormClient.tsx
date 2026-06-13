'use client'

import { type CSSProperties, type FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/toast'

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
        <label htmlFor="forgot-password-email" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-[#425039] dark:text-[#b9c3a4]">
          Email
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div
            className="Input self-stretch py-3 px-4 bg-[#f4f5e8]/50 rounded-xl border border-dashed border-[#172113]/24 inline-flex justify-center items-start overflow-hidden w-full transition-all focus-within:border-solid focus-within:border-[#183b16] focus-within:shadow-[0_0_14px_rgba(24,59,22,0.12)] focus-within:bg-[#fbfcf2]/90 dark:bg-[#b8ff5c]/8/30 dark:border-[#d5e6a9]/24 dark:focus-within:border-solid dark:focus-within:border-[#b8ff5c] dark:focus-within:bg-[#11160e]/90 dark:focus-within:shadow-[0_0_14px_rgba(184,255,92,0.12)]"
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
          className={`flex w-full items-start gap-3 rounded-[0.75rem] border px-4 py-3 text-sm font-medium ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-[#b8ff5c]/20 dark:bg-[#b8ff5c]/10 dark:text-[#b8ff5c]'
              : 'border-red-200 bg-red-50 text-[var(--color-error)] dark:border-red-400/20 dark:bg-red-400/10'
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
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-[#183b16] py-3.5 font-montserrat text-lg font-bold leading-7 text-[#f7f8ef] border border-dashed border-[#e3ecc2]/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] transition-colors hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:text-[#050704] dark:border-[#b8ff5c]/25/50 dark:hover:bg-[#cbff83] focus:outline-none focus:ring-2 focus:ring-[#183b16]/40 dark:focus:ring-[#b8ff5c]/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />}
      </button>

      <Link href="/login" className="self-center text-sm font-bold text-[var(--color-primary)] hover:underline">
        Voltar ao login
      </Link>
    </form>
  )
}
