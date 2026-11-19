import { homeShellClass } from '@/lib/homeStyles'

export const blitzShell = `${homeShellClass} blitz-arena pb-20 sm:pb-10`
export const blitzHeroArena = 'blitz-hero-arena relative'
export const blitzKicker = 'blitz-kicker'
export const blitzSoftBtn = 'blitz-button blitz-button-secondary'
export const blitzPrimaryBtn = 'blitz-button blitz-button-primary w-full sm:w-auto'

export const blitzModeOption = (active: boolean) =>
  `blitz-mode-option ${active ? 'blitz-mode-active' : ''}`
