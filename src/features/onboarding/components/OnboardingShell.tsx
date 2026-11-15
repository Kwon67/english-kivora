import MotionSurface from '@/components/motion/MotionSurface'
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
    <div data-testid="onboarding-wizard" className={onboardingShellClass}>
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4 sm:space-y-6">
        <MotionSurface className={onboardingProgressStrip}>
          <p className="font-heading text-sm font-semibold text-brand-dark">
            Passo {step} de {totalSteps}
          </p>
          <div
            className="learning-progress !mt-0 max-w-48 min-w-0 flex-1"
            data-tone={(['review', 'listening', 'vocabulary', 'tutor', 'grammar'] as const)[Math.max(0, step - 1) % 5]}
            role="progressbar"
            aria-label="Progresso da configuração"
            aria-valuenow={progress}
          >
            <span data-progress-fill style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-semibold text-brand-secondary">
            {progress}%
          </span>
        </MotionSurface>

        <section className={`${onboardingCardClass} p-5 sm:p-8 lg:p-10`}>
          <h1 className="font-heading text-[clamp(1.65rem,5.5vw,2.25rem)] font-semibold leading-[1.1] text-brand-dark">
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
