import Link from 'next/link'
import { ArrowUpRight, Mail, ShieldCheck, UserRound, Users } from 'lucide-react'
import DeleteMemberButton from '../dashboard/DeleteMemberButton'
import AddMemberModal from '../dashboard/AddMemberModal'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
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
    <div className="space-y-4 animate-fade-in">
      <section className="premium-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
          <div className="p-5 sm:p-6">
            <p className="section-kicker">Gestão da equipe</p>
            <h1 className="mt-4 text-3xl font-black leading-tight text-[var(--color-text)] sm:text-4xl">
              Membros do programa
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              Administre acessos, acompanhe históricos individuais e mantenha a base de alunos organizada.
            </p>
          </div>

          <div className="grid border-t border-[var(--color-border)] bg-[var(--color-surface-container-low)] sm:grid-cols-3 lg:border-l lg:border-t-0">
            <div className="border-b border-[var(--color-border)] p-4 sm:border-b-0 sm:border-r">
              <Users className="h-4 w-4 text-[var(--color-primary)]" />
              <p className="mt-3 text-2xl font-black text-[var(--color-text)]">{totalMembers}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">total</p>
            </div>
            <div className="border-b border-[var(--color-border)] p-4 sm:border-b-0 sm:border-r">
              <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
              <p className="mt-3 text-2xl font-black text-[var(--color-text)]">{adminCount}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">admins</p>
            </div>
            <div className="p-4">
              <UserRound className="h-4 w-4 text-[var(--color-primary)]" />
              <p className="mt-3 text-2xl font-black text-[var(--color-primary)]">{studentCount}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">alunos</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="section-kicker">Membros do ambiente</p>
            <h2 className="mt-3 text-2xl font-black text-[var(--color-text)]">Lista de membros</h2>
          </div>
          <AddMemberModal />
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {members?.map((member: Profile) => (
            <div key={member.id} className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-container-low)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
              <Link
                href={`/admin/members/${member.id}`}
                transitionTypes={navForwardTransitionTypes}
                className="flex items-center gap-3 min-w-0 flex-1 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.8rem] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-black text-[var(--color-primary)]">
                  {member.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">{member.username}</p>
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-[var(--color-text-muted)]">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </p>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                <span className={`inline-flex items-center rounded-[0.65rem] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${
                  member.role === 'admin'
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-container)] text-[var(--color-text-muted)]'
                }`}>
                  {member.role}
                </span>
                <Link
                  href={`/admin/members/${member.id}`}
                  transitionTypes={navForwardTransitionTypes}
                  className="inline-flex items-center gap-1.5 rounded-[0.65rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-container-low)]"
                >
                  Histórico
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                {member.role !== 'admin' && (
                  <DeleteMemberButton userId={member.id} username={member.username || ''} />
                )}
              </div>
            </div>
          ))}

          {(!members || members.length === 0) && (
            <p className="px-6 py-10 text-center text-[var(--color-text-muted)]">Nenhum membro registrado.</p>
          )}
        </div>
      </section>
    </div>
  )
}
