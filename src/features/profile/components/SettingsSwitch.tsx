'use client'

import { Loader2 } from 'lucide-react'

type SettingsSwitchProps = {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  pending?: boolean
  'aria-label'?: string
}

export default function SettingsSwitch({
  checked,
  onChange,
  disabled = false,
  pending = false,
  'aria-label': ariaLabel,
}: SettingsSwitchProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled || pending}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`group relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border border-brand-dark p-0.5 transition-all duration-300 focus:outline-none focus:shadow-[0_0_0_3px_rgba(213,224,107,0.45)] disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? 'justify-end bg-brand-accent' : 'justify-start bg-bg-primary'
      }`}
    >
      <span
        aria-hidden
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-dark bg-bg-card transition-all duration-300 ${
          checked
            ? 'shadow-[2px_2px_0_var(--color-brand-dark)] group-hover:shadow-[1px_1px_0_var(--color-brand-dark)] group-hover:translate-x-px group-hover:translate-y-px'
            : 'shadow-[1px_1px_0_var(--color-brand-dark)]'
        }`}
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin text-brand-dark" /> : null}
      </span>
    </button>
  )
}