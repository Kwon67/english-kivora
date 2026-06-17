'use client'

import { type CSSProperties, useState } from 'react'
import { verifyMFA } from '@/app/actions'
import { logger } from '@/lib/logger'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { authErrorAlert, authInput, authSubmitBtn } from '@/lib/brandUi'

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
      <form onSubmit={handleVerify} className="LoginForm flex w-full max-w-96 flex-col items-start justify-start gap-4">
        <div className="flex w-full flex-col items-start gap-1.5">
          <label
            htmlFor="mfa-code"
            className="cursor-pointer font-inter text-xs font-semibold leading-5 text-text-muted dark:text-text-muted"
          >
            Código de autenticação
          </label>
          <div
            className={`${authInput} px-4`}
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
              className="w-full appearance-none border-none bg-transparent p-0 text-center font-mono text-2xl font-semibold tracking-[0.42em] text-text outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
              required
              autoFocus
            />
          </div>
          {error && (
            <div className={`flex w-full items-start gap-3 overflow-hidden rounded-[0.75rem] border px-4 py-3 text-sm font-medium ${authErrorAlert}`}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className={authSubmitBtn}
          disabled={loading || code.length !== 6}
        >
          {loading ? 'Verificando...' : 'Verificar'}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-current" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />
          )}
        </button>

        <p className="w-full text-center font-inter text-xs leading-5 text-text-muted mt-1">
          Não tem acesso ao seu autenticador?<br />
          Entre em contato com o administrador.
        </p>
      </form>
    </div>
  )
}
