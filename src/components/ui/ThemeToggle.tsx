'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-bg-card text-brand-dark shadow-sm transition-colors hover:bg-bg-primary hover:text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={2.2} /> : <Moon className="h-4 w-4" strokeWidth={2.2} />}
    </button>
  )
}
