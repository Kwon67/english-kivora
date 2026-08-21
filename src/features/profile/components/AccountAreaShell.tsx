import type { ReactNode } from 'react'
import Link from 'next/link'
import { BookOpen, Settings2 } from 'lucide-react'
import { pageBgGlow, pageBgGrid } from '@/lib/pageShellBackground'

const accountAreas = [
  {
    href: '/settings',
    label: 'Preferências e segurança',
    description: 'Notificações e acesso à conta',
    icon: Settings2,
  },
  {
    href: '/library',
    label: 'Biblioteca',
    description: 'Packs, pastas e criação',
    icon: BookOpen,
  },
] as const

type AccountAreaShellProps = {
  activeArea: 'settings' | 'library'
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export default function AccountAreaShell({
  activeArea,
  eyebrow,
  title,
  description,
  action,
  children,
  contentClassName = 'max-w-5xl',
}: AccountAreaShellProps) {
  return (
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-x-clip bg-surface px-4 py-6 pb-14 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-9">
      <div className={pageBgGrid} />
      <div className={pageBgGlow} />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border-muted/14 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-montserrat text-3xl font-bold tracking-tight text-text sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
              {description}
            </p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>

        <nav aria-label="Área da conta" className="mt-5 grid gap-2 sm:grid-cols-2">
          {accountAreas.map((area) => {
            const Icon = area.icon
            const areaKey = area.href.slice(1) as AccountAreaShellProps['activeArea']
            const active = activeArea === areaKey

            return (
              <Link
                key={area.href}
                href={area.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[76px] items-center gap-3 rounded-container border px-4 py-3 transition-colors ${
                  active
                    ? 'border-primary/30 bg-primary text-on-primary shadow-[0_10px_28px_rgba(28, 25, 21,0.18)]'
                    : 'border-border-muted/18 bg-card text-text hover:border-primary/25 hover:bg-primary-light'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  active ? 'bg-white/12 text-on-primary' : 'bg-primary-container text-primary'
                }`}>
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{area.label}</span>
                  <span className={`mt-0.5 block text-xs leading-5 ${
                    active ? 'text-on-primary/75' : 'text-text-subtle'
                  }`}>
                    {area.description}
                  </span>
                </span>
              </Link>
            )
          })}
        </nav>

        <div className={`mx-auto mt-6 w-full ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
