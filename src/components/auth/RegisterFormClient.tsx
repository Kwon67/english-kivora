'use client'

import HydratedAuthForm from '@/components/auth/HydratedAuthForm'

import { type FormEvent, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { requestSignupVerification } from '@/app/signup-actions'
import { SIGNUP_MIN_PASSWORD_LENGTH } from '@/features/auth/lib/signupValidation'
import { landingInputClass , landingRadiusLg} from '@/lib/landingStyles'

function inputShellClass(hasTrailingIcon = false) {
  return [
    `Input self-stretch py-3 inline-flex justify-center items-start overflow-hidden w-full ${landingInputClass}`,
    hasTrailingIcon ? 'pl-4 pr-10' : 'px-4',
  ].join(' ')
}

const submitButtonClass =
  'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-container border border-brand-dark bg-brand-accent px-6 py-3 font-heading text-lg font-bold text-brand-dark transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 disabled:cursor-not-allowed disabled:opacity-50'

const labelClass = 'cursor-pointer text-xs font-semibold leading-5 text-brand-secondary'
const inputClass =
  'w-full border-none bg-transparent p-0 font-body text-base font-normal text-brand-dark outline-none placeholder:text-brand-secondary focus:outline-none focus:ring-0'
const statusBaseClass = 'flex w-full items-start gap-3 rounded-container border px-4 py-3 text-sm font-medium'

export default function RegisterFormClient() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [details, setDetails] = useState({ email: '', username: '' })
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    setError(null)
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username') ?? '')
    const email = String(formData.get('email') ?? '')

    try {
      const result = await requestSignupVerification({
        username,
        email,
        password: String(formData.get('password') ?? ''),
        confirmPassword: String(formData.get('confirmPassword') ?? ''),
        website: String(formData.get('website') ?? ''),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDetails({ username, email })
      setShowPassword(false)
      setShowConfirmPassword(false)
      setAwaitingConfirmation(true)
    } catch {
      setError('Não foi possível enviar o link. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex w-full flex-col gap-4" data-testid="register-success">
        <div role="status" className={`flex w-full items-start gap-3 ${landingRadiusLg} border border-brand-dark bg-brand-accent px-4 py-3 text-sm text-brand-dark`}>
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Confirme seu e-mail</p>
            <p className="mt-1 leading-relaxed">
              Se você acabou de criar uma conta, abra o link de confirmação enviado para
              {' '}<strong className="break-all">{details.email}</strong>. Use este navegador para entrar automaticamente.
            </p>
            <p className="mt-1 leading-relaxed">Já tinha conta? Entre com seu e-mail e senha.</p>
          </div>
        </div>
        <Link href="/login" className={submitButtonClass}>Ir para o login</Link>
        <button
          type="button"
          onClick={() => setAwaitingConfirmation(false)}
          className="inline-flex items-center gap-2 self-start text-sm font-semibold text-brand-secondary hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Corrigir e-mail ou tentar novamente
        </button>
      </div>
    )
  }

  return (
    <HydratedAuthForm onSubmit={handleSubmit} className="LoginForm flex w-full flex-col items-start justify-start gap-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-username" className={labelClass}>
          Nome de usuário (opcional)
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div className={inputShellClass()}>
            <input
              id="register-username"
              name="username"
              defaultValue={details.username}
              minLength={3}
              maxLength={24}
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Seu nome de usuário"
              data-testid="register-username"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-email" className={labelClass}>
          Email
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div className={inputShellClass()}>
            <input
              id="register-email"
              name="email"
              defaultValue={details.email}
              maxLength={254}
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="voce@exemplo.com"
              data-testid="register-email"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-password" className={labelClass}>
          Senha
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div className={inputShellClass(true)}>
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Crie uma senha"
              minLength={SIGNUP_MIN_PASSWORD_LENGTH}
              maxLength={72}
              data-testid="register-password"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-0 top-0 inline-flex h-12 items-center justify-start pr-3 text-brand-secondary hover:text-brand-dark focus:outline-none"
            aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-confirm-password" className={labelClass}>
          Confirmar senha
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div className={inputShellClass(true)}>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Repita sua senha"
              minLength={SIGNUP_MIN_PASSWORD_LENGTH}
              maxLength={72}
              data-testid="register-confirm-password"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute right-0 top-0 inline-flex h-12 items-center justify-start pr-3 text-brand-secondary hover:text-brand-dark focus:outline-none"
            aria-label={showConfirmPassword ? 'Esconder confirmação de senha' : 'Mostrar confirmação de senha'}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-brand-secondary">
        Use uma senha com pelo menos {SIGNUP_MIN_PASSWORD_LENGTH} caracteres.
      </p>
      {error && (
        <div role="alert" className={`${statusBaseClass} border-error/30 bg-error-soft text-[var(--color-error)]`} data-testid="register-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        data-testid="register-submit"
        className={submitButtonClass}
      >
        {loading ? 'Enviando link…' : 'Criar conta'}
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={1.5} />}
      </button>

      <p className="w-full text-center text-xs leading-5 text-brand-secondary">
        Ao continuar, você concorda com os{' '}
        <Link href="/terms" className="font-semibold text-brand-dark underline underline-offset-4">
          Termos de uso
        </Link>{' '}
        e a{' '}
        <Link href="/privacy" className="font-semibold text-brand-dark underline underline-offset-4">
          Privacidade
        </Link>
        .
      </p>
    </HydratedAuthForm>
  )
}
