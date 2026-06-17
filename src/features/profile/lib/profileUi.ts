export {
  primaryBtn,
  softBtn,
  softKicker,
  selectedPill,
} from '@/lib/brandUi'

export const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-border-muted/20 bg-card shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'

export const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-surface-container-lowest shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]'

export const sectionScrollMt = 'scroll-mt-3 lg:scroll-mt-[7.5rem]'

export const profileField =
  'w-full rounded-xl border border-border-muted/20 bg-card px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all dark:border-border-accent/20 dark:bg-surface-container-low dark:text-text dark:placeholder:text-text-subtle dark:focus:border-primary dark:focus:ring-primary'

export const profileSections = [
  { id: 'identidade', label: 'Identidade' },
  { id: 'conta', label: 'Conta' },
  { id: 'packs', label: 'Meus Packs' },
] as const