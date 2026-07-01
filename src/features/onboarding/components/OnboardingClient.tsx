'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, ClipboardList, Loader2, Sparkles } from 'lucide-react'
import {
  completeOnboardingSetup,
  getOnboardingStarterPackOptions,
  saveOnboardingLevelProgress,
  saveOnboardingPlacementResult,
  saveOnboardingPreferences,
} from '@/app/onboarding-actions'
import {
  CEFR_LEVEL_LABELS,
  LEARNER_CEFR_LEVELS,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import {
  ONBOARDING_DAILY_GOALS,
  type OnboardingDailyGoalMinutes,
  type OnboardingInterestId,
} from '@/features/onboarding/lib/onboardingInterests'
import type { OnboardingWizardStep } from '@/features/onboarding/lib/onboardingStatus'
import type { RankedStarterPack } from '@/features/onboarding/lib/suggestStarterPack'
import {
  onboardingLevelLabelClass,
  onboardingLevelOptionClass,
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
}

export default function OnboardingClient({
  initialStep,
  initialInterests = [],
  initialDailyGoalMinutes = 10,
}: OnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingWizardStep>(initialStep)
  const [loading, setLoading] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<OnboardingInterestId[]>(initialInterests)
  const [dailyGoalMinutes, setDailyGoalMinutes] =
    useState<OnboardingDailyGoalMinutes>(initialDailyGoalMinutes)
  const [packOptions, setPackOptions] = useState<RankedStarterPack[]>([])
  const [recommendedPack, setRecommendedPack] = useState<RankedStarterPack | null>(null)
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)

  const finishAndRedirect = useCallback(() => {
    notify.success('Configuração concluída', {
      description: 'Sua jornada no Kivora começa agora.',
    })
    router.replace('/home')
    router.refresh()
  }, [router])

  const loadStarterPacks = useCallback(async (interests: OnboardingInterestId[]) => {
    setLoading(true)
    const result = await getOnboardingStarterPackOptions({ interests })
    setLoading(false)

    if (!result.ok) {
      notify.error(result.error)
      return false
    }

    setPackOptions(result.packs)
    setRecommendedPack(result.recommended)
    setSelectedPackId(result.recommended?.id ?? result.packs[0]?.id ?? null)
    return true
  }, [])

  useEffect(() => {
    if (initialStep !== 'starter-pack' || selectedInterests.length === 0) {
      return
    }

    void loadStarterPacks(selectedInterests)
  }, [initialStep, loadStarterPacks, selectedInterests])

  async function persistLevel(
    level: LearnerCefrLevel,
    levelSource: 'manual' | 'skipped'
  ): Promise<boolean> {
    setLoading(true)
    const result = await saveOnboardingLevelProgress({ level, levelSource })
    setLoading(false)

    if (!result.ok) {
      notify.error(result.error)
      return false
    }

    return true
  }

  async function handleSkipLevel() {
    const saved = await persistLevel('A2', 'skipped')
    if (!saved) return
    setStep('goals')
  }

  async function handleManualLevel(level: LearnerCefrLevel) {
    const saved = await persistLevel(level, 'manual')
    if (!saved) return
    setStep('goals')
  }

  async function handlePlacementComplete(result: {
    level: LearnerCefrLevel
    confidence: number
  }) {
    setLoading(true)
    const saveResult = await saveOnboardingPlacementResult(result)
    setLoading(false)

    if (!saveResult.ok) {
      notify.error(saveResult.error)
      return
    }

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
    })
    setLoading(false)

    if (!saveResult.ok) {
      notify.error(saveResult.error)
      return
    }

    const loaded = await loadStarterPacks(selectedInterests)
    if (!loaded) return
    setStep('starter-pack')
  }

  async function handleComplete(assignPack: boolean) {
    setLoading(true)
    const result = await completeOnboardingSetup({
      assignPack,
      packId: assignPack ? selectedPackId : null,
      interests: selectedInterests,
      dailyGoalMinutes,
    })
    setLoading(false)

    if (!result.ok) {
      notify.error(result.error)
      return
    }

    finishAndRedirect()
  }

  if (step === 'welcome') {
    return (
      <OnboardingShell
        step={1}
        totalSteps={TOTAL_STEPS}
        title="Bem-vindo ao Kivora English"
        subtitle="Vamos configurar seu perfil em poucos passos para personalizar sua experiência de estudo."
      >
        <div className="space-y-4" data-testid="onboarding-welcome-step">
          <p className="text-sm leading-relaxed text-brand-secondary">
            Você pode escolher seu nível de inglês, definir metas e receber um pack inicial sugerido.
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
        title="Como quer definir seu nível?"
        subtitle="Isso ajuda a sugerir packs e atividades na sua faixa."
      >
        <div className="space-y-3" data-testid="onboarding-method-step">
          <button
            type="button"
            disabled={loading}
            onClick={() => setStep('manual-level')}
            className={onboardingMethodOptionClass}
            data-testid="onboarding-method-manual"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-brand-dark bg-brand-accent text-brand-dark">
              <BookOpen className="h-5 w-5 shrink-0" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-base font-bold text-brand-dark">
                Eu sei meu nível
              </span>
              <span className="mt-1 block text-sm leading-snug text-brand-secondary">
                Escolha entre A1 e B2 manualmente.
              </span>
            </span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => setStep('placement-test')}
            className={onboardingMethodOptionClass}
            data-testid="onboarding-method-placement"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-brand-dark bg-brand-accent text-brand-dark">
              <ClipboardList className="h-5 w-5 shrink-0" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-base font-bold text-brand-dark">
                Fazer teste rápido
              </span>
              <span className="mt-1 block text-sm leading-snug text-brand-secondary">
                8 perguntas adaptativas em cerca de 2 minutos.
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
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-brand-dark bg-bg-card text-brand-dark">
              <Sparkles className="h-5 w-5 shrink-0" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-base font-bold text-brand-dark">
                Pular por agora
              </span>
              <span className="mt-1 block text-sm leading-snug text-brand-secondary">
                Começamos no nível A2 e você ajusta depois.
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

  if (step === 'manual-level') {
    return (
      <OnboardingShell
        step={3}
        totalSteps={TOTAL_STEPS}
        title="Qual é o seu nível?"
        subtitle="Escolha a faixa CEFR que melhor descreve seu inglês hoje."
      >
        <div className="space-y-2" data-testid="onboarding-manual-level-step">
          {LEARNER_CEFR_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              disabled={loading}
              onClick={() => handleManualLevel(level)}
              className={onboardingLevelOptionClass}
              data-testid={`onboarding-level-${level}`}
            >
              <span className={onboardingLevelLabelClass}>
                <span className="font-heading text-lg font-bold text-brand-dark">{level}</span>
                <span className="text-sm text-brand-secondary">{CEFR_LEVEL_LABELS[level]}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-brand-secondary" />
            </button>
          ))}

          <button
            type="button"
            disabled={loading}
            onClick={() => setStep('method')}
            className={`${onboardingSecondaryButton} mt-4`}
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
        loading={loading}
        onToggleInterest={toggleInterest}
        onSelectGoal={setDailyGoalMinutes}
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
      onSelectPack={setSelectedPackId}
      onBack={() => setStep('goals')}
      onAssign={() => handleComplete(true)}
      onSkip={() => handleComplete(false)}
    />
  )
}