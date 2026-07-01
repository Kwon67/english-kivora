'use client'

import { Loader2 } from 'lucide-react'
import {
  getDailyGoalLabel,
  ONBOARDING_DAILY_GOALS,
  ONBOARDING_INTEREST_OPTIONS,
  type OnboardingDailyGoalMinutes,
  type OnboardingInterestId,
} from '@/features/onboarding/lib/onboardingInterests'
import {
  onboardingActionRow,
  onboardingGoalLabelClass,
  onboardingGoalMinutesClass,
  onboardingGoalOptionClass,
  onboardingInterestChip,
  onboardingPrimaryButton,
  onboardingSecondaryButton,
} from '@/features/onboarding/lib/onboardingUi'
import OnboardingShell from './OnboardingShell'

type OnboardingGoalsStepProps = {
  selectedInterests: OnboardingInterestId[]
  dailyGoalMinutes: OnboardingDailyGoalMinutes
  loading: boolean
  onToggleInterest: (id: OnboardingInterestId) => void
  onSelectGoal: (minutes: OnboardingDailyGoalMinutes) => void
  onBack: () => void
  onContinue: () => void
}

export default function OnboardingGoalsStep({
  selectedInterests,
  dailyGoalMinutes,
  loading,
  onToggleInterest,
  onSelectGoal,
  onBack,
  onContinue,
}: OnboardingGoalsStepProps) {
  const canContinue = selectedInterests.length > 0

  return (
    <OnboardingShell
      step={4}
      totalSteps={5}
      title="Personalize sua rotina"
      subtitle="Escolha temas que você quer praticar e uma meta diária realista."
    >
      <div className="space-y-6" data-testid="onboarding-goals-step">
        <div>
          <p className="font-heading text-sm font-bold text-brand-dark">Interesses</p>
          <p className="mt-1 text-sm text-brand-secondary">Selecione um ou mais temas.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ONBOARDING_INTEREST_OPTIONS.map((option) => {
              const selected = selectedInterests.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={loading}
                  aria-pressed={selected}
                  onClick={() => onToggleInterest(option.id)}
                  className={onboardingInterestChip(selected)}
                  data-testid={`onboarding-interest-${option.id}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="font-heading text-sm font-bold text-brand-dark">Meta diária</p>
          <p className="mt-1 text-sm text-brand-secondary">
            Tempo médio que você quer dedicar por dia.
          </p>
          <div className="mt-3 space-y-2">
            {ONBOARDING_DAILY_GOALS.map((minutes) => {
              const selected = dailyGoalMinutes === minutes
              return (
                <button
                  key={minutes}
                  type="button"
                  disabled={loading}
                  aria-pressed={selected}
                  onClick={() => onSelectGoal(minutes)}
                  className={onboardingGoalOptionClass(selected)}
                >
                  <span className={onboardingGoalLabelClass}>{getDailyGoalLabel(minutes)}</span>
                  <span className={`${onboardingGoalMinutesClass} hidden sm:inline`}>
                    {minutes} min
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={onboardingActionRow}>
          <button
            type="button"
            disabled={loading || !canContinue}
            onClick={onContinue}
            className={onboardingPrimaryButton}
            data-testid="onboarding-goals-continue"
          >
            Continuar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onBack}
            className={onboardingSecondaryButton}
          >
            Voltar
          </button>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-brand-secondary" aria-live="polite">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            Salvando...
          </p>
        ) : null}
      </div>
    </OnboardingShell>
  )
}