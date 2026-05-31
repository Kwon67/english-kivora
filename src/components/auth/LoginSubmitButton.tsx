'use client'

import { Loader2 } from 'lucide-react'
import { m } from 'framer-motion'

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
      className="ActionButton self-stretch py-4 bg-emerald-800 rounded-[32px] shadow-[0px_8px_15px_0px_rgba(0,0,0,0.10)] shadow-[0px_4px_8.5px_0px_rgba(202,202,202,1.00)] inline-flex justify-center items-center gap-2 overflow-hidden w-full cursor-pointer hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-600"
    >
      <span data-layer="Vamos lá!" className="VamosL text-center justify-center text-white text-2xl font-bold font-montserrat leading-8">
        {loading ? 'Entrando...' : 'Vamos lá!'}
      </span>
      <div data-svg-wrapper data-layer="Container" className="Container flex items-center justify-center">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="white" />
          </svg>
        )}
      </div>
    </m.button>
  )
}
