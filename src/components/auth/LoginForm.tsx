'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { loginSchema } from '@/lib/schemas'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
          <span className="text-xs font-medium text-[var(--color-primary)]">Esqueceu a senha?</span>
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
  )
}
