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
      className="ActionButton self-stretch py-4 bg-[#183b16] rounded-[32px] border border-dashed border-[#e3ecc2]/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] inline-flex justify-center items-center gap-2 overflow-hidden w-full cursor-pointer hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:border-[#b8ff5c]/25/50 dark:hover:bg-[#cbff83] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#183b16]/40 dark:focus:ring-[#b8ff5c]/40"
    >
      <span data-layer="Vamos lá!" className="VamosL text-center justify-center text-[#f7f8ef] dark:text-[#050704] text-2xl font-bold font-montserrat leading-8">
        {loading ? 'Entrando...' : 'Vamos lá!'}
      </span>
      <div data-svg-wrapper data-layer="Container" className="Container flex items-center justify-center text-[#f7f8ef] dark:text-[#050704]">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="currentColor" />
          </svg>
        )}
      </div>
    </m.button>
  )
}
