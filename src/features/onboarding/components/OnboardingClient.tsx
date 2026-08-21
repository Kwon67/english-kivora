'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ClipboardList,
  Clock3,
  Layers3,
  Loader2,
  Sparkles,
  Target,
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
import OnboardingGoalsStep from './OnboardingGoalsStep'
import OnboardingPlacementStep from './OnboardingPlacementStep'
import OnboardingShell from './OnboardingShell'
import OnboardingStarterPackStep from './OnboardingStarterPackStep'

const TOTAL_STEPS = 5

type OnboardingClientProps = {
  initialStep: OnboardingWizardStep
  initialInterests?: OnboardingInterestId[]
  initialDailyGoalMinutes?: OnboardingDailyGoalMinutes
  initialStudyExperience?: StudyExperience | null
  billingIntent?: 'pro' | null
}

export default function OnboardingClient({
  initialStep,
  initialInterests = [],
  initialDailyGoalMinutes = 10,
  initialStudyExperience = null,
  billingIntent = null,
}: OnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingWizardStep>(initialStep)
  const [loading, setLoading] = useState(false)
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
    router.replace(billingIntent === 'pro' ? '/settings?subscribe=pro' : '/home')
    router.refresh()
  }, [billingIntent, router])

  const loadStarterPacks = useCallback(async (interests: OnboardingInterestId[]) => {
    setLoading(true)
    const result = await getOnboardingStarterPackOptions({ interests })
    setLoading(false)

    if (!result.ok) {
      notify.error(result.error)
      return null
    }

    const recommendedId = result.recommended?.id ?? result.packs[0]?.id ?? null
    setPackOptions(result.packs)
    setRecommendedPack(result.recommended)
    setSelectedPackId(recommendedId)
    return recommendedId
  }, [])

  useEffect(() => {
    if (initialStep !== 'starter-pack' || selectedInterests.length === 0) {
      return
    }

    void loadStarterPacks(selectedInterests)
  }, [initialStep, loadStarterPacks, selectedInterests])

  async function handleSkipLevel() {
    setLoading(true)
    const result = await saveOnboardingSkipLevel()
    setLoading(false)

    if (!result.ok) {
      notify.error(result.error)
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
      notify.error('Escolha pelo menos um interesse.')
      return
    }

    if (!ONBOARDING_DAILY_GOALS.includes(dailyGoalMinutes)) {
      notify.error('Meta diária inválida.')
      return
    }

    setLoading(true)
    const saveResult = await saveOnboardingPreferences({
      interests: selectedInterests,
      dailyGoalMinutes,
      studyExperience,
    })
    setLoading(false)

    if (!saveResult.ok) {
      notify.error(saveResult.error)
      return
    }

    const recommendedPackId = await loadStarterPacks(selectedInterests)
    if (!recommendedPackId) return

    if (placementLabel) {
      setLoading(true)
      const assignResult = await assignOnboardingStarterPack({ packId: recommendedPackId })
      setLoading(false)

      if (!assignResult.ok) {
        notify.error(assignResult.error)
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
    setLoading(true)
    const result = await completeOnboardingSetup({
      assignPack: assignPack && !starterPackPreAssigned,
      packId: assignPack || starterPackPreAssigned ? selectedPackId : null,
      packAlreadyAssigned: starterPackPreAssigned,
      interests: selectedInterests,
      dailyGoalMinutes,
      studyExperience,
    })
    setLoading(false)

    if (!result.ok) {
      notify.error(result.error)
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
        subtitle="Em poucos minutos, vamos encontrar o melhor ponto de partida para a sua rotina."
      >
        <div className="space-y-5" data-testid="onboarding-welcome-step">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Clock3,
                label: 'Rápido',
                description: 'Leva cerca de 4 minutos',
              },
              {
                icon: Target,
                label: 'Adaptativo',
                description: 'A dificuldade muda com você',
              },
              {
                icon: Layers3,
                label: 'Prático',
                description: 'Termina com um pack sugerido',
              },
            ].map(({ icon: Icon, label, description }) => (
              <div
                key={label}
                className="flex min-w-0 items-center gap-3 rounded-control border border-brand-dark/35 bg-bg-primary p-3 sm:flex-col sm:items-start sm:p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-brand-dark bg-brand-accent text-brand-dark">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-sm font-bold text-brand-dark">{label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-brand-secondary">
                    {description}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-brand-secondary sm:text-base">
            Usamos frases reais dos packs, compreensão nos dois sentidos e suas preferências para
            estimar o nível entre A1 e B2. Você pode pular o teste e ajustar tudo depois.
          </p>
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
        subtitle="Recomendamos o teste adaptativo para calibrar seu pack inicial com precisão."
      >
        <div className="space-y-3" data-testid="onboarding-method-step">
          <button
            type="button"
            disabled={loading}
            onClick={() => setStep('placement-test')}
            className={onboardingMethodOptionClass}
            data-testid="onboarding-method-placement"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-brand-dark bg-brand-accent text-brand-dark">
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
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-brand-dark bg-bg-card text-brand-dark">
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
        placementLabel={placementLabel}
        skippedLevelTest={skippedLevelTest}
        loading={loading}
        onToggleInterest={toggleInterest}
        onSelectGoal={setDailyGoalMinutes}
        onSelectStudyExperience={setStudyExperience}
        onBack={() => setStep('method')}
        onContinue={handleGoalsContinue}
      />
    )
  }

  return (
    <OnboardingStarterPackStep
      packs={packOptions}
      recommended={recommendedPack}
      selectedPackId={selectedPackId}
      loading={loading}
      isLoadingPacks={loading && packOptions.length === 0}
      preAssigned={starterPackPreAssigned}
      showStarterSuggestion={skippedLevelTest}
      onSelectPack={setSelectedPackId}
      onBack={() => setStep('goals')}
      onAssign={() => handleComplete(true)}
      onSkip={() => handleComplete(false)}
    />
  )
}
