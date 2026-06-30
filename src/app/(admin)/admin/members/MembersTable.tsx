'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Flame, Search } from 'lucide-react'
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
import { homeIconGlyphSm } from '@/lib/homeStyles'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { formatAppDateTime, getAppDateString, shiftAppDate } from '@/lib/timezone'
import type { Profile } from '@/types/database.types'

export type MemberDirectoryRow = Profile & {
  currentStreak: number
  longestStreak: number
}

function getInitial(username: string | null | undefined) {
  return username?.trim().charAt(0).toUpperCase() || '?'
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

export default function MembersTable({ members }: { members: MemberDirectoryRow[] }) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<(typeof roleFilters)[number]['value']>('all')

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return members.filter((member) => {
      const matchesQuery =
        !normalizedQuery ||
        member.username?.toLowerCase().includes(normalizedQuery) ||
        member.email?.toLowerCase().includes(normalizedQuery)
      const matchesRole = roleFilter === 'all' || member.role === roleFilter

      return matchesQuery && matchesRole
    })
  }, [members, query, roleFilter])

  return (
    <section id="diretorio" className={`${adminMembersPanel} scroll-mt-4`}>
      <div className={adminMembersSectionHeader}>
        <div>
          <SectionBadge label="Índice de membros" animate={false} />
          <h2 className={`${adminMembersSectionTitle} mt-3`}>Diretório completo</h2>
          <p className="mt-2 font-body text-sm text-brand-secondary">
            {filteredMembers.length} de {members.length} membro{members.length === 1 ? '' : 's'} visíveis
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto">
          <div className="relative w-full lg:min-w-[260px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" strokeWidth={2} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou email"
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
                  className={`${adminMembersFilterPill} ${active ? adminMembersFilterPillActive : adminMembersFilterPillIdle}`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pt-5">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-dark/15 bg-bg-primary font-heading text-[10px] font-bold uppercase tracking-[0.1em] text-brand-secondary">
              <th className="px-4 py-3 sm:px-5">Membro</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3 text-center">Streak</th>
              <th className="px-3 py-3">Último acesso</th>
              <th className="px-3 py-3">Papel</th>
              <th className="px-4 py-3 text-right sm:px-5">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-dark/10">
            {filteredMembers.map((member) => {
              const recent = isRecentlyActive(member.last_seen_at)

              return (
                <tr key={member.id} className="group relative transition-colors hover:bg-bg-primary/80">
                  <td className="admin-member-index px-4 py-3 sm:px-5">
                    <Link
                      href={`/admin/members/${member.id}`}
                      transitionTypes={navForwardTransitionTypes}
                      className="flex items-center gap-3"
                    >
                      <span className={`${adminMembersMemberAvatar} transition-transform group-hover:scale-105`}>
                        {getInitial(member.username)}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="font-heading font-bold text-brand-dark transition-colors group-hover:text-brand-secondary">
                            {member.username}
                          </span>
                          {recent ? (
                            <span className="inline-flex h-2 w-2 rounded-full bg-brand-accent ring-2 ring-brand-dark/20" title="Ativo recentemente" />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block font-body text-xs text-brand-secondary">
                          desde {formatAppDateTime(member.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-body text-sm font-semibold text-brand-secondary">{member.email || '—'}</td>
                  <td className="px-3 py-3 text-center">
                    {member.longestStreak > 0 ? (
                      <span className={`${adminMembersStatusPill} bg-brand-accent text-brand-dark`}>
                        <Flame className={homeIconGlyphSm} strokeWidth={3} />
                        {member.currentStreak > 0 ? member.currentStreak : member.longestStreak}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-3 font-body text-xs font-semibold text-brand-secondary">
                    {member.last_seen_at
                      ? formatAppDateTime(member.last_seen_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`${adminMembersStatusPill} ${
                        member.role === 'admin' ? 'bg-brand-accent text-brand-dark' : 'bg-bg-primary text-brand-secondary'
                      }`}
                    >
                      {member.role === 'admin' ? 'Admin' : 'Aluno'}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Link
                        href={`/admin/members/${member.id}`}
                        transitionTypes={navForwardTransitionTypes}
                        className={adminMembersRowAction}
                        aria-label={`Ver histórico de ${member.username}`}
                      >
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
                      </Link>
                      {member.role !== 'admin' ? (
                        <DeleteMemberButton
                          userId={member.id}
                          username={member.username || ''}
                          buttonClassName={adminMembersDangerAction}
                          iconOnly
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="py-14 text-center">
          <p className="font-heading text-base font-bold text-brand-dark">Nenhum membro encontrado</p>
          <p className="mt-2 font-body text-sm text-brand-secondary">Ajuste a busca ou os filtros para ver outros resultados.</p>
        </div>
      ) : null}
    </section>
  )
}