'use client'

import { ArrowRight, LoaderCircle } from 'lucide-react'

export default function LoginSubmitButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      data-testid="login-submit"
    >
      <span>{loading ? 'Entrando...' : 'Vamos lá!'}</span>
      <span data-submit-icon aria-hidden="true">
        {loading ? <LoaderCircle size={20} /> : <ArrowRight size={22} />}
      </span>
    </button>
  )
}
