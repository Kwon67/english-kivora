'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { generatePlacementAiItem } from '@/app/onboarding-actions'
import { CEFR_LEVEL_LABELS, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import {
  getPlacementItemById,
  PLACEMENT_MAX_QUESTIONS,
  type PlacementItem,
} from '@/features/onboarding/lib/placementItems'
import {
  createPlacementSession,
  estimatePlacementLevel,
  getNextPlacementItem,
  isPlacementSessionComplete,
  recordPlacementAnswer,
  type PlacementSessionState,
} from '@/features/onboarding/lib/placementScoring'
import {
  onboardingActionRow,
  onboardingAiBadge,
  onboardingPlacementContextClass,
  onboardingPlacementOptionClass,
  onboardingPlacementOptionTextClass,
  onboardingPlacementPromptClass,
  onboardingPlacementResultCard,
  onboardingPrimaryButton,
  onboardingSecondaryButton,
} from '@/features/onboarding/lib/onboardingUi'
import OnboardingShell from './OnboardingShell'

const ANSWER_FEEDBACK_MS = 280
const AI_PREFETCH_AFTER_ANSWERS = 3

function collectShownPrompts(shownIds: string[], dynamicItems: PlacementItem[]): string[] {
  return shownIds
    .map((id) => getPlacementItemById(id, dynamicItems)?.prompt)
    .filter((prompt): prompt is string => Boolean(prompt))
}

function createInitialPlacementState(): {
  session: PlacementSessionState
  displayItem: PlacementItem | null
} {
  const session = createPlacementSession()
  return {
    session,
    displayItem: getNextPlacementItem(session),
  }
}

type OnboardingPlacementStepProps = {
  loading: boolean
  onBack: () => void
  onComplete: (result: { level: LearnerCefrLevel; confidence: number }) => void
}

export default function OnboardingPlacementStep({
  loading,
  onBack,
  onComplete,
}: OnboardingPlacementStepProps) {
  const [initialPlacement] = useState(createInitialPlacementState)
  const [session, setSession] = useState<PlacementSessionState>(initialPlacement.session)
  const [displayItem, setDisplayItem] = useState<PlacementItem | null>(initialPlacement.displayItem)
  const [dynamicItems, setDynamicItems] = useState<PlacementItem[]>([])
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const prefetchStartedRef = useRef<Set<string>>(new Set())

  const estimate = estimatePlacementLevel(session.answers)
  const questionNumber = Math.min(session.answers.length + 1, PLACEMENT_MAX_QUESTIONS)
  const isAdvancing = selectedIndex !== null
  const isAiItem = displayItem?.id.startsWith('ai-') ?? false

  const prefetchAiItem = useCallback(
    async (level: LearnerCefrLevel, avoidPrompts: string[]) => {
      setIsGeneratingAi(true)
      const result = await generatePlacementAiItem({ level, avoidPrompts })
      setIsGeneratingAi(false)

      if (result.ok && result.item) {
        setDynamicItems((current) => {
          if (current.some((item) => item.id === result.item!.id)) return current
          return [...current, result.item!]
        })
      }
    },
    []
  )

  useEffect(() => {
    if (session.answers.length < AI_PREFETCH_AFTER_ANSWERS) return
    if (isPlacementSessionComplete(session)) return

    const prefetchKey = `${session.focusLevel}-${session.answers.length}`
    if (prefetchStartedRef.current.has(prefetchKey)) return
    prefetchStartedRef.current.add(prefetchKey)

    const avoidPrompts = collectShownPrompts(session.shownItemIds, dynamicItems)
    void prefetchAiItem(session.focusLevel, avoidPrompts)
  }, [session, dynamicItems, prefetchAiItem])

  function handleSelectOption(index: number) {
    if (!displayItem || loading || isAdvancing) return

    setSelectedIndex(index)

    window.setTimeout(() => {
      const nextSession = recordPlacementAnswer(session, displayItem.id, index, { dynamicItems })
      setSession(nextSession)
      setSelectedIndex(null)

      if (isPlacementSessionComplete(nextSession)) {
        setShowResult(true)
        return
      }

      setDisplayItem(getNextPlacementItem(nextSession, { dynamicItems }))
    }, ANSWER_FEEDBACK_MS)
  }

  if (showResult) {
    return (
      <OnboardingShell
        step={3}
        totalSteps={5}
        title="Resultado do teste"
        subtitle="Usamos suas respostas para estimar o melhor ponto de partida."
      >
        <div className="space-y-4" data-testid="onboarding-placement-result">
          <div className={onboardingPlacementResultCard}>
            <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
              Nível estimado
            </p>
            <p className="mt-2 font-heading text-[clamp(2.5rem,10vw,2.75rem)] font-bold leading-none text-brand-dark">
              {estimate.level}
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-brand-secondary">
              {CEFR_LEVEL_LABELS[estimate.level]}
            </p>
            <p className="mt-3 text-sm text-brand-secondary">
              Confiança do teste: {estimate.confidence}%
            </p>
          </div>

          <p className="text-sm leading-relaxed text-brand-secondary">
            Você pode ajustar seu nível depois nas configurações. Agora vamos personalizar sua meta
            diária e interesses.
          </p>

          <div className={onboardingActionRow}>
            <button
              type="button"
              disabled={loading}
              onClick={() => onComplete({ level: estimate.level, confidence: estimate.confidence })}
              className={onboardingPrimaryButton}
              data-testid="onboarding-placement-continue"
            >
              Continuar
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
            <button type="button" disabled={loading} onClick={onBack} className={onboardingSecondaryButton}>
              Voltar
            </button>
          </div>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-brand-secondary" aria-live="polite">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              Salvando resultado...
            </p>
          ) : null}
        </div>
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={5}
      title="Teste rápido de nível"
      subtitle="Responda com calma — são poucas perguntas adaptativas."
    >
      <div className="space-y-4" data-testid="onboarding-placement-step">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
            Pergunta {questionNumber} de {PLACEMENT_MAX_QUESTIONS}
          </p>
          {isAiItem ? (
            <span className={onboardingAiBadge} data-testid="onboarding-placement-ai-badge">
              <Sparkles className="h-3 w-3 shrink-0" />
              IA
            </span>
          ) : null}
        </div>

        {displayItem ? (
          <>
            <div className="min-w-0 space-y-2">
              <p className={onboardingPlacementPromptClass}>{displayItem.prompt}</p>
              {displayItem.context ? (
                <p className={onboardingPlacementContextClass}>{displayItem.context}</p>
              ) : null}
            </div>

            <div className="space-y-2" role="group" aria-label="Opções de resposta">
              {displayItem.options.map((option, index) => {
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={`${displayItem.id}-${index}`}
                    type="button"
                    disabled={loading || isAdvancing}
                    aria-pressed={isSelected}
                    onClick={() => handleSelectOption(index)}
                    className={onboardingPlacementOptionClass(isSelected)}
                    data-testid="onboarding-placement-option"
                  >
                    <span className={onboardingPlacementOptionTextClass}>{option}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : isGeneratingAi ? (
          <p
            className="flex min-w-0 items-center gap-2 break-words text-sm text-brand-secondary"
            aria-live="polite"
            data-testid="onboarding-placement-ai-loading"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            Gerando pergunta personalizada...
          </p>
        ) : (
          <p className="text-sm text-brand-secondary">Preparando próxima pergunta...</p>
        )}

        <button
          type="button"
          disabled={loading || isAdvancing}
          onClick={onBack}
          className={`${onboardingSecondaryButton} mt-2`}
        >
          Voltar
        </button>
      </div>
    </OnboardingShell>
  )
}