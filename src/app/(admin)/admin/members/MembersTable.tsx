'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import DeleteMemberButton from '../dashboard/DeleteMemberButton'
import {
  accentBadge,
  AdminBadge,
  glassTile,
  neutralBadge,
  sectionDivider,
  tableBodyRow,
  tableDivider,
  tableHeadRow,
  fieldClass,
} from '@/features/admin/lib/adminUi'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { formatAppDateTime } from '@/lib/timezone'
import type { Profile } from '@/types/database.types'

function getInitial(username: string | null | undefined) {
  return username?.trim().charAt(0).toUpperCase() || '?'
}

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
    <section className={`${glassTile} relative overflow-hidden`}>
      <div className={`relative z-10 flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${sectionDivider}`}>
        <div>
          <AdminBadge label="Diretório" />
          <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Lista de membros</h2>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou email"
              className={`${fieldClass} pl-10`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className={`${fieldClass} w-full sm:w-auto`}
          >
            <option value="all">Todos</option>
            <option value="admin">Admins</option>
            <option value="member">Membros</option>
          </select>
        </div>
      </div>

      <div className="relative z-10 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className={tableHeadRow}>
              <th className="px-5 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nível</th>
              <th className="px-4 py-3 text-center">Sequência</th>
              <th className="px-4 py-3">Último acesso</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className={tableDivider}>
            {filteredMembers.map((member) => (
              <tr key={member.id} className={`group ${tableBodyRow}`}>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/members/${member.id}`}
                    transitionTypes={navForwardTransitionTypes}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent font-heading text-sm font-bold text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)] transition-transform group-hover:scale-105">
                      {getInitial(member.username)}
                    </span>
                    <span className="font-heading font-bold text-brand-dark transition-colors group-hover:text-brand-secondary">
                      {member.username}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 font-body font-semibold text-brand-secondary">{member.email || '—'}</td>
                <td className="px-4 py-3 font-body font-semibold text-brand-secondary">—</td>
                <td className="px-4 py-3 text-center font-body font-semibold text-brand-secondary">—</td>
                <td className="px-4 py-3 font-body text-xs font-semibold text-brand-secondary">
                  {member.last_seen_at
                    ? formatAppDateTime(member.last_seen_at, { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={member.role === 'admin' ? accentBadge : neutralBadge}>
                    {member.role === 'admin' ? 'Admin' : 'Membro'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <Link
                      href={`/admin/members/${member.id}`}
                      transitionTypes={navForwardTransitionTypes}
                      className="rounded-lg border-2 border-brand-dark bg-bg-card p-2 text-brand-secondary transition hover:bg-brand-dark hover:text-white"
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
        <div className="relative z-10 py-12 text-center">
          <p className="font-body text-sm font-semibold text-brand-secondary">Nenhum membro encontrado.</p>
          <p className="mt-1 font-body text-xs text-brand-secondary/80">Ajuste a busca ou os filtros para ver outros resultados.</p>
        </div>
      )}
    </section>
  )
}