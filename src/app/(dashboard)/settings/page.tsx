import type { LucideIcon } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Mail, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AccountAreaNav from '@/features/profile/components/AccountAreaNav'
import ProfileAccountSettings from '@/features/profile/components/ProfileAccountSettings'
import PrivacySettings from '@/features/profile/components/PrivacySettings'
import AccountProgress from '@/features/profile/components/AccountProgress'
import BillingSettings from '@/features/billing/components/BillingSettings'
import { getBillingSummary } from '@/features/billing/lib/billingSummary'
import { getOwnProfile } from '@/features/profile/lib/getOwnProfile'
import {
  settingsShell,
  settingsTelemetryBand,
  settingsTelemetryCell,
} from '@/features/profile/lib/settingsPageUi'
import SettingsHeader from './SettingsHeader'
import { SettingsMotionItem, SettingsMotionSection } from './SettingsMotion'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Preferências e segurança',
  description: 'Gerencie notificações e a segurança da sua conta Kivora.',
}

function TelemetryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className={settingsTelemetryCell}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-dark" strokeWidth={2.2} aria-hidden />
      </div>
      <p className="font-heading text-lg font-bold leading-none text-brand-dark sm:text-xl">{value}</p>
    </div>
  )
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
  const mfaEnabled = factors.some((factor) => factor.status === 'verified')
  const weeklyReportEnabled = profile.weekly_report_enabled ?? true
  const billingSummary = await getBillingSummary(user.id, profile.role)
  const publicVapidKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || process.env.VAPID_PUBLIC_KEY?.trim() || null

  return (
    <div className={settingsShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-4xl space-y-6 pb-12 animate-fade-in sm:space-y-8">
        <SettingsMotionSection>
          <SettingsHeader weeklyReportEnabled={weeklyReportEnabled} mfaEnabled={mfaEnabled} />
        </SettingsMotionSection>

        <SettingsMotionSection>
          <AccountProgress />
        </SettingsMotionSection>

        <SettingsMotionSection className={settingsTelemetryBand} stagger>
          <SettingsMotionItem>
            <TelemetryMetric label="2FA" value={mfaEnabled ? 'Ativo' : 'Inativo'} icon={ShieldCheck} />
          </SettingsMotionItem>
          <SettingsMotionItem>
            <TelemetryMetric
              label="Relatório"
              value={weeklyReportEnabled ? 'Semanal' : 'Desligado'}
              icon={Mail}
            />
          </SettingsMotionItem>
        </SettingsMotionSection>

        <SettingsMotionSection>
          <AccountAreaNav activeArea="settings" frosted />
        </SettingsMotionSection>

        <SettingsMotionSection>
          <BillingSettings summary={billingSummary} autoStartCheckout={params.subscribe === 'pro'} />
        </SettingsMotionSection>

        <SettingsMotionSection>
          <ProfileAccountSettings
            initialWeeklyReportEnabled={weeklyReportEnabled}
            initialFactors={factors}
            publicVapidKey={publicVapidKey}
          />
        </SettingsMotionSection>

        <SettingsMotionSection>
          <PrivacySettings />
        </SettingsMotionSection>
      </div>
    </div>
  )
}
