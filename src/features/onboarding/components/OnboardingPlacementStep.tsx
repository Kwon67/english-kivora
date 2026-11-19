'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Languages, Loader2 } from 'lucide-react'
import {
  finalizeCatSession,
  getCatQuestion,
  saveOnboardingPlacementResult,
  submitCatAnswer,
  type CatQuestionClient,
} from '@/app/onboarding-actions'
import {
  CAT_MIN_QUESTIONS,
  CAT_MAX_QUESTIONS,
  STUDY_EXPERIENCE_OPTIONS,
  type StudyExperience,
} from '@/features/onboarding/lib/catLevels'
import type { CatEstimate, CatSessionState } from '@/features/onboarding/lib/catScoring'
import {
  onboardingActionRow,
  onboardingPlacementOptionClass,
  onboardingPlacementOptionTextClass,
  onboardingPlacementPromptClass,
  onboardingPrimaryButton,
  onboardingSecondaryButton,
} from '@/features/onboarding/lib/onboardingUi'
import { notify } from '@/lib/toast'
import styles from './Onboarding.module.css'
import OnboardingShell from './OnboardingShell'
import { onboardingConnectionError } from '../lib/onboardingConnectionError'

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
  const [error, setError] = useState('')
  const prompt = useRef<HTMLHeadingElement>(null)
  const [phase, setPhase] = useState<'intro' | 'test'>('intro')
  const [studyExperience, setStudyExperience] = useState<StudyExperience | null>(null)
  const [session, setSession] = useState<CatSessionState | null>(null)
  const [displayItem, setDisplayItem] = useState<CatQuestionClient | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unsavedEstimate, setUnsavedEstimate] = useState<{ estimate: CatEstimate; abandoned: boolean } | null>(null)
  const questionStartedAtRef = useRef<number>(0)

  const questionNumber = session ? session.answers.length + 1 : 1
  const answeredQuestions = session?.answers.length ?? 0
  const questionProgress = Math.round((answeredQuestions / CAT_MAX_QUESTIONS) * 100)
  const isAdvancing = selectedIndex !== null

  const loadFirstQuestion = useCallback(async (experience: StudyExperience | null) => {
    setError('')
    setIsLoadingQuestion(true)
    const result = await getCatQuestion({ studyExperience: experience }).catch(onboardingConnectionError)
    setIsLoadingQuestion(false)

    if (!result.ok) {
      setError(result.error)
      return false
    }

    setSession(result.session)
    setDisplayItem(result.question)
    questionStartedAtRef.current = window.performance.now()
    return true
  }, [])

  useEffect(() => {
    if (phase !== 'test' || session || isLoadingQuestion || error) return
    void loadFirstQuestion(studyExperience)
  }, [phase, session, isLoadingQuestion, loadFirstQuestion, studyExperience, error])

  useEffect(() => {
    if (displayItem) prompt.current?.focus()
  }, [displayItem])

  async function startTest() {
    setPhase('test')
  }

  async function finalizePlacement(estimate: CatEstimate, abandoned = false) {
    setError('')
    setIsSubmitting(true)
    const saveResult = await saveOnboardingPlacementResult({
      level: estimate.level,
      confidence: estimate.confidence,
      atCeiling: estimate.atCeiling,
    }).catch(onboardingConnectionError)
    setIsSubmitting(false)

    if (!saveResult.ok) {
      setUnsavedEstimate({ estimate, abandoned })
      setError(saveResult.error)
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

    setError('')
    setSelectedIndex(index)
    const responseTimeMs = Math.max(0, Math.round(window.performance.now() - questionStartedAtRef.current))

    window.setTimeout(async () => {
      const selectedOption = displayItem.options[index]
      const result = await submitCatAnswer({
        cardId: displayItem.cardId,
        selectedOption,
        responseTimeMs,
        session,
      }).catch(onboardingConnectionError)

      setSelectedIndex(null)

      if (!result.ok) {
        setError(result.error)
        return
      }

      setSession(result.session)

      if (result.finished && result.estimate) {
        await finalizePlacement(result.estimate)
        return
      }

      if (result.nextQuestion) {
        setDisplayItem(result.nextQuestion)
        questionStartedAtRef.current = window.performance.now()
        return
      }

      setError('Não foi possível carregar a próxima pergunta.')
    }, ANSWER_FEEDBACK_MS)
  }

  async function handleAbandonTest() {
    if (!session || session.answers.length === 0) {
      onBack()
      return
    }

    setError('')
    setIsSubmitting(true)
    const result = await finalizeCatSession({ session, abandoned: true }).catch(onboardingConnectionError)
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error)
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
        subtitle="Uma avaliação curta com frases reais do Kivora para estimar seu ponto de partida (A1–B2)."
      >
        <div className="space-y-5" data-testid="onboarding-placement-intro">
          <p className="text-sm leading-relaxed text-brand-secondary">
            De {CAT_MIN_QUESTIONS} a {CAT_MAX_QUESTIONS} traduções nos dois sentidos. A dificuldade se
            adapta às respostas. Se sair após responder, você pode salvar uma estimativa parcial.
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
    >
      <div className="space-y-4" data-testid="onboarding-placement-step">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
            Pergunta {questionNumber} de até {CAT_MAX_QUESTIONS}
          </p>
          <button
            type="button"
            disabled={loading || isSubmitting || isAdvancing || !!unsavedEstimate}
            onClick={() => void handleAbandonTest()}
            className="product-text-link min-h-11 text-sm"
            data-testid="onboarding-placement-abandon"
          >
            Sair do teste
          </button>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-brand-border"
          role="progressbar"
          aria-label="Perguntas respondidas"
          aria-valuemin={0}
          aria-valuemax={CAT_MAX_QUESTIONS}
          aria-valuenow={answeredQuestions}
        >
          <div
            className="h-full rounded-full bg-brand-dark transition-[width] duration-300"
            style={{ width: `${Math.max(4, questionProgress)}%` }}
          />
        </div>

        {isLoadingQuestion ? (
          <p className="flex items-center gap-2 text-sm text-brand-secondary" aria-live="polite">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />
            Carregando frases do teste...
          </p>
        ) : unsavedEstimate ? (
          <button type="button" disabled={isSubmitting} className={onboardingPrimaryButton}
            onClick={() => void finalizePlacement(unsavedEstimate.estimate, unsavedEstimate.abandoned)}>
            Tentar salvar o resultado novamente
          </button>
        ) : displayItem ? (
          <>
            <div className="min-w-0 space-y-2">
              <p className="flex items-center gap-2 text-xs font-semibold text-brand-secondary">
                <Languages className="h-4 w-4 shrink-0" />
                {displayItem.instruction}
              </p>
              <h2 ref={prompt} tabIndex={-1} data-onboarding-question className={onboardingPlacementPromptClass}>{displayItem.prompt}</h2>
            </div>

            <div
              className="space-y-2"
              role="group"
              aria-label={displayItem.instruction}
            >
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
        ) : !error ? (
          <p role="status" className="text-sm text-brand-secondary">Preparando próxima pergunta…</p>
        ) : null}

        {error && (
          <div>
            <p role="alert" className={styles.feedback}>{error}</p>
            {!session && <button type="button" onClick={() => void loadFirstQuestion(studyExperience)} className={onboardingPrimaryButton}>Tentar novamente</button>}
          </div>
        )}

        {selectedIndex !== null ? (
          <p className="flex items-center gap-2 text-sm text-brand-secondary" aria-live="polite">
            {displayItem &&
            session &&
            displayItem.options[selectedIndex] ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />
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
            <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />
            Salvando resultado e preparando sua rotina...
          </p>
        ) : null}
      </div>
    </OnboardingShell>
  )
}
