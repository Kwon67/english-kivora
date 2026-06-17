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
      className="MfaOptionGamifiedSwitch self-stretch p-3 bg-surface/40 rounded-[32px] outline outline-1 outline-offset-[-1px] outline-border-muted/16 inline-flex justify-between items-center w-full bg-primary/8 dark:outline-border-accent/16"
    >
      <div data-layer="Container" className="Container flex justify-start items-center gap-3">
        <div
          data-layer="Background"
          className="Background w-8 h-8 rounded-full flex justify-center items-center bg-primary-container dark:bg-primary/12"
        >
          <div data-svg-wrapper data-layer="Container" className="Container">
            <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 15C4.2625 14.5625 2.82812 13.5656 1.69687 12.0094C0.565625 10.4531 0 8.725 0 6.825V2.25L6 0L12 2.25V6.825C12 8.725 11.4344 10.4531 10.3031 12.0094C9.17188 13.5656 7.7375 14.5625 6 15ZM6 13.425C7.2125 13.05 8.225 12.3094 9.0375 11.2031C9.85 10.0969 10.325 8.8625 10.4625 7.5H6V1.59375L1.5 3.28125V6.825C1.5 6.9625 1.5 7.075 1.5 7.1625C1.5 7.25 1.5125 7.3625 1.5375 7.5H6V13.425Z" fill="currentColor" className="text-primary" />
            </svg>
          </div>
        </div>
        <div data-layer="Container" className="Container inline-flex flex-col justify-start items-start">
          <div data-layer="Container" className="Container self-stretch flex flex-col justify-start items-start">
            <div data-layer="Text" className="Text justify-center text-sm font-semibold font-inter leading-5" style={{ color: 'var(--color-text)' }}>Verificação de duas etapas</div>
          </div>
          <div data-layer="Container" className="Container self-stretch flex flex-col justify-start items-start">
            <div data-layer="Text" className="Text justify-center text-xs font-medium font-inter leading-4" style={{ color: 'var(--color-text-muted)' }}>Recommended for security</div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEnabled((current) => !current)}
        className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:focus:ring-primary/20 ${enabled ? 'bg-primary' : 'bg-primary-container dark:bg-primary/12'}`}
        role="switch"
        aria-checked={enabled}
      >
        <m.div
          className="w-5 h-5 rounded-full bg-card border border-border-muted/20 shadow-sm dark:bg-[#050704] dark:border-border-accent/20"
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          animate={{ x: enabled ? 20 : 0 }}
        />
      </button>
    </div>
  )
}
