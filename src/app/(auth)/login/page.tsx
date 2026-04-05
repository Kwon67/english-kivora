'use client'

import { useState } from 'react'
import { loginAction } from '@/app/actions'
import { loginSchema } from '@/lib/schemas'
import { motion } from 'framer-motion'
import { BookOpen, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.issues[0].message)
      setLoading(false)
      return
    }

    const response = await loginAction(formData)
    if (response?.error) {
      setError(response.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 bg-[var(--color-bg)]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]"
          >
            <BookOpen className="w-8 h-8" strokeWidth={2} />
          </motion.div>
          <h1 className="font-bold tracking-tight text-2xl text-[var(--color-text)]">
            Kivora English
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            Eleve sua proficiência no inglês
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-muted)]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-muted)]">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden rounded-[var(--radius-md)] bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)] border border-red-200"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-[15px] cursor-pointer"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--color-text-subtle)]">
          Kivora Team · Plataforma interna de aprendizado
        </p>
      </motion.div>
    </div>
  )
}
