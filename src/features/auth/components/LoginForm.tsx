'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, HelpCircle, Loader2, X } from 'lucide-react'
import { loginSchema } from '@/lib/schemas'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const startedAtRef = useRef(0)
  const router = useRouter()

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const website = formData.get('website') as string

    const result = loginSchema.safeParse({ username, password })
    if (!result.success) {
      setError(result.error.issues[0].message)
      setLoading(false)
      return
    }

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, website, startedAt: startedAtRef.current }),
    }).catch(() => null)
    const loginResult = response ? await response.json().catch(() => null) : null

    if (!response?.ok || !loginResult?.success) {
      setError(loginResult?.error || 'Falha ao entrar')
      setLoading(false)
      return
    }

    const redirectUrl = typeof loginResult.redirectUrl === 'string' ? loginResult.redirectUrl : '/home'
    router.push(redirectUrl, { transitionTypes: navForwardTransitionTypes })
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <label
          htmlFor="username"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          Usuário ou email
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="armando ou armando@kivora.com"
          data-testid="login-username"
          className="field"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
          >
          Senha
          </label>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-xs font-medium text-[var(--color-primary)] transition-opacity hover:opacity-80"
          >
            Esqueceu a senha?
          </button>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          data-testid="login-password"
          className="field"
        />
      </div>

      {error && (
        <div
          data-testid="login-error"
          className="animate-fade-in rounded-[0.75rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)]"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        data-testid="login-submit"
        className="btn-primary mt-2 w-full py-4 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            Entrar agora
            <ArrowRight className="h-5 w-5" strokeWidth={2.1} />
          </>
        )}
      </button>
    </form>

    {forgotOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false) }}
      >
        <div className="relative w-full max-w-sm rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)]">
          <button
            type="button"
            onClick={() => setForgotOpen(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <HelpCircle className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 id="forgot-password-title" className="text-lg font-semibold text-[var(--color-text)]">
                Recuperação de senha
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">Suporte manual</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            A redefinição de senha ainda não está disponível nesta versão. Entre em contato com o desenvolvedor para solicitar ajuda com sua conta.
          </p>

          <button
            type="button"
            onClick={() => setForgotOpen(false)}
            className="btn-primary mt-6 w-full py-3 text-sm"
          >
            Entendi
          </button>
        </div>
      </div>
    )}
    </>
  )
}
