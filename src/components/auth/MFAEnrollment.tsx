'use client'

import { useState } from 'react'
import { enrollMFA, verifyMFA, unenrollMFA } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logger } from '@/lib/logger'
import { Shield, ShieldCheck, ShieldAlert, Key } from 'lucide-react'

export default function MFAEnrollment({ initialFactors }: { initialFactors: any[] }) {
  const [factors, setFactors] = useState(initialFactors)
  const [enrollData, setEnrollData] = useState<any>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const hasVerifiedFactor = factors.some(f => f.status === 'verified')

  const startEnroll = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await enrollMFA()
      setEnrollData(data)
    } catch (err: any) {
      setError('Erro ao iniciar cadastro 2FA.')
      logger.error('MFA Enrollment Start Error', { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!enrollData) return
    setLoading(true)
    setError(null)
    try {
      const result = await verifyMFA(enrollData.id, code)
      if (result.error) {
        setError(result.error)
      } else {
        setFactors([...factors, { id: enrollData.id, status: 'verified', friendly_name: 'Authenticator' }])
        setEnrollData(null)
        setCode('')
        logger.info('MFA enrolled successfully')
      }
    } catch (err: any) {
      setError('Erro ao verificar código.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnenroll = async (factorId: string) => {
    if (!confirm('Tem certeza que deseja desativar a verificação em duas etapas?')) return
    setLoading(true)
    try {
      await unenrollMFA(factorId)
      setFactors(factors.filter(f => f.id !== factorId))
      logger.warn('MFA unenrolled')
    } catch (err: any) {
      setError('Erro ao desativar 2FA.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${hasVerifiedFactor ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {hasVerifiedFactor ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
        </div>
        <div>
          <h2 className="text-xl font-bold">Verificação em duas etapas (2FA)</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {hasVerifiedFactor 
              ? 'Sua conta está protegida com uma camada adicional de segurança.' 
              : 'Adicione uma camada extra de segurança para impedir acessos não autorizados.'}
          </p>
        </div>
      </div>

      {!hasVerifiedFactor && !enrollData && (
        <Button onClick={startEnroll} className="btn-primary" disabled={loading}>
          Configurar autenticador
        </Button>
      )}

      {enrollData && (
        <div className="bg-[var(--color-surface-container)] p-6 rounded-[1.5rem] border border-[var(--color-border)] space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-2">
            <p className="text-sm font-bold">1. Escaneie o código QR</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Use um aplicativo como Google Authenticator ou Authy. 
              Como não temos um gerador de QR local, use a chave abaixo:
            </p>
            <div className="bg-white p-3 rounded-lg border font-mono text-xs break-all select-all">
              {enrollData.totp.secret}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold">2. Digite o código de 6 dígitos</p>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center font-mono"
              />
              <Button onClick={handleVerify} disabled={loading || code.length !== 6}>
                Verificar
              </Button>
            </div>
            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          </div>
        </div>
      )}

      {hasVerifiedFactor && (
        <div className="space-y-4">
          {factors.filter(f => f.status === 'verified').map(f => (
            <div key={f.id} className="flex items-center justify-between p-4 border rounded-xl bg-white/50">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-sm font-semibold">Aplicativo Autenticador Ativo</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleUnenroll(f.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                disabled={loading}
              >
                Desativar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
