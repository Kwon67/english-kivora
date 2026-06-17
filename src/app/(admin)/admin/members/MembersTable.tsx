'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import DeleteMemberButton from '../dashboard/DeleteMemberButton'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { formatAppDateTime } from '@/lib/timezone'
import type { Profile } from '@/types/database.types'

export default function MembersTable({ members }: { members: Profile[] }) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

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
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou email"
            className="field w-full px-9 py-2 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="field px-3 py-2 text-sm"
        >
          <option value="all">Todos</option>
          <option value="admin">Admins</option>
          <option value="member">Membros</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-[var(--color-surface-container-low)] text-xs uppercase tracking-wide text-text-subtle">
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Nível</th>
              <th className="px-4 py-3 text-center font-semibold">Sequência</th>
              <th className="px-4 py-3 font-semibold">Último acesso</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="group border-b border-border/30 transition-colors hover:bg-surface-container-low">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/members/${member.id}`}
                    transitionTypes={navForwardTransitionTypes}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-container-high)] text-sm font-semibold text-text-muted">
                      {member.username?.[0]?.toUpperCase() || '?'}
                    </span>
                    <span className="font-medium text-text">{member.username}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-muted">{member.email || '-'}</td>
                <td className="px-4 py-3 text-text-muted">-</td>
                <td className="px-4 py-3 text-center text-text-muted">-</td>
                <td className="px-4 py-3 text-text-muted">
                  {member.last_seen_at
                    ? formatAppDateTime(member.last_seen_at, { hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ member.role === 'admin' ? 'bg-primary-light text-primary border border-[var(--color-primary-light)]' : 'bg-[var(--color-surface-container)] text-text-muted border-border' }`}
                  >
                    {member.role === 'admin' ? 'Admin' : 'Membro'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <Link
                      href={`/admin/members/${member.id}`}
                      transitionTypes={navForwardTransitionTypes}
                      className="rounded-md p-2 text-text-subtle transition-colors hover:bg-surface-container-low hover:text-primary"
                      aria-label={`Ver histórico de ${member.username}`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    {member.role !== 'admin' && (
                      <DeleteMemberButton userId={member.id} username={member.username || ''} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMembers.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-text-muted">Nenhum membro encontrado.</p>
          <p className="mt-1 text-xs text-text-subtle">Ajuste a busca ou os filtros para ver outros resultados.</p>
        </div>
      )}
    </section>
  )
}
