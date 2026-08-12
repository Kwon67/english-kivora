import { landingHeroCardClass, landingRadius } from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeShellClass,
  homeSmallPillClass,
  homeSectionTitleClass,
} from '@/lib/homeStyles'

export const problemWordsShell = `${homeShellClass} focus-lab pb-20 sm:pb-10`

/** Hero — offset shadow only, no macOS chrome */
export const problemWordsHero = `${landingHeroCardClass} focus-hero-shadow relative overflow-hidden rounded-[13px] sm:rounded-[20px]`

export const problemWordsCard = homeCardClass
export const problemWordsTile = `${homeNestedCardClass} p-4 sm:p-6`
export const problemWordsPill = homeSmallPillClass
export const problemWordsSoftBtn = homeSecondaryButton
export const problemWordsPrimaryBtn = `${homePrimaryButton} px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base`
export const problemWordsIconBox = homeIconBox
export const problemWordsSectionTitle = homeSectionTitleClass
export const problemWordsPanel = `${problemWordsCard} p-5 sm:p-7`

export const problemWordsTelemetryBand = `grid grid-cols-2 gap-2 sm:grid-cols-4 ${landingRadius} border border-brand-dark bg-bg-card p-2 sm:gap-3 sm:p-3`

export const problemWordsTelemetryCell = `flex min-w-0 flex-col gap-0.5 ${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5 sm:px-4 sm:py-3`

export const problemWordsSearchInput = `min-h-11 w-full rounded-[13px] border border-brand-dark bg-bg-primary px-10 py-3 font-body text-sm font-medium text-brand-dark outline-none transition-all placeholder:text-brand-secondary focus:bg-white focus:shadow-[4px_4px_0_#D5E06B]`

export const problemWordsWordCard = `${problemWordsCard} problem-word-card overflow-hidden p-4 transition-transform hover:-translate-y-0.5 sm:p-5`

export type ProblemWordSeverity = 'CRÍTICO' | 'MÉDIO' | 'LEVE'

export function getProblemWordSeverity(count: number): ProblemWordSeverity {
  if (count >= 3) return 'CRÍTICO'
  if (count === 2) return 'MÉDIO'
  return 'LEVE'
}

export function getProblemWordSeverityRailClass(severity: ProblemWordSeverity) {
  if (severity === 'CRÍTICO') return 'problem-severity-rail-critical'
  if (severity === 'MÉDIO') return 'problem-severity-rail-medium'
  return 'problem-severity-rail-light'
}

export function getProblemWordSeverityPillClass(severity: ProblemWordSeverity) {
  if (severity === 'CRÍTICO') return 'bg-brand-dark text-white'
  if (severity === 'MÉDIO') return 'bg-brand-accent text-brand-dark'
  return 'bg-bg-primary text-brand-secondary'
}