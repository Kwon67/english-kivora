'use client'

import Link from 'next/link'
import { BookOpen, Settings2 } from 'lucide-react'

const areas = [
  {
    href: '/settings',
    label: 'Preferências e segurança',
    description: 'Notificações e acesso à conta',
    icon: Settings2,
    key: 'settings' as const,
  },
  {
    href: '/library',
    label: 'Biblioteca',
    description: 'Packs, pastas e criação',
    icon: BookOpen,
    key: 'library' as const,
  },
]

export default function LibraryAccountNav({ activeArea }: { activeArea: 'settings' | 'library' }) {
  return (
    <nav aria-label="Área da conta" className="grid gap-3 sm:grid-cols-2">
      {areas.map((area) => {
        const Icon = area.icon
        const active = activeArea === area.key

        return (
          <Link
            key={area.href}
            href={area.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[76px] items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all ${
              active
                ? 'border-brand-dark bg-brand-dark text-white shadow-[4px_4px_0_var(--color-brand-accent)]'
                : 'border-brand-dark bg-bg-card text-brand-dark shadow-[4px_4px_0_var(--color-brand-dark)] hover:-translate-y-0.5'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
                active
                  ? 'border-white/20 bg-white/10 text-brand-accent'
                  : 'border-brand-dark bg-brand-accent text-brand-dark'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-sm font-bold">{area.label}</span>
              <span className={`mt-0.5 block font-body text-xs leading-5 ${active ? 'text-white/70' : 'text-brand-secondary'}`}>
                {area.description}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
