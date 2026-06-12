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
    <div className="space-y-4 animate-fade-in">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Membros do programa</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administre acessos, histórico individual e organização da base de alunos.
          </p>
        </div>
        <AddMemberModal />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total', value: totalMembers, icon: Users },
          { label: 'Admins', value: adminCount, icon: ShieldCheck },
          { label: 'Alunos', value: studentCount, icon: UserRound },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-[0.9rem] border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          )
        })}
      </section>

      <MembersTable members={(members ?? []) as Profile[]} />
    </div>
  )
}
