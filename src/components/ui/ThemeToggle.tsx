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
      className="inline-flex h-9 w-9 items-center justify-center rounded-[0.75rem] border border-border bg-surface-container-lowest text-text-muted shadow-sm transition-colors hover:bg-primary-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-surface dark:border-primary/20 dark:bg-primary/12 dark:text-primary dark:hover:bg-primary/20 dark:hover:text-primary-dark dark:focus:ring-offset-surface"
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={2.2} /> : <Moon className="h-4 w-4" strokeWidth={2.2} />}
    </button>
  )
}