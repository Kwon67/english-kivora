import { homePrimaryButton, homeSecondaryButton, homeShellClass, homeSectionTitleClass } from '@/lib/homeStyles'

export const problemWordsShell = `${homeShellClass} focus-lab pb-20 sm:pb-10`
export const problemWordsSoftBtn = homeSecondaryButton
export const problemWordsPrimaryBtn = `${homePrimaryButton} min-h-11 px-4 py-2.5 text-sm`
export const problemWordsSectionTitle = homeSectionTitleClass
export const problemWordsPanel = 'min-w-0 wrap-anywhere'

export const problemWordsTelemetryBand = 'grid grid-cols-2 gap-x-4 gap-y-3 border-b border-[var(--kivora-line)] pb-4 sm:grid-cols-4'
export const problemWordsTelemetryCell = 'flex min-w-0 flex-col gap-2'
export const problemWordsSearchInput = 'min-h-12 w-full rounded-control border border-[var(--kivora-line)] bg-bg-card px-10 py-3 font-body text-base text-brand-dark placeholder:text-brand-secondary'

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
