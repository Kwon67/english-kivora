'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Home,
  LayoutDashboard,
  Package,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  adminSidebarFooter,
  adminSidebarGeneratorBtn,
  adminSidebarNavLink,
  adminSidebarNavLinkActive,
} from '@/features/admin/lib/adminDashboardUi'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

const navItems = [
  { href: '/home', label: 'Início', icon: Home },
  { href: '/admin/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Membros', icon: Users, match: '/admin/members' },
  { href: '/admin/packs', label: 'Packs', icon: Package },
  { href: '/admin/assign', label: 'Atribuições', icon: UserCheck },
  { href: '/admin/reports', label: 'Relatórios', icon: FileText },
]

function isActive(pathname: string, href: string, match?: string) {
  const target = match || href
  if (target === '/admin/dashboard') return pathname === '/admin/dashboard' || pathname === '/admin'
  if (target === '/admin/members') return pathname.startsWith('/admin/members')
  return pathname === target || pathname.startsWith(`${target}/`)
}

export default function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.href, item.match)
          const transitionTypes =
            item.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              transitionTypes={transitionTypes}
              className={`${adminSidebarNavLink} ${active ? adminSidebarNavLinkActive : ''}`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? 'text-brand-accent' : 'text-brand-secondary group-hover:text-brand-dark'
                }`}
                strokeWidth={2.2}
              />
              <span className="min-w-0 truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={adminSidebarFooter}>
        <Link href="/generate" transitionTypes={navForwardTransitionTypes} className={adminSidebarGeneratorBtn}>
          <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          <span className="min-w-0 truncate">Gerador IA</span>
        </Link>
      </div>
    </>
  )
}