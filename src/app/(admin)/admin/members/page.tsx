import { ShieldCheck, UserRound, Users } from 'lucide-react'
import AddMemberModal from '../dashboard/AddMemberModal'
import MembersTable from './MembersTable'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'
import { AdminStatCard, pageInner, pageRoot } from '@/features/admin/lib/adminUi'
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

  const statCards = [
    {
      label: 'Total',
      value: totalMembers,
      icon: Users,
      subtitle: 'Registrados no ambiente',
    },
    {
      label: 'Admins',
      value: adminCount,
      icon: ShieldCheck,
      subtitle: 'Com acesso administrativo',
    },
    {
      label: 'Alunos',
      value: studentCount,
      icon: UserRound,
      subtitle: 'Membros da base de alunos',
    },
  ]

  return (
    <div className={pageRoot}>
      <div className={pageInner}>
        <AdminMotionSection>
          <AdminSectionHeader
            breadcrumb={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Membros' },
            ]}
            badge="Base de alunos"
            title="Membros do programa"
            description="Administre acessos, histórico individual e organização da base de alunos."
            action={<AddMemberModal />}
          />
        </AdminMotionSection>

        <AdminMotionSection className="grid gap-4 sm:grid-cols-3" stagger>
          {statCards.map((stat) => (
            <AdminMotionItem key={stat.label}>
              <AdminStatCard
                label={stat.label}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
              />
            </AdminMotionItem>
          ))}
        </AdminMotionSection>

        <AdminMotionSection>
          <MembersTable members={(members ?? []) as Profile[]} />
        </AdminMotionSection>
      </div>
    </div>
  )
}