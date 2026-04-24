'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
      return saved || 'light'
    }
    return 'light'
  })
  const [mounted, setMounted] = useState(false)

  // Apenas marca como montado para evitar Hydration Mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  // Evita Hydration Mismatch
  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full border border-[rgba(193,200,196,0.3)] bg-transparent" />
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[rgba(193,200,196,0.4)] bg-[var(--color-surface-container-low)] text-[var(--color-primary)] transition-all hover:border-[rgba(70,98,89,0.3)] hover:bg-[var(--color-surface-container-high)]"
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={theme}
          initial={{ y: 10, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -10, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex items-center justify-center"
        >
          {theme === 'light' ? (
            <Moon className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
          ) : (
            <Sun className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
          )}
        </m.div>
      </AnimatePresence>
    </button>
  )
}
