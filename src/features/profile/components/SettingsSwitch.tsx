'use client'

import { Loader2 } from 'lucide-react'
import styles from './Settings.module.css'

type SettingsSwitchProps = {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  pending?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}

export default function SettingsSwitch({
  checked,
  onChange,
  disabled = false,
  pending = false,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
}: SettingsSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => { if (!pending) onChange() }}
      disabled={disabled}
      aria-disabled={pending || undefined}
      aria-busy={pending}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      className={styles.switch}
      data-checked={checked}
    >
      <span aria-hidden="true" className={styles.thumb}>
        {pending && <Loader2 className="size-3 animate-spin motion-reduce:animate-none" />}
      </span>
    </button>
  )
}
