'use client'

import { type CSSProperties, useState } from 'react'
import { verifyMFA } from '@/app/actions'
import { logger } from '@/lib/logger'
import { CheckCircle2, Loader2 } from 'lucide-react'

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
            className="cursor-pointer font-inter text-xs font-semibold leading-5 text-[#425039] dark:text-[#b9c3a4]"
          >
            Código de autenticação
          </label>
          <div
            className="Input self-stretch py-3 px-4 bg-[#f4f5e8]/50 rounded-xl border border-dashed border-[#172113]/24 inline-flex justify-center items-start overflow-hidden w-full transition-all focus-within:border-solid focus-within:border-[#183b16] focus-within:shadow-[0_0_14px_rgba(24,59,22,0.12)] focus-within:bg-[#fbfcf2]/90 dark:bg-[#1a2513]/30 dark:border-[#d5e6a9]/24 dark:focus-within:border-solid dark:focus-within:border-[#b8ff5c] dark:focus-within:bg-[#11160e]/90 dark:focus-within:shadow-[0_0_14px_rgba(184,255,92,0.12)]"
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
              className="w-full appearance-none border-none bg-transparent p-0 text-center font-mono text-2xl font-semibold tracking-[0.42em] text-[var(--color-text)] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
              required
              autoFocus
            />
          </div>
          {error && (
            <div className="w-full overflow-hidden rounded-[0.75rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)] dark:border-red-400/20 dark:bg-red-400/10">
              {error}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-[#183b16] py-3.5 font-montserrat text-lg font-bold leading-7 text-[#f7f8ef] border border-dashed border-[#e3ecc2]/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] transition-colors hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:text-[#050704] dark:border-[#1d2b14]/50 dark:hover:bg-[#cbff83] focus:outline-none focus:ring-2 focus:ring-[#183b16]/40 dark:focus:ring-[#b8ff5c]/40 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || code.length !== 6}
        >
          {loading ? 'Verificando...' : 'Verificar'}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-current" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />
          )}
        </button>

        <p className="w-full text-center font-inter text-xs leading-5 text-[var(--color-text-muted)] mt-1">
          Não tem acesso ao seu autenticador?<br />
          Entre em contato com o administrador.
        </p>
      </form>
    </div>
  )
}
