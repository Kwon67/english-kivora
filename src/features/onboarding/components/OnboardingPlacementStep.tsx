'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import {
  finalizeCatSession,
  getCatQuestion,
  saveOnboardingPlacementResult,
  submitCatAnswer,
  type CatQuestionClient,
} from '@/app/onboarding-actions'
import { CEFR_LEVEL_LABELS } from '@/features/cefr/lib/cefrLevels'
import {
  CAT_MAX_QUESTIONS,
  STUDY_EXPERIENCE_OPTIONS,
  type StudyExperience,
} from '@/features/onboarding/lib/catLevels'
import type { CatEstimate, CatSessionState } from '@/features/onboarding/lib/catScoring'
import {
  onboardingActionRow,
  onboardingPlacementContextClass,
  onboardingPlacementOptionClass,
  onboardingPlacementOptionTextClass,
  onboardingPlacementPromptClass,
  onboardingPrimaryButton,
  onboardingSecondaryButton,
} from '@/features/onboarding/lib/onboardingUi'
import { notify } from '@/lib/toast'
import OnboardingShell from './OnboardingShell'

const ANSWER_FEEDBACK_MS = 320

type OnboardingPlacementStepProps = {
  loading: boolean
  onBack: () => void
  onComplete: (result: { displayLabel: string; atCeiling: boolean }) => void
}

export default function OnboardingPlacementStep({
  loading,
  onBack,
  onComplete,
}: OnboardingPlacementStepProps) {
  const [phase, setPhase] = useState<'intro' | 'test'>('intro')
  const [studyExperience, setStudyExperience] = useState<StudyExperience | null>(null)
  const [session, setSession] = useState<CatSessionState | null>(null)
  const [displayItem, setDisplayItem] = useState<CatQuestionClient | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const questionStartedAtRef = useRef<number>(Date.now())

  const questionNumber = session ? session.answers.length + 1 : 1
  const isAdvancing = selectedIndex !== null

  const loadFirstQuestion = useCallback(async (experience: StudyExperience | null) => {
    setIsLoadingQuestion(true)
    const result = await getCatQuestion({ studyExperience: experience })
    setIsLoadingQuestion(false)

    if (!result.ok) {
      notify.error(result.error)
      return false
    }

    setSession(result.session)
    setDisplayItem(result.question)
    questionStartedAtRef.current = Date.now()
    return true
  }, [])

  useEffect(() => {
    if (phase !== 'test' || session || isLoadingQuestion) return
    void loadFirstQuestion(studyExperience)
  }, [phase, session, isLoadingQuestion, loadFirstQuestion, studyExperience])

  async function startTest() {
    setPhase('test')
  }

  async function finalizePlacement(estimate: CatEstimate, abandoned = false) {
    setIsSubmitting(true)
    const saveResult = await saveOnboardingPlacementResult({
      level: estimate.level,
      confidence: estimate.confidence,
      atCeiling: estimate.atCeiling,
    })
    setIsSubmitting(false)

    if (!saveResult.ok) {
      notify.error(saveResult.error)
      return
    }

    const suffix = estimate.atCeiling ? ' (teto do teste)' : ''
    notify.success(
      abandoned ? 'Estimativa salva com respostas parciais' : 'Nivelamento concluído',
      {
        description: `Nível estimado: ${estimate.displayLabel}${suffix}`,
      }
    )

    onComplete({
      displayLabel: estimate.displayLabel,
      atCeiling: estimate.atCeiling,
    })
  }

  async function handleSelectOption(index: number) {
    if (!displayItem || !session || loading || isAdvancing || isSubmitting) return

    setSelectedIndex(index)
    const responseTimeMs = Date.now() - questionStartedAtRef.current

    window.setTimeout(async () => {
      const selectedOption = displayItem.options[index]
      const result = await submitCatAnswer({
        cardId: displayItem.cardId,
        selectedOption,
        responseTimeMs,
        session,
      })

      setSelectedIndex(null)

      if (!result.ok) {
        notify.error(result.error)
        return
      }

      setSession(result.session)

      if (result.finished && result.estimate) {
        await finalizePlacement(result.estimate)
        return
      }

      if (result.nextQuestion) {
        setDisplayItem(result.nextQuestion)
        questionStartedAtRef.current = Date.now()
        return
      }

      notify.error('Não foi possível carregar a próxima pergunta.')
    }, ANSWER_FEEDBACK_MS)
  }

  async function handleAbandonTest() {
    if (!session || session.answers.length === 0) {
      onBack()
      return
    }

    setIsSubmitting(true)
    const result = await finalizeCatSession({ session, abandoned: true })
    setIsSubmitting(false)

    if (!result.ok) {
      notify.error(result.error)
      return
    }

    await finalizePlacement(result.estimate, true)
  }

  if (phase === 'intro') {
    return (
      <OnboardingShell
        step={3}
        totalSteps={5}
        title="Teste adaptativo de nível"
        subtitle="Usamos frases reais dos packs do Kivora para estimar seu ponto de partida (A1–B1)."
      >
        <div className="space-y-4" data-testid="onboarding-placement-intro">
          <p className="text-sm leading-relaxed text-brand-secondary">
            São até {CAT_MAX_QUESTIONS} perguntas de múltipla escolha. Você pode sair a qualquer
            momento — calculamos uma estimativa com as respostas que já tiver.
          </p>

          <div>
            <p className="font-heading text-sm font-bold text-brand-dark">
              Há quanto tempo você estuda inglês? (opcional)
            </p>
            <p className="mt-1 text-sm text-brand-secondary">
              Isso só ajusta levemente a primeira pergunta. Não define seu nível final.
            </p>
            <div className="mt-3 space-y-2">
              {STUDY_EXPERIENCE_OPTIONS.map((option) => {
                const selected = studyExperience === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={loading}
                    aria-pressed={selected}
                    onClick={() =>
                      setStudyExperience((current) => (current === option.id ? null : option.id))
                    }
                    className={onboardingPlacementOptionClass(selected)}
                    data-testid={`onboarding-study-experience-${option.id}`}
                  >
                    <span className={onboardingPlacementOptionTextClass}>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className={onboardingActionRow}>
            <button
              type="button"
              disabled={loading}
              onClick={() => void startTest()}
              className={onboardingPrimaryButton}
              data-testid="onboarding-placement-start"
            >
              Começar teste
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
            <button type="button" disabled={loading} onClick={onBack} className={onboardingSecondaryButton}>
              Voltar
            </button>
          </div>
        </div>
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={5}
      title="Teste adaptativo"
      subtitle="Traduza a frase escolhendo a melhor opção em português."
    >
      <div className="space-y-4" data-testid="onboarding-placement-step">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
            Pergunta {questionNumber} de até {CAT_MAX_QUESTIONS}
          </p>
          <button
            type="button"
            disabled={loading || isSubmitting || isAdvancing}
            onClick={() => void handleAbandonTest()}
            className="text-xs font-semibold text-brand-secondary underline-offset-2 hover:underline"
            data-testid="onboarding-placement-abandon"
          >
            Sair do teste
          </button>
        </div>

        {isLoadingQuestion ? (
          <p className="flex items-center gap-2 text-sm text-brand-secondary" aria-live="polite">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            Carregando frases do teste...
          </p>
        ) : displayItem ? (
          <>
            <div className="min-w-0 space-y-2">
              <p className={onboardingPlacementPromptClass}>{displayItem.prompt}</p>
              <p className={onboardingPlacementContextClass}>
                Nível do pack: {displayItem.packLevel} · {CEFR_LEVEL_LABELS[displayItem.packLevel]}
              </p>
            </div>

            <div className="space-y-2" role="group" aria-label="Opções de tradução">
              {displayItem.options.map((option, index) => {
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={`${displayItem.cardId}-${index}`}
                    type="button"
                    disabled={loading || isAdvancing || isSubmitting}
                    aria-pressed={isSelected}
                    onClick={() => void handleSelectOption(index)}
                    className={onboardingPlacementOptionClass(isSelected)}
                    data-testid="onboarding-placement-option"
                  >
                    <span className={onboardingPlacementOptionTextClass}>{option}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-brand-secondary">Preparando próxima pergunta...</p>
        )}

        {selectedIndex !== null ? (
          <p className="flex items-center gap-2 text-sm text-brand-secondary" aria-live="polite">
            {displayItem &&
            session &&
            displayItem.options[selectedIndex] ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                Registrando resposta...
              </>
            ) : null}
          </p>
        ) : null}

        <button
          type="button"
          disabled={loading || isAdvancing || isSubmitting}
          onClick={onBack}
          className={`${onboardingSecondaryButton} mt-2`}
        >
          Voltar
        </button>

        {isSubmitting ? (
          <p className="flex items-center gap-2 text-sm text-brand-secondary" aria-live="polite">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            Salvando resultado e preparando sua rotina...
          </p>
        ) : null}
      </div>
    </OnboardingShell>
  )
}