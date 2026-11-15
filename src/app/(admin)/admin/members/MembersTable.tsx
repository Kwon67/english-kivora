'use client'

import { WorkspaceList } from '@/components/ui/WorkspacePagination'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Flame, Search, UserRound } from 'lucide-react'
import DeleteMemberButton from '../dashboard/DeleteMemberButton'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  adminMembersDangerAction,
  adminMembersField,
  adminMembersFilterPill,
  adminMembersFilterPillActive,
  adminMembersFilterPillIdle,
  adminMembersMemberAvatar,
  adminMembersPanel,
  adminMembersRowAction,
  adminMembersSectionHeader,
  adminMembersSectionTitle,
  adminMembersStatusPill,
} from '@/features/admin/lib/adminMembersUi'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  formatAppDateTime,
  getAppDateString,
  shiftAppDate,
} from '@/lib/timezone'

/** Minimal admin directory row — no full Profile; email only masked for display. */
export type MemberDirectoryRow = {
  id: string
  username: string
  /** Masked for list UI; full email lives only on the member detail page. */
  emailMasked: string
  role: string
  created_at: string
  last_seen_at: string | null
  currentStreak: number
  longestStreak: number
}

function isRecentlyActive(lastSeenAt: string | null) {
  if (!lastSeenAt) return false
  const threshold = shiftAppDate(getAppDateString(), -7)
  return getAppDateString(new Date(lastSeenAt)) >= threshold
}

const roleFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Admins' },
  { value: 'member', label: 'Alunos' },
] as const

export default function MembersTable({
  members,
}: {
  members: MemberDirectoryRow[]
}) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] =
    useState<(typeof roleFilters)[number]['value']>('all')

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return members.filter((member) => {
      const matchesQuery =
        !normalizedQuery ||
        member.username?.toLowerCase().includes(normalizedQuery) ||
        member.emailMasked?.toLowerCase().includes(normalizedQuery)
      const matchesRole = roleFilter === 'all' || member.role === roleFilter

      return matchesQuery && matchesRole
    })
  }, [members, query, roleFilter])

  return (
    <section
      id="diretorio"
      className={`${adminMembersPanel} member-directory scroll-mt-4`}
    >
      <div className={`${adminMembersSectionHeader} member-directory-heading`}>
        <div>
          <SectionBadge label="Índice de membros" animate={false} />
          <h2 className={`${adminMembersSectionTitle} mt-3`}>
            Diretório completo
          </h2>
          <p className="mt-2 font-body text-sm text-brand-secondary">
            {filteredMembers.length} de {members.length} membro
            {members.length === 1 ? '' : 's'} encontrado
            {filteredMembers.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="member-directory-controls">
          <div className="relative min-w-0 w-full">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary"
              strokeWidth={2}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar membros por nome ou email mascarado"
              placeholder="Buscar nome ou e-mail"
              className={`${adminMembersField} pl-11 pr-4`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {roleFilters.map((filter) => {
              const active = roleFilter === filter.value
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setRoleFilter(filter.value)}
                  aria-pressed={active}
                  className={`${adminMembersFilterPill} ${active ? adminMembersFilterPillActive : adminMembersFilterPillIdle}`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <WorkspaceList
        key={`${query}-${roleFilter}`}
        pageSize={4}
        as="ol"
        className="member-directory-list"
      >
        {filteredMembers.map((member) => {
          const recent = isRecentlyActive(member.last_seen_at)
          return (
            <li key={member.id}>
              <article
                className="member-directory-card"
                aria-label={`Membro ${member.username}`}
              >
                <header className="member-directory-card-heading">
                  <Link
                    href={`/admin/members/${member.id}`}
                    transitionTypes={navForwardTransitionTypes}
                    className="member-directory-identity"
                  >
                    <span className={adminMembersMemberAvatar}>
                      <UserRound className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <strong className="member-directory-name">
                        {member.username}
                      </strong>
                      <span className="member-directory-since">
                        Desde{' '}
                        {formatAppDateTime(member.created_at, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                  </Link>
                  <div className="member-directory-badges">
                    <span
                      className={`${adminMembersStatusPill} bg-primary-light text-brand-dark`}
                    >
                      {member.role === 'admin' ? 'Admin' : 'Aluno'}
                    </span>
                    {recent && (
                      <span className="member-directory-presence">
                        <span aria-hidden />
                        Ativo recentemente
                      </span>
                    )}
                  </div>
                </header>

                <dl className="member-directory-details">
                  <div className="member-directory-email">
                    <dt>E-mail mascarado</dt>
                    <dd>{member.emailMasked || 'Não informado'}</dd>
                  </div>
                  <div>
                    <dt>Último acesso</dt>
                    <dd>
                      {member.last_seen_at
                        ? formatAppDateTime(member.last_seen_at, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Ainda não acessou'}
                    </dd>
                  </div>
                  <div>
                    <dt>Sequência de estudo</dt>
                    <dd className="member-directory-streak">
                      <Flame className="h-4 w-4 shrink-0" aria-hidden />
                      <span>
                        {member.currentStreak}{' '}
                        {member.currentStreak === 1 ? 'dia' : 'dias'}
                        <small>
                          Recorde: {member.longestStreak}{' '}
                          {member.longestStreak === 1 ? 'dia' : 'dias'}
                        </small>
                      </span>
                    </dd>
                  </div>
                </dl>

                <footer className="member-directory-actions">
                  <Link
                    href={`/admin/members/${member.id}`}
                    transitionTypes={navForwardTransitionTypes}
                    className={adminMembersRowAction}
                    aria-label={`Ver perfil e histórico de ${member.username}`}
                  >
                    Ver perfil <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                  {member.role !== 'admin' && (
                    <DeleteMemberButton
                      userId={member.id}
                      username={member.username || ''}
                      buttonClassName={adminMembersDangerAction}
                    />
                  )}
                </footer>
              </article>
            </li>
          )
        })}
      </WorkspaceList>

      {filteredMembers.length === 0 ? (
        <div className="py-14 text-center">
          <p className="font-heading text-base font-bold text-brand-dark">
            Nenhum membro encontrado
          </p>
          <p className="mt-2 font-body text-sm text-brand-secondary">
            Ajuste a busca ou os filtros para ver outros resultados.
          </p>
        </div>
      ) : null}
    </section>
  )
}
