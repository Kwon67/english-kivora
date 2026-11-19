'use client'

import { Loader2 } from 'lucide-react'
import {
  STUDY_EXPERIENCE_OPTIONS,
  type StudyExperience,
} from '@/features/onboarding/lib/catLevels'
import {
  ONBOARDING_DAILY_GOALS,
  ONBOARDING_INTEREST_OPTIONS,
  type OnboardingDailyGoalMinutes,
  type OnboardingInterestId,
} from '@/features/onboarding/lib/onboardingInterests'
import {
  onboardingActionRow,
  onboardingGoalLabelClass,
  onboardingGoalOptionClass,
  onboardingInterestChip,
  onboardingPrimaryButton,
  onboardingSecondaryButton,
} from '@/features/onboarding/lib/onboardingUi'
import styles from './Onboarding.module.css'
import OnboardingShell from './OnboardingShell'

type OnboardingGoalsStepProps = {
  selectedInterests: OnboardingInterestId[]
  dailyGoalMinutes: OnboardingDailyGoalMinutes
  studyExperience: StudyExperience | null
  placementLabel?: string | null
  skippedLevelTest?: boolean
  loading: boolean
  error?: string
  onToggleInterest: (id: OnboardingInterestId) => void
  onSelectGoal: (minutes: OnboardingDailyGoalMinutes) => void
  onSelectStudyExperience: (value: StudyExperience | null) => void
  onBack: () => void
  onContinue: () => void
}

export default function OnboardingGoalsStep({
  selectedInterests,
  dailyGoalMinutes,
  studyExperience,
  placementLabel,
  skippedLevelTest = false,
  loading,
  error,
  onToggleInterest,
  onSelectGoal,
  onSelectStudyExperience,
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
        {placementLabel ? (
          <div className={styles.note}>
            <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
              Nível estimado pelo teste
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-brand-dark">{placementLabel}</p>
          </div>
        ) : skippedLevelTest ? (
          <div
            className={styles.note}
            data-testid="onboarding-level-suggestion-banner"
          >
            <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
              Nível ainda não avaliado
            </p>
            <p className="mt-1 text-sm leading-relaxed text-brand-secondary">
              Sugerimos começar pelo <span className="font-semibold text-brand-dark">Básico (A2)</span>{' '}
              até você fazer o teste adaptativo.
            </p>
          </div>
        ) : null}

        <fieldset className={styles.fields}>
          <legend>Interesses</legend>
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
        </fieldset>

        <fieldset className={styles.fields}>
          <legend>Meta diária</legend>
          <p className="mt-1 text-sm text-brand-secondary">
            Tempo médio que você quer dedicar por dia.
          </p>
          <div className={`${styles.goalOptions} mt-3`}>
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
                  <span className={onboardingGoalLabelClass}>{minutes} min</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className={styles.fields}>
          <legend>Experiência de estudo (opcional)</legend>
          <p className="mt-1 text-sm text-brand-secondary">
            Informe há quanto tempo estuda inglês.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STUDY_EXPERIENCE_OPTIONS.map((option) => {
              const selected = studyExperience === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={loading}
                  aria-pressed={selected}
                  onClick={() =>
                    onSelectStudyExperience(selected ? null : option.id)
                  }
                  className={onboardingInterestChip(selected)}
                  data-testid={`onboarding-goals-study-${option.id}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        {error && <p role="alert" className={styles.feedback}>{error}</p>}
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
            <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />
            Salvando...
          </p>
        ) : null}
      </div>
    </OnboardingShell>
  )
}