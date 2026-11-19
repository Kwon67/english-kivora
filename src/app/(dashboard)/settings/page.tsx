import WorkspaceSections from '@/components/ui/WorkspaceSections'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AccountAreaNav from '@/features/profile/components/AccountAreaNav'
import ProfileAccountSettings from '@/features/profile/components/ProfileAccountSettings'
import PrivacySettings from '@/features/profile/components/PrivacySettings'
import AccountProgress from '@/features/profile/components/AccountProgress'
import BillingSettings from '@/features/billing/components/BillingSettings'
import { getBillingSummary } from '@/features/billing/lib/billingSummary'
import { getOwnProfile } from '@/features/profile/lib/getOwnProfile'
import SettingsHeader from './SettingsHeader'
import styles from '@/features/profile/components/Settings.module.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Preferências e segurança',
  description: 'Gerencie notificações e a segurança da sua conta Kivora.',
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribe?: string; billing?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profile, factorsResult] = await Promise.all([
    getOwnProfile(supabase, user.id),
    supabase.auth.mfa.listFactors(),
  ])

  if (!profile) redirect('/login')

  const factors = factorsResult.data?.all || []
  const weeklyReportEnabled = profile.weekly_report_enabled ?? true
  const billingSummary = await getBillingSummary(user.id, profile.role)
  const publicVapidKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || process.env.VAPID_PUBLIC_KEY?.trim() || null

  return (
    <div className={styles.settings}>
      <SettingsHeader />
      <AccountAreaNav activeArea="settings" />
      <WorkspaceSections
        label="Configurações"
        tabs={[
          { id: 'preferencias', label: 'Preferências', description: '', icon: 'settings', anchors: ['preferences', 'security'] },
          { id: 'assinatura', label: 'Assinatura', description: '', icon: 'book', anchors: ['subscription'] },
          { id: 'privacidade', label: 'Privacidade', description: '', icon: 'shield' },
        ]}
        defaultValue={params.subscribe || params.billing ? 'assinatura' : 'preferencias'}
      >
        <div className={styles.stack}>
          <ProfileAccountSettings
            initialWeeklyReportEnabled={weeklyReportEnabled}
            initialFactors={factors}
            publicVapidKey={publicVapidKey}
          />
          <AccountProgress />
        </div>
        <BillingSettings summary={billingSummary} />
        <PrivacySettings />
      </WorkspaceSections>
    </div>
  )
}
