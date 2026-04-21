'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { loginSchema } from '@/lib/schemas'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/client'

const usernameMap: Record<string, string> = {
  armando: 'armando@kivora.com',
  daniel: 'daniel@kivora.com',
}

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

    const email =
      usernameMap[username.toLowerCase()] || (username.includes('@') ? username : `${username}@kivora.com`)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !data.user) {
      setError(signInError?.message || 'Falha ao entrar')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    const redirectUrl = profile?.role === 'admin' ? '/admin/dashboard' : '/home'
    router.push(redirectUrl, { transitionTypes: navForwardTransitionTypes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
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
          <span className="text-xs font-medium text-[var(--color-primary)]">Forgot Password?</span>
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
          className="animate-fade-in rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)]"
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
            Start Learning
            <ArrowRight className="h-5 w-5" strokeWidth={2.1} />
          </>
        )}
      </button>
    </form>
  )
}
