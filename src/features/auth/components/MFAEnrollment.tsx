'use client'

import { useState } from 'react'
import { enrollMFA, verifyMFA, unenrollMFA } from '@/app/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { logger } from '@/lib/logger'
import { ShieldCheck, ShieldAlert, Key } from 'lucide-react'
import { profileField } from '@/features/profile/lib/libraryUi'
import {
  settingsIconBox,
  settingsPrimaryBtn,
  settingsSoftBtn,
  settingsTile,
} from '@/features/profile/lib/settingsPageUi'
import { landingRadius } from '@/lib/landingStyles'

interface MFAFactor {
  id: string
  status: string
  friendly_name?: string
}

const MFAIllustration = ({ hasVerified }: { hasVerified: boolean }) => (
  <svg
    viewBox="0 0 200 180"
    className="h-auto w-full max-w-[160px] select-none text-brand-dark"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="100" cy="90" r="70" className={hasVerified ? 'fill-brand-dark/5' : 'fill-brand-accent/20'} />
    <circle cx="100" cy="90" r="50" className={hasVerified ? 'fill-brand-dark/10' : 'fill-brand-accent/30'} />
    <circle cx="45" cy="50" r="5" className="fill-brand-secondary/20" />
    <circle cx="160" cy="60" r="6" className="fill-brand-accent/40" />
    <path d="M150 130l8-4 4 8-8 4z" className="fill-brand-dark/15" />
    <rect x="75" y="30" width="50" height="95" rx="8" className="fill-bg-card stroke-brand-dark/30" strokeWidth="3" />
    <line x1="85" y1="45" x2="115" y2="45" className="stroke-brand-dark/25" strokeWidth="2" strokeLinecap="round" />
    <line x1="85" y1="55" x2="105" y2="55" className="stroke-brand-dark/25" strokeWidth="2" strokeLinecap="round" />
    <circle cx="100" cy="115" r="4" className="fill-brand-dark/25" />
    <g transform="translate(90, 65)">
      <path
        d="M20 0 C30 0, 35 5, 40 10 C40 25, 30 38, 20 45 C10 38, 0 25, 0 10 C5 5, 10 0, 20 0 Z"
        className={hasVerified ? 'fill-brand-dark' : 'fill-brand-accent'}
        style={{ filter: 'drop-shadow(0px 4px 10px rgba(28, 25, 21, 0.12))' }}
      />
      {hasVerified ? (
        <path
          d="M13 22 l5 5 l10 -10"
          className="stroke-white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <g transform="translate(17, 12)">
          <rect x="1.5" y="0" width="3" height="12" rx="1.5" className="fill-bg-card" />
          <circle cx="3" cy="17" r="2" className="fill-bg-card" />
        </g>
      )}
    </g>
    <g transform="translate(48, 85)" className={hasVerified ? 'text-brand-dark' : 'text-brand-secondary'}>
      <circle cx="15" cy="15" r="8" stroke="currentColor" strokeWidth="3" className="fill-bg-card" />
      <path d="M22 13.5h14v3h-3v2h-2.5v-2H28v2h-2.5v-2h-3.5z" fill="currentColor" />
    </g>
  </svg>
)

export default function MFAEnrollment({
  initialFactors,
  centered = false,
}: {
  initialFactors: MFAFactor[]
  centered?: boolean
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

  const statusIconClass = hasVerifiedFactor
    ? 'border border-brand-dark/20 bg-brand-accent/50 text-brand-dark'
    : 'border border-brand-dark/20 bg-bg-primary text-brand-secondary'

  return (
    <div className={`grid gap-6 ${centered ? 'text-center' : ''} md:grid-cols-[1fr_200px] md:items-start md:text-left`}>
      <div className={`space-y-6 ${centered ? 'flex flex-col items-center md:items-stretch' : ''}`}>
        <div className={`flex gap-4 ${centered ? 'flex-col items-center sm:flex-row sm:items-start' : 'items-start'}`}>
          <span className={`h-11 w-11 shrink-0 p-0 ${settingsIconBox} ${statusIconClass}`}>
            {hasVerifiedFactor ? (
              <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
            ) : (
              <ShieldAlert className="h-5 w-5" strokeWidth={2.2} />
            )}
          </span>
          <div className={centered ? 'max-w-sm' : 'min-w-0'}>
            <h3 className="font-heading text-lg font-bold text-brand-dark sm:text-xl">
              Verificação em duas etapas (2FA)
            </h3>
            <p className="mt-1.5 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
              {hasVerifiedFactor
                ? 'Sua conta está protegida com uma camada adicional de segurança via autenticador.'
                : 'Adicione uma camada extra de segurança para impedir acessos não autorizados.'}
            </p>
          </div>
        </div>

        {!hasVerifiedFactor && !enrollData && (
          <button
            type="button"
            onClick={startEnroll}
            className={`${settingsPrimaryBtn} cursor-pointer text-sm`}
            disabled={loading}
          >
            Configurar autenticador
          </button>
        )}

        {enrollData && (
          <div className={`${settingsTile} space-y-4 p-5`}>
            <div className="space-y-2">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                1. Escaneie ou use a chave secreta
              </p>
              <p className="font-body text-xs leading-relaxed text-brand-secondary">
                Use Google Authenticator, Microsoft Authenticator ou Authy. Copie a chave abaixo:
              </p>
              <div className={`${landingRadius} border border-brand-dark bg-bg-primary p-3 text-center font-mono text-xs font-bold tracking-wider text-brand-dark break-all select-all`}>
                {enrollData.totp.secret}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
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
          <div className={`w-full space-y-3 ${centered ? 'max-w-md' : ''}`}>
            {factors
              .filter((f) => f.status === 'verified')
              .map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center justify-between gap-3 ${landingRadius} border border-brand-dark/20 bg-bg-primary p-4 ${
                    centered ? 'flex-col sm:flex-row' : ''
                  }`}
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
      </div>

      <div className={`${settingsTile} hidden min-h-[180px] items-center justify-center self-stretch p-4 md:flex`}>
        <MFAIllustration hasVerified={hasVerifiedFactor} />
      </div>

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