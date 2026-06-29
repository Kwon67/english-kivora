'use client'

import { Bell, ShieldCheck } from 'lucide-react'
import MFAEnrollment from '@/features/auth/components/MFAEnrollment'
import WeeklyReportPreference from '@/features/profile/components/WeeklyReportPreference'
import { glassPanel, softKicker } from '@/features/profile/lib/profileUi'

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
    <div className="space-y-5">
      <section id="preferences" className="scroll-mt-28" aria-labelledby="preferences-title">
        <article className={`${glassPanel} p-5 sm:p-7`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(213, 224, 107,0.08),rgba(28, 25, 21,0)_48%)]" />

          <div className="relative z-10">
            <div className="flex items-start gap-4 border-b border-dashed border-border-muted/18 pb-5 dark:border-border-accent/18">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary dark:bg-primary/12">
                <Bell className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <p className={softKicker}>Comunicação</p>
                <h2 id="preferences-title" className="mt-2 font-montserrat text-2xl font-bold text-text dark:text-text">
                  Preferências
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted dark:text-text-muted">
                  Escolha quais atualizações deseja receber sobre sua rotina de estudos.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <WeeklyReportPreference initialEnabled={initialWeeklyReportEnabled} embedded />
            </div>
          </div>
        </article>
      </section>

      <section id="security" className="scroll-mt-28" aria-labelledby="security-title">
        <article className={`${glassPanel} p-5 sm:p-7`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(213, 224, 107,0.08),rgba(28, 25, 21,0)_48%)]" />

          <div className="relative z-10">
            <div className="flex items-start gap-4 border-b border-dashed border-border-muted/18 pb-5 dark:border-border-accent/18">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary dark:bg-primary/12">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <p className={softKicker}>Acesso à conta</p>
                <h2 id="security-title" className="mt-2 font-montserrat text-2xl font-bold text-text dark:text-text">
                  Segurança
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-muted dark:text-text-muted">
                  Proteja seu acesso com uma segunda etapa de verificação.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <MFAEnrollment initialFactors={initialFactors} />
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-border-muted/18 bg-primary-light/55 px-4 py-3.5 dark:border-border-accent/18 dark:bg-primary/5">
              <p className="text-xs leading-6 text-text-muted dark:text-text-muted">
                O Kivora também aplica limites automáticos contra tentativas repetidas de acesso.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
