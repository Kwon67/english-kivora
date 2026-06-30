'use client'

import { useState } from 'react'
import { m } from 'framer-motion'

type Toggle2FAProps = {
  suggestedEnabled?: boolean
}

export default function Toggle2FA({ suggestedEnabled = false }: Toggle2FAProps) {
  const [enabled, setEnabled] = useState(suggestedEnabled)

  return (
    <div
      data-layer="MFA Option (Gamified switch)"
      className="MfaOptionGamifiedSwitch self-stretch rounded-lg border-2 border-brand-dark bg-bg-primary p-3 inline-flex justify-between items-center w-full"
    >
      <div data-layer="Container" className="Container flex justify-start items-center gap-3">
        <div
          data-layer="Background"
          className="Background w-8 h-8 rounded-lg border border-brand-border flex justify-center items-center bg-brand-accent"
        >
          <div data-svg-wrapper data-layer="Container" className="Container">
            <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 15C4.2625 14.5625 2.82812 13.5656 1.69687 12.0094C0.565625 10.4531 0 8.725 0 6.825V2.25L6 0L12 2.25V6.825C12 8.725 11.4344 10.4531 10.3031 12.0094C9.17188 13.5656 7.7375 14.5625 6 15ZM6 13.425C7.2125 13.05 8.225 12.3094 9.0375 11.2031C9.85 10.0969 10.325 8.8625 10.4625 7.5H6V1.59375L1.5 3.28125V6.825C1.5 6.9625 1.5 7.075 1.5 7.1625C1.5 7.25 1.5125 7.3625 1.5375 7.5H6V13.425Z" fill="currentColor" className="text-brand-dark" />
            </svg>
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
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border border-brand-dark p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 ${enabled ? 'bg-brand-accent' : 'bg-brand-border'}`}
        role="switch"
        aria-checked={enabled}
      >
        <m.span
          aria-hidden="true"
          className="pointer-events-none absolute top-0.5 left-0.5 block h-5 w-5 rounded-full border border-brand-dark bg-bg-card shadow-sm"
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          animate={{ x: enabled ? 20 : 0 }}
        />
      </button>
    </div>
  )
}
