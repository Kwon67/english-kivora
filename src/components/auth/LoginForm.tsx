'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { loginSchema } from '@/lib/schemas'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

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
      body: JSON.stringify({ username, password }),
    })

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; success?: boolean; redirectUrl?: string }
      | null

    if (!response.ok || payload?.error) {
      setError(payload?.error || 'Falha ao entrar')
      setLoading(false)
      return
    }

    if (payload?.success && payload?.redirectUrl) {
      window.location.href = payload.redirectUrl
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-semibold text-[var(--color-text-muted)]">
          Nome de usuário
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="ex: armando"
          data-testid="login-username"
          className="field"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-[var(--color-text-muted)]">
          Senha
        </label>
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
          className="animate-fade-in rounded-[22px] border border-red-200 bg-[linear-gradient(135deg,rgba(255,236,231,0.92),rgba(255,255,255,0.78))] px-4 py-3 text-sm font-medium text-[var(--color-error)]"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        data-testid="login-submit"
        className="btn-primary w-full py-4 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            Acessar dashboard
            <ArrowRight className="h-5 w-5" strokeWidth={2.1} />
          </>
        )}
      </button>
    </form>
  )
}
