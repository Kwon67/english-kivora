'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { m } from 'motion/react'

type LoginSubmitButtonProps = {
  loading: boolean
}

export default function LoginSubmitButton({ loading }: LoginSubmitButtonProps) {
  return (
    <m.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.015, translateY: -1 }}
      whileTap={{ scale: 0.985, translateY: 0 }}
      data-testid="login-submit"
      className="ActionButton self-stretch rounded-control border border-brand-dark bg-brand-accent px-6 py-3 inline-flex justify-center items-center gap-2 overflow-hidden w-full cursor-pointer font-heading text-lg font-bold text-brand-dark transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
    >
      <span data-layer="Vamos lá!" className="VamosL text-center justify-center font-heading text-lg font-bold leading-7">
        {loading ? 'Entrando...' : 'Vamos lá!'}
      </span>
      <div data-svg-wrapper data-layer="Container" className="Container flex items-center justify-center text-current">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          <ArrowRight className="h-4 w-4 text-current" aria-hidden="true" />
        )}
      </div>
    </m.button>
  )
}
