'use client'

import { useState } from 'react'
import { verifyMFA } from '@/app/actions'
import { logger } from '@/lib/logger'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface MFAVerificationProps {
  factorId: string
}

export default function MFAVerification({ factorId }: MFAVerificationProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await verifyMFA(factorId, code)
      
      if (result.error) {
        setError(result.error)
      } else {
        logger.info('MFA verified successfully')
        window.location.replace('/home')
      }
    } catch (err: unknown) {
      setError('Erro ao verificar código. Tente novamente.')
      logger.error('MFA Error', { error: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleVerify} className="LoginForm flex w-full flex-col items-start justify-start gap-4">
        <div className="flex w-full flex-col items-start gap-1.5">
          <label
            htmlFor="mfa-code"
            className="cursor-pointer font-body text-sm font-semibold leading-5 text-brand-secondary"
          >
            Código de autenticação
          </label>
          <div
            className="w-full rounded-lg border border-brand-border bg-bg-primary px-4 py-4 transition-colors focus-within:bg-white"
          >
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full appearance-none border-none bg-transparent p-0 text-center font-heading text-2xl font-bold tracking-[0.42em] text-brand-dark outline-none placeholder:text-brand-secondary/50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              required
              autoFocus
            />
          </div>
          {error && (
            <div className="flex w-full items-start gap-3 overflow-hidden rounded-lg border border-brand-border bg-white px-4 py-3 font-body text-sm font-medium text-brand-dark">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-dark px-5 py-3 font-body text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || code.length !== 6}
        >
          {loading ? 'Verificando...' : 'Verificar'}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-current" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />
          )}
        </button>

        <p className="mt-2 w-full text-center font-body text-sm leading-6 text-brand-secondary">
          Não tem acesso ao seu autenticador?<br />
          Entre em contato com o administrador.
        </p>
      </form>
    </div>
  )
}
