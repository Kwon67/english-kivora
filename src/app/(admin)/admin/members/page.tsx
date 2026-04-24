import Link from 'next/link'
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
    throw new Error('Falha ao carregar os membros do workspace.')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="surface-hero p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="section-kicker">Team management</p>
          <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
            Gerenciamento da Equipe
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Adicione, remova ou visualize o histórico detalhado de cada membro do seu workspace em um ambiente dedicado.
          </p>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 sm:px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Workspace members</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Membros da equipe</h2>
          </div>
          <AddMemberModal />
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {members?.map((member: Profile) => (
            <div key={member.id} className="flex flex-col gap-3 px-4 sm:px-6 py-4 transition-colors hover:bg-[var(--color-surface-container-lowest)]/72 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {/* Avatar + name */}
              <Link
                href={`/admin/members/${member.id}`}
                transitionTypes={navForwardTransitionTypes}
                className="flex items-center gap-3 min-w-0 flex-1 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-bold text-[var(--color-text)]">
                  {member.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{member.username}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{member.email}</p>
                </div>
              </Link>

              {/* Actions row — always visible, wraps on mobile */}
              <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  member.role === 'admin'
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-container)] text-[var(--color-text-muted)]'
                }`}>
                  {member.role}
                </span>
                <Link
                  href={`/admin/members/${member.id}`}
                  transitionTypes={navForwardTransitionTypes}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-container-lowest)]"
                >
                  Ver histórico
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
