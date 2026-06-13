import { ShieldCheck, UserRound, Users } from 'lucide-react'
import AddMemberModal from '../dashboard/AddMemberModal'
import MembersTable from './MembersTable'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MembersPage() {
  const supabase = createAdminClient() ?? await createClient()
  const { data: members, error: membersError } = await supabase.from('profiles').select('*').order('username')

  if (membersError) {
    console.error('Members page query failed', membersError)
    throw new Error('Falha ao carregar os membros do ambiente.')
  }

  const totalMembers = members?.length || 0
  const adminCount = members?.filter((member) => member.role === 'admin').length || 0
  const studentCount = totalMembers - adminCount

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Base de alunos</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Membros do programa
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Administre acessos, histórico individual e organização da base de alunos.
          </p>
        </div>
        <AddMemberModal />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Total',
            value: totalMembers,
            icon: Users,
            accent: 'bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)] border-[var(--color-border)]',
          },
          {
            label: 'Admins',
            value: adminCount,
            icon: ShieldCheck,
            accent: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-light)]',
          },
          {
            label: 'Alunos',
            value: studentCount,
            icon: UserRound,
            accent: 'bg-[var(--color-secondary-container)] text-[var(--color-secondary)] border-[var(--color-secondary-container)]',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--color-border-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{stat.value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${stat.accent}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <MembersTable members={(members ?? []) as Profile[]} />
    </div>
  )
}
