'use client'

import { Shield } from 'lucide-react'
import MFAEnrollment from '@/features/auth/components/MFAEnrollment'
import WeeklyReportPreference from '@/features/profile/components/WeeklyReportPreference'
import { glassPanel, sectionScrollMt, softKicker } from '@/features/profile/lib/profileUi'

type MFAFactor = {
  id: string
  status: string
  friendly_name?: string
}

type ProfileAccountSettingsProps = {
  initialWeeklyReportEnabled: boolean
  initialFactors: MFAFactor[]
}

export default function ProfileAccountSettings({
  initialWeeklyReportEnabled,
  initialFactors,
}: ProfileAccountSettingsProps) {
  return (
    <section id="conta" className={sectionScrollMt}>
      <article className={`${glassPanel} p-5 sm:p-7`}>
        <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

        <div className="relative z-10 space-y-6">
          <div>
            <p className={softKicker}>Conta</p>
            <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">
              Preferências e segurança
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted dark:text-text-muted">
              Notificações, autenticação em duas etapas e proteção da sua conta.
            </p>
          </div>

          <WeeklyReportPreference initialEnabled={initialWeeklyReportEnabled} embedded />

          <div className="border-t border-dashed border-border-muted/20 pt-6 dark:border-border-accent/20">
            <MFAEnrollment initialFactors={initialFactors} />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-dashed border-border-muted/20 bg-primary-light/60 px-4 py-3.5 dark:border-border-accent/20 dark:bg-primary/5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-text dark:text-text">Proteção avançada Kivora</h3>
              <p className="mt-1 text-xs leading-relaxed text-text-subtle dark:text-text-subtle">
                Sua conta é monitorada contra acessos suspeitos. Bloqueios automáticos por IP e rate-limiting estão ativos.
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}