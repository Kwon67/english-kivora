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
            <h2 className="mt-3 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">
              Preferências e segurança
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
              Notificações, autenticação em duas etapas e proteção da sua conta.
            </p>
          </div>

          <WeeklyReportPreference initialEnabled={initialWeeklyReportEnabled} embedded />

          <div className="border-t border-dashed border-[#172113]/20 pt-6 dark:border-[#d5e6a9]/20">
            <MFAEnrollment initialFactors={initialFactors} />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-dashed border-[#172113]/20 bg-[#eef3d6]/60 px-4 py-3.5 dark:border-[#d5e6a9]/20 dark:bg-[#b8ff5c]/5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#183b16] dark:text-[#b8ff5c]" />
            <div>
              <h3 className="text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">Proteção avançada Kivora</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#5a664e] dark:text-[#9ea98b]">
                Sua conta é monitorada contra acessos suspeitos. Bloqueios automáticos por IP e rate-limiting estão ativos.
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}