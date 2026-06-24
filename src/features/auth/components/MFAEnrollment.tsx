'use client'

import { useState } from 'react'
import { enrollMFA, verifyMFA, unenrollMFA } from '@/app/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { logger } from '@/lib/logger'
import { ShieldCheck, ShieldAlert, Key } from 'lucide-react'

interface MFAFactor {
  id: string
  status: string
  friendly_name?: string
}



const MFAIllustration = ({ hasVerified }: { hasVerified: boolean }) => (
  <svg
    viewBox="0 0 200 180"
    className="w-full max-w-[160px] h-auto select-none opacity-90 text-primary"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background Circle with gentle scale */}
    <circle cx="100" cy="90" r="70" className={hasVerified ? 'fill-[var(--color-primary)]/5' : 'fill-[var(--color-accent)]/5'} />
    <circle cx="100" cy="90" r="50" className={hasVerified ? 'fill-[var(--color-primary)]/10' : 'fill-[var(--color-accent)]/10'} />
    
    {/* Floating design shapes */}
    <circle cx="45" cy="50" r="5" className="fill-[var(--color-secondary)]/20" />
    <circle cx="160" cy="60" r="6" className="fill-[var(--color-accent)]/30" />
    <path d="M150 130l8-4 4 8-8 4z" className="fill-[var(--color-primary)]/20" />

    {/* Phone Body */}
    <rect x="75" y="30" width="50" height="95" rx="8" className="fill-[var(--color-surface-container-lowest)] stroke-[var(--color-border)]" strokeWidth="3" />
    {/* Phone Screen Elements */}
    <line x1="85" y1="45" x2="115" y2="45" className="stroke-[var(--color-border)]" strokeWidth="2" strokeLinecap="round" />
    <line x1="85" y1="55" x2="105" y2="55" className="stroke-[var(--color-border)]" strokeWidth="2" strokeLinecap="round" />
    <circle cx="100" cy="115" r="4" className="fill-[var(--color-border)]" />

    {/* Floating Shield Check / Alert */}
    <g transform="translate(90, 65)">
      {/* Shield background */}
      <path
        d="M20 0 C30 0, 35 5, 40 10 C40 25, 30 38, 20 45 C10 38, 0 25, 0 10 C5 5, 10 0, 20 0 Z"
        className={hasVerified ? 'fill-[var(--color-primary)]' : 'fill-[var(--color-accent)]'}
        style={{ filter: 'drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.15))' }}
      />
      {/* Shield details */}
      {hasVerified ? (
        <path
          d="M13 22 l5 5 l10 -10"
          className="stroke-[var(--color-on-primary)]"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <g transform="translate(17, 12)">
          <rect x="1.5" y="0" width="3" height="12" rx="1.5" className="fill-[var(--color-surface-container-lowest)]" />
          <circle cx="3" cy="17" r="2" className="fill-[var(--color-surface-container-lowest)]" />
        </g>
      )}
    </g>

    {/* Floating Key */}
    <g transform="translate(48, 85)" className={hasVerified ? 'text-primary' : 'text-text-subtle'}>
      <circle cx="15" cy="15" r="8" stroke="currentColor" strokeWidth="3" className="fill-[var(--color-surface-container-lowest)]" />
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

  const hasVerifiedFactor = factors.some(f => f.status === 'verified')

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
      setFactors(factors.filter(f => f.id !== factorId))
      logger.warn('MFA unenrolled')
    } catch {
      setError('Erro ao desativar 2FA.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`grid gap-6 ${centered ? 'text-center' : ''} md:grid-cols-[1fr_220px] md:items-center md:text-left`}>
      <div className={`space-y-6 ${centered ? 'flex flex-col items-center md:items-stretch' : ''}`}>
        <div className={`flex gap-4 ${centered ? 'flex-col items-center sm:flex-row sm:items-start' : 'items-start'}`}>
          <div className={`p-3.5 rounded-2xl shrink-0 ${hasVerifiedFactor ? 'bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)]' : 'bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)]'}`}>
            {hasVerifiedFactor ? <ShieldCheck className="w-6 h-6" strokeWidth={2.2} /> : <ShieldAlert className="w-6 h-6" strokeWidth={2.2} />}
          </div>
          <div className={centered ? 'max-w-sm' : undefined}>
            <h3 className="text-lg font-bold tracking-tight text-text sm:text-xl">Verificação em duas etapas (2FA)</h3>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-text-muted">
              {hasVerifiedFactor 
                ? 'Sua conta está protegida com uma camada adicional de segurança via autenticador.' 
                : 'Adicione uma camada extra de segurança para impedir acessos não autorizados.'}
            </p>
          </div>
        </div>

        {!hasVerifiedFactor && !enrollData && (
          <button onClick={startEnroll} className="btn-primary py-2.5 px-5 text-xs font-bold uppercase tracking-wider cursor-pointer" disabled={loading}>
            Configurar autenticador
          </button>
        )}

        {enrollData && (
          <div className="bg-[var(--color-surface-container)] p-5 rounded-2xl border border-border space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">1. Escaneie ou use a chave secreta</p>
              <p className="text-xs text-text-muted leading-relaxed">
                Use um aplicativo como Google Authenticator, Microsoft Authenticator ou Authy. 
                Copie a chave de segurança abaixo para cadastrar:
              </p>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-border font-mono text-xs break-all select-all text-primary font-bold text-center tracking-wider">
                {enrollData.totp.secret}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">2. Confirme com o código gerado</p>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="field py-2 px-3 text-center font-mono tracking-[0.25em] text-lg font-bold placeholder:tracking-normal placeholder:font-normal"
                />
                <button 
                  onClick={handleVerify} 
                  disabled={loading || code.length !== 6}
                  className="btn-primary px-6 text-xs font-bold uppercase tracking-wider"
                >
                  Confirmar
                </button>
              </div>
              {error && <p className="text-xs text-[var(--color-error)] font-semibold mt-1">{error}</p>}
            </div>
          </div>
        )}

        {hasVerifiedFactor && (
          <div className={`space-y-3 w-full ${centered ? 'max-w-md' : ''}`}>
            {factors.filter(f => f.status === 'verified').map(f => (
              <div key={f.id} className={`flex items-center justify-between gap-3 p-4 border border-border/80 rounded-xl bg-surface-container-lowest/50 backdrop-blur-sm ${centered ? 'flex-col sm:flex-row' : ''}`}>
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold text-text">Autenticador TOTP Ativo</span>
                </div>
	                <button 
	                  onClick={() => setFactorToDisable(f.id)}
	                  className="text-xs font-bold text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-3 py-1.5 rounded-lg transition-colors border border-[color-mix(in_srgb,var(--color-error)_20%,transparent)] cursor-pointer"
                  disabled={loading}
                >
                  Desativar 2FA
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SVG Illustration Column */}
	      <div className="hidden md:flex items-center justify-center p-4 bg-gradient-to-br from-[var(--color-surface-container-lowest)] to-[var(--color-primary-light)]/20 rounded-2xl border border-border/50 h-full min-h-[180px] self-stretch">
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
