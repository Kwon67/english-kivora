'use client'

import { useState } from 'react'
import { enrollMFA, verifyMFA, unenrollMFA } from '@/app/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { logger } from '@/lib/logger'
import { ShieldCheck, ShieldAlert, Key } from 'lucide-react'
import { profileField } from '@/features/profile/lib/libraryUi'
import {
  settingsPrimaryBtn,
  settingsRow,
  settingsRowIcon,
  settingsSoftBtn,
  settingsTile,
} from '@/features/profile/lib/settingsPageUi'
import { landingRadiusLg } from '@/lib/landingStyles'

interface MFAFactor {
  id: string
  status: string
  friendly_name?: string
}

export default function MFAEnrollment({
  initialFactors,
}: {
  initialFactors: MFAFactor[]
}) {
  const [factors, setFactors] = useState<MFAFactor[]>(initialFactors)
  const [enrollData, setEnrollData] = useState<{ id: string; totp: { secret: string } } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [factorToDisable, setFactorToDisable] = useState<string | null>(null)

  const hasVerifiedFactor = factors.some((f) => f.status === 'verified')

  const startEnroll = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await enrollMFA()
      setEnrollData(data)
    } catch (err: unknown) {
      setError('Erro ao iniciar cadastro 2FA.')
      logger.error('MFA Enrollment Start Error', { error: err instanceof Error ? err.message : String(err) })
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
    } catch {
      setError('Erro ao verificar código.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnenroll = async (factorId: string) => {
    setFactorToDisable(null)
    setLoading(true)
    try {
      await unenrollMFA(factorId)
      setFactors(factors.filter((f) => f.id !== factorId))
      logger.warn('MFA unenrolled')
    } catch {
      setError('Erro ao desativar 2FA.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className={settingsRow}>
        <span className={settingsRowIcon}>
          {hasVerifiedFactor ? (
            <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
          ) : (
            <ShieldAlert className="h-4 w-4" strokeWidth={2.2} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-bold text-brand-dark">Verificação em duas etapas</p>
          <p className="mt-0.5 font-body text-xs leading-relaxed text-brand-secondary">
            {hasVerifiedFactor
              ? 'Ativa — protegida por autenticador.'
              : 'Adicione uma camada extra contra acessos não autorizados.'}
          </p>
        </div>

        {!hasVerifiedFactor && !enrollData ? (
          <button
            type="button"
            onClick={startEnroll}
            className={`${settingsPrimaryBtn} shrink-0 px-4 py-2 text-sm`}
            disabled={loading}
          >
            Configurar
          </button>
        ) : null}
      </div>

      {enrollData && (
        <div className={`${settingsTile} mx-4 mb-4 space-y-4 p-5 sm:mx-5`}>
          <div className="space-y-2">
            <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
              1. Escaneie ou use a chave secreta
            </p>
            <p className="font-body text-xs leading-relaxed text-brand-secondary">
              Use Google Authenticator, Microsoft Authenticator ou Authy. Copie a chave abaixo:
            </p>
            <div className={`${landingRadiusLg} border border-brand-dark bg-bg-primary p-3 text-center font-mono text-xs font-bold tracking-wider text-brand-dark break-all select-all`}>
              {enrollData.totp.secret}
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
              2. Confirme com o código gerado
            </p>
            <div className="flex max-w-sm flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                className={`${profileField} py-2 text-center font-mono text-lg font-bold tracking-[0.25em] placeholder:font-normal placeholder:tracking-normal`}
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                className={`${settingsPrimaryBtn} shrink-0 text-sm`}
              >
                Confirmar
              </button>
            </div>
            {error ? <p className="mt-1 font-body text-xs font-semibold text-[var(--color-error)]">{error}</p> : null}
          </div>
        </div>
      )}

      {hasVerifiedFactor && (
        <div className="mx-4 mb-4 space-y-2 sm:mx-5">
          {factors
            .filter((f) => f.status === 'verified')
            .map((f) => (
              <div
                key={f.id}
                className={`flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between ${landingRadiusLg} border border-brand-dark/20 bg-bg-primary p-4`}
              >
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-brand-dark" />
                  <span className="font-heading text-xs font-bold text-brand-dark sm:text-sm">
                    Autenticador TOTP ativo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFactorToDisable(f.id)}
                  className={`${settingsSoftBtn} border-red-500/30 text-xs text-red-700 hover:bg-red-500/10 hover:text-red-700`}
                  disabled={loading}
                >
                  Desativar 2FA
                </button>
              </div>
            ))}
        </div>
      )}

      {factorToDisable && (
        <ConfirmDialog
          title="Desativar 2FA"
          description="Tem certeza que deseja desativar a verificação em duas etapas?"
          confirmLabel="Desativar"
          variant="warning"
          onCancel={() => setFactorToDisable(null)}
          onConfirm={() => {
            void handleUnenroll(factorToDisable)
          }}
        />
      )}
    </div>
  )
}