import { homeShellClass } from '@/lib/homeStyles'

export const blitzShell = `${homeShellClass} blitz-arena pb-20 sm:pb-10`
export const blitzHeroArena = 'blitz-hero-arena relative'
export const blitzCard = 'blitz-panel'
export const blitzTile = 'blitz-tile p-4'
export const blitzKicker = 'blitz-kicker'
export const blitzSoftBtn = 'blitz-button blitz-button-secondary'
export const blitzIconBox = 'blitz-icon'
export const blitzPrimaryBtn = 'blitz-button blitz-button-primary w-full sm:w-auto'
export const blitzNestedRow = 'blitz-list-row flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4'
export const blitzScoreTicker = 'blitz-score-ticker grid grid-cols-2 gap-3 p-3 sm:p-4'
export const blitzModeSwitch = 'blitz-mode-switch grid w-full grid-cols-2 gap-1 p-1 sm:max-w-md'

export const blitzModeOption = (active: boolean) =>
  `blitz-mode-option ${active ? 'blitz-mode-active' : ''}`
