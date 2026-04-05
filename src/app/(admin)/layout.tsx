import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Package, UserCheck, FileText, BookOpen } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/home')

  const navItems = [
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/packs', label: 'Packs', icon: Package },
    { href: '/admin/assign', label: 'Atribuições', icon: UserCheck },
    { href: '#', label: 'Relatórios', icon: FileText },
  ]

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)]">

      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[var(--color-border)] bg-white flex flex-col p-5">
        <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight mb-10 text-[var(--color-primary)]">
          <BookOpen className="w-6 h-6" strokeWidth={2} />
          <div>
            <span className="text-[var(--color-text)]">Kivora</span>
            <span className="text-[10px] uppercase tracking-widest block text-[var(--color-text-subtle)] -mt-0.5 font-medium">Admin</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] px-3 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                {item.label}
              </a>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--color-border)] bg-white">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Admin Control Center</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--color-text-muted)]">{profile.username}</span>
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-sm font-bold">
              {(profile.username || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
