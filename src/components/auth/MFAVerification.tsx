'use client'

import { useState } from 'react'
import { verifyMFA } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

interface MFAVerificationProps {
  factorId: string
}

export default function MFAVerification({ factorId }: MFAVerificationProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        router.push('/home')
      }
    } catch (err: unknown) {
      setError('Erro ao verificar código. Tente novamente.')
      logger.error('MFA Error', { error: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-bold">Verificação em duas etapas</h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="field text-center text-2xl tracking-[0.5em] font-mono h-14"
            required
            autoFocus
          />
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        </div>

        <button 
          type="submit" 
          className="w-full h-12 btn-primary" 
          disabled={loading || code.length !== 6}
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </form>
    </div>
  )
}
