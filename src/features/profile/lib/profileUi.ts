export const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'

export const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]'

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#183b16] px-5 py-3 font-montserrat text-sm font-bold text-[#f7f8ef] shadow-[0_10px_22px_rgba(24,59,22,0.22)] transition-colors hover:bg-[#24551d] focus:outline-none focus:ring-2 focus:ring-[#183b16]/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]'

export const softBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#172113]/20 bg-[#eef3d6] px-4 py-2.5 text-sm font-bold text-[#183b16] shadow-sm transition-colors hover:bg-[#dfe9bd] dark:border-[#d5e6a9]/20 dark:bg-[#b8ff5c]/8 dark:text-[#b8ff5c] dark:hover:bg-[#b8ff5c]/16'

export const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]'

export const sectionScrollMt = 'scroll-mt-3 lg:scroll-mt-[7.5rem]'

export const profileField =
  'w-full rounded-xl border border-[#172113]/20 bg-[#fbfcf2] px-4 py-3 text-sm text-[#10130f] placeholder:text-[#5a664e] focus:border-[#183b16] focus:outline-none focus:ring-1 focus:ring-[#183b16] transition-all dark:border-[#d5e6a9]/20 dark:bg-[#080b06] dark:text-[#f4f7e9] dark:placeholder:text-[#9ea98b] dark:focus:border-[#b8ff5c] dark:focus:ring-[#b8ff5c]'

export const profileSections = [
  { id: 'identidade', label: 'Identidade' },
  { id: 'conta', label: 'Conta' },
  { id: 'packs', label: 'Meus Packs' },
] as const