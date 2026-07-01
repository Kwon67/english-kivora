'use client'

import { m } from 'framer-motion'
import {
  adminDashboardMetricStripBar,
  adminDashboardMetricStripPct,
  adminDashboardMetricStripTrack,
} from '@/features/admin/lib/adminDashboardUi'
import {
  onboardingCardClass,
  onboardingProgressStrip,
  onboardingShellClass,
} from '@/features/onboarding/lib/onboardingUi'

type OnboardingShellProps = {
  step: number
  totalSteps: number
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
}: OnboardingShellProps) {
  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div
      data-testid="onboarding-wizard"
      className={onboardingShellClass}
    >
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-2xl space-y-4 pb-4 sm:space-y-6 sm:pb-8">
        <div className={onboardingProgressStrip}>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
              Configuração inicial
            </p>
            <p className="font-heading text-sm font-bold text-brand-dark">
              Passo {step} de {totalSteps}
            </p>
          </div>
          <div className={`${adminDashboardMetricStripTrack} sm:w-36 sm:shrink-0 sm:flex-none`}>
            <div className={adminDashboardMetricStripBar}>
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, progress)}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="h-full rounded-full bg-brand-dark"
              />
            </div>
            <span className={adminDashboardMetricStripPct}>{progress}%</span>
          </div>
        </div>

        <section className={`${onboardingCardClass} p-5 sm:p-8`}>
          <h1 className="font-heading text-[clamp(1.65rem,5.5vw,2.25rem)] font-bold leading-[1.1] text-brand-dark">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-sm leading-relaxed text-brand-secondary sm:text-base">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-6 sm:mt-8">{children}</div>
        </section>
      </div>
    </div>
  )
}