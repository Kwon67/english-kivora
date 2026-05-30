'use client'

import { useState } from 'react'
import { verifyMFA } from '@/app/actions'
import { logger } from '@/lib/logger'
import { Loader2 } from 'lucide-react'

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
    <div className="w-full max-w-96">
      <div className="mb-6 text-center">
        <h2 className="font-montserrat text-2xl font-bold leading-8 text-zinc-900">
          Verificação em duas etapas
        </h2>
        <p className="mt-2 font-inter text-sm leading-6 text-zinc-500">
          Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex w-full flex-col items-start justify-start gap-6">
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <label
            htmlFor="mfa-code"
            className="self-stretch cursor-pointer font-inter text-sm font-semibold leading-5 text-[var(--color-text)]"
          >
            Código de autenticação
          </label>
          <div
            className="inline-flex w-full items-start justify-center overflow-hidden rounded-[32px] bg-gray-50/20 px-4 py-3.5 outline outline-1 outline-offset-[-1px] transition-all focus-within:bg-white/50 focus-within:outline-2 focus-within:shadow-[0_0_12px_rgba(39,99,86,0.12)]"
            style={{ outlineColor: 'var(--color-border)' }}
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
              className="w-full border-none bg-transparent p-0 text-center font-mono text-2xl font-semibold tracking-[0.42em] text-[var(--color-text)] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:outline-offset-0"
              required
              autoFocus
            />
          </div>
          {error && (
            <div className="w-full overflow-hidden rounded-[0.75rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)]">
              {error}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[32px] bg-emerald-800 py-4 shadow-[0px_8px_15px_0px_rgba(0,0,0,0.10)] transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || code.length !== 6}
        >
          <span className="text-center font-montserrat text-2xl font-bold leading-8 text-white">
            {loading ? 'Verificando...' : 'Verificar'}
          </span>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="white"/>
            </svg>
          )}
        </button>

        <p className="w-full text-center font-inter text-xs leading-5 text-zinc-500">
          Não tem acesso ao seu autenticador?<br />
          Entre em contato com o administrador.
        </p>
      </form>
    </div>
  )
}
