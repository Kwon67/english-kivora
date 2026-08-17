'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { m } from 'framer-motion'
import { landingRadius } from '@/lib/landingStyles'

type Toggle2FAProps = {
  suggestedEnabled?: boolean
}

export default function Toggle2FA({ suggestedEnabled = false }: Toggle2FAProps) {
  const [enabled, setEnabled] = useState(suggestedEnabled)

  return (
    <div
      data-layer="MFA Option (Gamified switch)"
      className={`MfaOptionGamifiedSwitch self-stretch ${landingRadius} border border-brand-dark bg-bg-primary p-3 inline-flex justify-between items-center w-full`}
    >
      <div data-layer="Container" className="Container flex justify-start items-center gap-3">
        <div
          data-layer="Background"
          className={`Background w-8 h-8 ${landingRadius} border border-brand-dark flex justify-center items-center bg-brand-accent`}
        >
          <div data-svg-wrapper data-layer="Container" className="Container">
            <Shield className="h-4 w-4 text-brand-dark" aria-hidden="true" />
          </div>
        </div>
        <div data-layer="Container" className="Container inline-flex flex-col justify-start items-start">
          <div data-layer="Container" className="Container self-stretch flex flex-col justify-start items-start">
            <div data-layer="Text" className="Text justify-center text-sm font-semibold leading-5 text-brand-dark">Verificação de duas etapas</div>
          </div>
          <div data-layer="Container" className="Container self-stretch flex flex-col justify-start items-start">
            <div data-layer="Text" className="Text justify-center text-xs font-medium leading-4 text-brand-secondary">Recomendado para segurança</div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEnabled((current) => !current)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-brand-dark p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 ${enabled ? 'justify-end bg-brand-accent' : 'justify-start bg-brand-border'}`}
        role="switch"
        aria-checked={enabled}
      >
        <m.span
          aria-hidden="true"
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="block h-4 w-4 shrink-0 rounded-full border border-brand-dark bg-bg-card shadow-sm"
        />
      </button>
    </div>
  )
}
