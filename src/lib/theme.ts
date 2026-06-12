'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
const THEME_CHANGE_EVENT = 'kivora-theme-change'

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const saved = localStorage.getItem('kivora-theme') as Theme | null
  if (saved) return saved

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getThemeSnapshot(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange)
  window.addEventListener('storage', onStoreChange)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => 'light')

  useEffect(() => {
    const initial = getPreferredTheme()
    applyTheme(initial)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }, [])

  const toggle = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('kivora-theme', next)
    applyTheme(next)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }, [theme])

  return { theme, toggle }
}
