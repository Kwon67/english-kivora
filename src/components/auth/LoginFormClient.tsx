'use client'

import HydratedAuthForm from '@/components/auth/HydratedAuthForm'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import EmailInput from '@/components/auth/EmailInput'
import LoginSubmitButton from '@/components/auth/LoginSubmitButton'
import PasswordInput from '@/components/auth/PasswordInput'
import { loginSchema } from '@/lib/schemas'

const loginDestinations = ['/home', '/login/mfa', '/admin/dashboard', '/onboarding']

export default function LoginFormClient({ returnTo = null }: { returnTo?: string | null }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const startedAtRef = useRef(0)
  const isRedirectingRef = useRef(false)
  const submitInFlightRef = useRef(false)

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitInFlightRef.current || isRedirectingRef.current) {
      return
    }

    submitInFlightRef.current = true
    setError(null)
    setLoading(true)

    try {
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
        signal: AbortSignal.timeout(45_000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          website,
          startedAt: startedAtRef.current,
        }),
      }).catch(() => null)
      const loginResult = response
        ? await response.json().catch(() => null)
        : null

      if (!response?.ok || loginResult?.success !== true || !loginDestinations.includes(loginResult.redirectUrl)) {
        if (isRedirectingRef.current) return
        setError(typeof loginResult?.error === 'string' ? loginResult.error : 'Não foi possível confirmar o login. Verifique a conexão e tente novamente.')
        setLoading(false)
        return
      }

      let redirectUrl = loginResult.redirectUrl
      if (returnTo && redirectUrl === '/home') redirectUrl = returnTo
      if (returnTo && redirectUrl === '/login/mfa') redirectUrl += '?next=' + encodeURIComponent(returnTo)

      isRedirectingRef.current = true
      setError(null)
      window.location.replace(redirectUrl)
    } finally {
      if (!isRedirectingRef.current) {
        submitInFlightRef.current = false
      }
    }
  }

  return (
    <>
      <HydratedAuthForm
        onSubmit={handleSubmit}
        className="LoginForm w-full flex flex-col justify-start items-start gap-4"
      >
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div className="w-full">
          <EmailInput />
        </div>

        <div className="w-full">
          <PasswordInput />
        </div>

        {error && (
          <div
            role="alert"
            data-testid="login-error"
            className="flex w-full items-start gap-3 rounded-container border border-error/20 bg-error-soft px-4 py-3 text-sm font-medium text-error"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        )}

        <div className="w-full mt-2">
          <LoginSubmitButton loading={loading} />
        </div>

        <div className="w-full mt-4">
          <p className="text-center text-xs leading-5 text-brand-secondary w-full">
            Ao entrar, você concorda com os{' '}
            <Link
              href="/terms" prefetch={false}
              className="font-semibold text-brand-dark underline underline-offset-4"
            >
              Termos de uso
            </Link>{' '}
            e a{' '}
            <Link
              href="/privacy" prefetch={false}
              className="font-semibold text-brand-dark underline underline-offset-4"
            >
              Privacidade
            </Link>
            .
          </p>
        </div>
      </HydratedAuthForm>
    </>
  )
}
