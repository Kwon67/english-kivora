'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ClipboardList,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { ANALYTICS_EVENT, trackEvent } from '@/lib/analytics'
import {
  assignOnboardingStarterPack,
  completeOnboardingSetup,
  getOnboardingStarterPackOptions,
  saveOnboardingPreferences,
  saveOnboardingSkipLevel,
} from '@/app/onboarding-actions'
import {
  CAT_MAX_QUESTIONS,
  type StudyExperience,
} from '@/features/onboarding/lib/catLevels'
import {
  ONBOARDING_DAILY_GOALS,
  type OnboardingDailyGoalMinutes,
  type OnboardingInterestId,
} from '@/features/onboarding/lib/onboardingInterests'
import type { OnboardingWizardStep } from '@/features/onboarding/lib/onboardingStatus'
import type { RankedStarterPack } from '@/features/onboarding/lib/suggestStarterPack'
import {
  onboardingMethodOptionClass,
  onboardingPrimaryButton,
  onboardingSecondaryButton,
} from '@/features/onboarding/lib/onboardingUi'
import { notify } from '@/lib/toast'
import styles from './Onboarding.module.css'
import OnboardingGoalsStep from './OnboardingGoalsStep'
import OnboardingPlacementStep from './OnboardingPlacementStep'
import OnboardingShell from './OnboardingShell'
import OnboardingStarterPackStep from './OnboardingStarterPackStep'
import { onboardingConnectionError } from '../lib/onboardingConnectionError'

const TOTAL_STEPS = 5

type OnboardingClientProps = {
  initialStep: OnboardingWizardStep
  initialInterests?: OnboardingInterestId[]
  initialDailyGoalMinutes?: OnboardingDailyGoalMinutes
  initialStudyExperience?: StudyExperience | null
}

export default function OnboardingClient({
  initialStep,
  initialInterests = [],
  initialDailyGoalMinutes = 10,
  initialStudyExperience = null,
}: OnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingWizardStep>(initialStep)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<OnboardingInterestId[]>(initialInterests)
  const [dailyGoalMinutes, setDailyGoalMinutes] =
    useState<OnboardingDailyGoalMinutes>(initialDailyGoalMinutes)
  const [studyExperience, setStudyExperience] = useState<StudyExperience | null>(
    initialStudyExperience
  )
  const [placementLabel, setPlacementLabel] = useState<string | null>(null)
  const [skippedLevelTest, setSkippedLevelTest] = useState(false)
  const [starterPackPreAssigned, setStarterPackPreAssigned] = useState(false)
  const [packOptions, setPackOptions] = useState<RankedStarterPack[]>([])
  const [recommendedPack, setRecommendedPack] = useState<RankedStarterPack | null>(null)
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)

  const finishAndRedirect = useCallback(() => {
    notify.success('Configuração concluída', {
      description: 'Sua jornada no Kivora começa agora.',
    })
    router.replace('/today')
    router.refresh()
  }, [router])

  const loadStarterPacks = useCallback(async (interests: OnboardingInterestId[]) => {
    setError('')
    setLoading(true)
    const result = await getOnboardingStarterPackOptions({ interests }).catch(onboardingConnectionError)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return null
    }

    const recommendedId = result.recommended?.id ?? result.packs[0]?.id ?? null
    setPackOptions(result.packs)
    setRecommendedPack(result.recommended)
    setSelectedPackId(recommendedId)
    return { recommendedId }
  }, [])

  useEffect(() => {
    if (initialStep !== 'starter-pack' || selectedInterests.length === 0) {
      return
    }

    void loadStarterPacks(selectedInterests)
  }, [initialStep, loadStarterPacks, selectedInterests])

  async function handleSkipLevel() {
    setError('')
    setLoading(true)
    const result = await saveOnboardingSkipLevel().catch(onboardingConnectionError)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setPlacementLabel(null)
    setSkippedLevelTest(true)
    setStarterPackPreAssigned(false)
    setStep('goals')
  }

  function handlePlacementComplete(result: { displayLabel: string; atCeiling: boolean }) {
    // displayLabel is a CEFR band ("A2"), not free text the learner wrote.
    trackEvent(ANALYTICS_EVENT.PLACEMENT_DONE, {
      level: result.displayLabel,
      atCeiling: result.atCeiling,
    })
    setPlacementLabel(
      result.atCeiling ? `${result.displayLabel} (teto do teste)` : result.displayLabel
    )
    setSkippedLevelTest(false)
    setStarterPackPreAssigned(false)
    setStep('goals')
  }

  function toggleInterest(id: OnboardingInterestId) {
    setSelectedInterests((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }
      return [...current, id]
    })
  }

  async function handleGoalsContinue() {
    if (selectedInterests.length === 0) {
      setError('Escolha pelo menos um interesse.')
      return
    }

    if (!ONBOARDING_DAILY_GOALS.includes(dailyGoalMinutes)) {
      setError('Meta diária inválida.')
      return
    }

    setError('')
    setLoading(true)
    const saveResult = await saveOnboardingPreferences({
      interests: selectedInterests,
      dailyGoalMinutes,
      studyExperience,
    }).catch(onboardingConnectionError)
    setLoading(false)

    if (!saveResult.ok) {
      setError(saveResult.error)
      return
    }

    const options = await loadStarterPacks(selectedInterests)
    if (!options) return

    if (placementLabel && options.recommendedId) {
      setLoading(true)
      const assignResult = await assignOnboardingStarterPack({ packId: options.recommendedId }).catch(onboardingConnectionError)
      setLoading(false)

      if (!assignResult.ok) {
        setError(assignResult.error)
        return
      }

      setStarterPackPreAssigned(true)
      notify.success('Pack inicial na sua rotina', {
        description: 'Suas revisões espaçadas já podem começar.',
      })
    }

    setStep('starter-pack')
  }

  async function handleComplete(assignPack: boolean) {
    setError('')
    setLoading(true)
    const result = await completeOnboardingSetup({
      assignPack: assignPack && !starterPackPreAssigned,
      packId: assignPack || starterPackPreAssigned ? selectedPackId : null,
      packAlreadyAssigned: starterPackPreAssigned,
      interests: selectedInterests,
      dailyGoalMinutes,
      studyExperience,
    }).catch(onboardingConnectionError)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    trackEvent(ANALYTICS_EVENT.ONBOARDING_COMPLETED, {
      dailyGoalMinutes,
      studyExperience,
      interests: selectedInterests.length,
      assignedPack: Boolean(assignPack || starterPackPreAssigned),
    })
    finishAndRedirect()
  }

  if (step === 'welcome') {
    return (
      <OnboardingShell
        step={1}
        totalSteps={TOTAL_STEPS}
        title="Bem-vindo ao Kivora English"
        subtitle="Encontre seu ponto de partida e configure uma rotina de estudo em cerca de quatro minutos."
      >
        <div className="space-y-5" data-testid="onboarding-welcome-step">
          <ul className={styles.welcome}>
            <li>Estime seu nível entre A1 e B2 com frases reais, ou faça o teste depois.</li>
            <li>Escolha seus temas e uma meta diária para receber um pack inicial.</li>
          </ul>
          <button
            type="button"
            onClick={() => setStep('method')}
            className={onboardingPrimaryButton}
            data-testid="onboarding-welcome-start"
          >
            Começar
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </OnboardingShell>
    )
  }

  if (step === 'method') {
    return (
      <OnboardingShell
        step={2}
        totalSteps={TOTAL_STEPS}
        title="Como quer começar?"
        subtitle="Escolha se quer estimar seu nível agora."
      >
        <div className="space-y-3" data-testid="onboarding-method-step">
          <button
            type="button"
            disabled={loading}
            onClick={() => setStep('placement-test')}
            className={onboardingMethodOptionClass}
            data-testid="onboarding-method-placement"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-control bg-brand-accent text-brand-dark">
              <ClipboardList className="h-5 w-5 shrink-0" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-base font-bold text-brand-dark">
                Fazer teste adaptativo
              </span>
              <span className="mt-1 block text-sm leading-snug text-brand-secondary">
                Até {CAT_MAX_QUESTIONS} frases reais dos packs (A1–B2).
              </span>
            </span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSkipLevel}
            className={onboardingMethodOptionClass}
            data-testid="onboarding-method-skip"
          >
            <span className="grid size-8 shrink-0 place-items-center text-brand-dark">
              <Sparkles className="h-5 w-5 shrink-0" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-base font-bold text-brand-dark">
                Pular por agora
              </span>
              <span className="mt-1 block text-sm leading-snug text-brand-secondary">
                Você pode fazer o teste depois. Sugerimos packs do Básico (A2) enquanto isso.
              </span>
            </span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => setStep('welcome')}
            className={`${onboardingSecondaryButton} mt-2`}
          >
            Voltar
          </button>

          {error && <p role="alert" className={styles.feedback}>{error}</p>}
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

  if (step === 'placement-test') {
    return (
      <OnboardingPlacementStep
        loading={loading}
        onBack={() => setStep('method')}
        onComplete={handlePlacementComplete}
      />
    )
  }

  if (step === 'goals') {
    return (
      <OnboardingGoalsStep
        selectedInterests={selectedInterests}
        dailyGoalMinutes={dailyGoalMinutes}
        studyExperience={studyExperience}
        error={error}
        placementLabel={placementLabel}
        skippedLevelTest={skippedLevelTest}
        loading={loading}
        onToggleInterest={toggleInterest}
        onSelectGoal={setDailyGoalMinutes}
        onSelectStudyExperience={setStudyExperience}
        onBack={() => { setError(''); setStep('method') }}
        onContinue={handleGoalsContinue}
      />
    )
  }

  return (
    <OnboardingStarterPackStep
      error={error}
      packs={packOptions}
      recommended={recommendedPack}
      selectedPackId={selectedPackId}
      loading={loading}
      isLoadingPacks={loading && packOptions.length === 0}
      preAssigned={starterPackPreAssigned}
      showStarterSuggestion={skippedLevelTest}
      onSelectPack={setSelectedPackId}
      onBack={() => { setError(''); setStep('goals') }}
      onAssign={() => handleComplete(true)}
      onSkip={() => handleComplete(false)}
    />
  )
}
