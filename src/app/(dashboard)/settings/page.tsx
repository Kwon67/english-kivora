import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AccountAreaShell from '@/features/profile/components/AccountAreaShell'
import ProfileAccountSettings from '@/features/profile/components/ProfileAccountSettings'
import { getOwnProfile } from '@/features/profile/lib/getOwnProfile'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Preferências e segurança',
  description: 'Gerencie notificações e a segurança da sua conta Kivora.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profile, factorsResult] = await Promise.all([
    getOwnProfile(supabase, user.id),
    supabase.auth.mfa.listFactors(),
  ])

  if (!profile) redirect('/profile')

  return (
    <AccountAreaShell
      activeArea="settings"
      eyebrow="Configurações da conta"
      title="Preferências e segurança"
      description="Controle as comunicações da plataforma e configure uma camada adicional de proteção para seu acesso."
      contentClassName="max-w-4xl"
    >
      <ProfileAccountSettings
        initialWeeklyReportEnabled={profile.weekly_report_enabled ?? true}
        initialFactors={factorsResult.data?.all || []}
      />
    </AccountAreaShell>
  )
}
