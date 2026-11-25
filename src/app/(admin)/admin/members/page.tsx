import styles from '@/features/admin/components/AdminWorkspace.module.css'
import WorkspaceSections from '@/components/ui/WorkspaceSections'
import { ShieldCheck, UserRound, UserCheck, Users } from 'lucide-react'
import AddMemberModal from '../dashboard/AddMemberModal'
import MembersHeader from './MembersHeader'
import MembersTable, { type MemberDirectoryRow } from './MembersTable'
import AdminMetric from '@/features/admin/components/AdminMetric'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import {
  adminMembersPrimaryBtn,
  adminMembersShell,
  adminMembersMemberAvatar,
  adminMembersTelemetryBand,
} from '@/features/admin/lib/adminMembersUi'
import { adminDashboardIconBox } from '@/features/admin/lib/adminDashboardUi'
import { homeIconGlyphSm } from '@/lib/homeStyles'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import Link from 'next/link'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { redirect } from 'next/navigation'

const MEMBER_DIRECTORY_SELECT =
  'id, username, email, role, created_at, last_seen_at' as const

type MemberProfileRow = {
  id: string
  username: string
  email: string
  role: string
  created_at: string
  last_seen_at: string | null
}

function maskEmailForDirectory(email: string) {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email
  const visible = localPart.slice(0, Math.min(2, localPart.length))
  return `${visible}${'*'.repeat(Math.max(localPart.length - visible.length, 2))}@${domain}`
}

export const dynamic = 'force-dynamic'
export const revalidate = 0


function isRecentlyActive(lastSeenAt: string | null) {
  if (!lastSeenAt) return false
  const threshold = shiftAppDate(getAppDateString(), -7)
  return getAppDateString(new Date(lastSeenAt)) >= threshold
}

export default async function MembersPage() {
  const sessionClient = await createClient()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await sessionClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') redirect('/home')

  const supabase = createAdminClient() ?? sessionClient

  const [membersResult, streaksResult] = await Promise.all([
    supabase.from('profiles').select(MEMBER_DIRECTORY_SELECT).order('username'),
    supabase.from('user_streaks').select('user_id, current_streak, longest_streak'),
  ])

  if (membersResult.error) {
    console.error('Members page query failed', membersResult.error)
    throw new Error('Falha ao carregar os membros do ambiente.')
  }

  const members = (membersResult.data ?? []) as MemberProfileRow[]
  const streakByUser = new Map(
    (streaksResult.data ?? []).map((row) => [
      row.user_id,
      {
        current: row.current_streak ?? 0,
        longest: row.longest_streak ?? 0,
      },
    ])
  )

  const directoryRows: MemberDirectoryRow[] = members.map((member) => {
    const streak = streakByUser.get(member.id)
    return {
      id: member.id,
      username: member.username,
      emailMasked: maskEmailForDirectory(member.email || ''),
      role: member.role,
      created_at: member.created_at,
      last_seen_at: member.last_seen_at,
      currentStreak: streak?.current ?? 0,
      longestStreak: streak?.longest ?? 0,
    }
  })

  const totalMembers = members.length
  const adminCount = members.filter((member) => member.role === 'admin').length
  const studentCount = totalMembers - adminCount
  const activeRecently = members.filter((member) => isRecentlyActive(member.last_seen_at)).length
  const withStreak = directoryRows.filter((member) => member.longestStreak > 0).length

  const newestMembers = [...members]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <div className={`${adminMembersShell} dashboard-landing ${styles.workspace}`}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-full space-y-6 pb-8 sm:space-y-8">
<AdminMotionSection>
          <MembersHeader
            totalMembers={totalMembers}
            action={<AddMemberModal triggerClassName={adminMembersPrimaryBtn} />}
          />
        </AdminMotionSection>

<WorkspaceSections label="Organização dos membros" tabs={[{"id":"lista","label":"Diretório","description":"Busque alunos, consulte perfis e gerencie permissões.","icon":"users","anchors":["diretorio"]},{"id":"atividade","label":"Atividade","description":"Indicadores de presença e os cadastros mais recentes.","icon":"chart","anchors":[]}]} >
<div className="workspace-panel-stack"><AdminMotionSection>
          <MembersTable members={directoryRows} />
        </AdminMotionSection></div>
<div className="workspace-panel-stack"><AdminMotionSection className={adminMembersTelemetryBand} stagger>
          <AdminMotionItem>
            <AdminMetric tone="tutor" label="Total" value={String(totalMembers)} icon={Users} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="listening" label="Alunos" value={String(studentCount)} icon={UserRound} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="grammar" label="Admins" value={String(adminCount)} icon={ShieldCheck} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="success" label="Ativos 7d" value={String(activeRecently)} icon={UserCheck} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="streak" label="Com streak" value={String(withStreak)} icon={Users} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric
              tone="vocabulary"
              label="Presença"
              value={totalMembers > 0 ? `${Math.round((activeRecently / totalMembers) * 100)}%` : '—'}
              icon={UserCheck}
            />
          </AdminMotionItem>
        </AdminMotionSection>{newestMembers.length > 0 ? (
          <AdminMotionSection>
            <section className="dashboard-panel">
              <div className="mb-5 flex items-center gap-3">
                <span className={adminDashboardIconBox}>
                  <UserRound className={homeIconGlyphSm} strokeWidth={1.5} />
                </span>
                <div>

                  <h2 className="mt-2 font-heading text-xl font-bold text-brand-dark sm:text-2xl">Últimos cadastros</h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {newestMembers.map((member) => (
                  <div key={member.id} className="dashboard-insight">
                    <Link
                      href={`/admin/members/${member.id}`}
                      transitionTypes={navForwardTransitionTypes}
                      className="group flex items-center gap-3"
                    >
                      <span className={`${adminMembersMemberAvatar} transition-transform group-hover:scale-105`}>
                        <UserRound className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-heading text-sm font-bold text-brand-dark group-hover:text-brand-secondary">
                          {member.username}
                        </p>
                        <p className="font-body text-xs text-brand-secondary">
                          {member.role === 'admin' ? 'Admin' : 'Aluno'}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </AdminMotionSection>
        ) : null}</div>
</WorkspaceSections>
</div>
    </div>
  )
}
