'use client'

import { useEffect } from 'react'

export default function AuthLightTheme() {
  useEffect(() => {
    const root = document.documentElement
    const originalTheme = root.getAttribute('data-theme')
    root.setAttribute('data-theme', 'light')

    return () => {
      if (originalTheme) {
        root.setAttribute('data-theme', originalTheme)
      } else {
        const saved = localStorage.getItem('theme') || 'light'
        root.setAttribute('data-theme', saved)
      }
    }
  }, [])

  return null
}
