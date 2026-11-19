'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import {
  ArrowRight,
  Check,
  Headphones,
  Keyboard,
  ListChecks,
  Loader2,
  Trophy,
  X,
} from 'lucide-react'
import {
  startLevelExamAction,
  submitLevelExamAction,
  type SubmitExamResult,
} from '@/app/curriculum-actions'
import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import type { PublicExamQuestion } from '@/features/curriculum/lib/levelExam'
import AudioButton from '@/components/ui/AudioButton'
import SectionBadge from '@/components/ui/SectionBadge'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { cn } from '@/lib/utils'
import {
  homePrimaryButton,
  homeSecondaryButton,
  homeSectionTitleClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'
import './activity.css'

type LevelExamClientProps = {
  level: LearnerCefrLevel
  levelLabel: string
  nextLevel: LearnerCefrLevel | null
  totalPacks: number
  donePacks: number
  questionCount: number
  passMark: number
  cooldownMinutes: number
  passedResult: { score: number; total: number } | null
}

type Phase =
  | { name: 'intro' }
  | { name: 'running'; attemptId: string; questions: PublicExamQuestion[]; index: number }
  | { name: 'result'; result: Extract<SubmitExamResult, { success: true }> }

const KIND_LABEL: Record<PublicExamQuestion['kind'], string> = {
  en_pt: 'O que significa?',
  pt_en: 'Como se diz em inglês?',
  listening: 'Ouça e escolha o que você ouviu',
  typing: 'Escreva em inglês',
}

const surface = 'assessment-screen'

export default function LevelExamClient(props: LevelExamClientProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const questionHeading = useRef<HTMLHeadingElement>(null)
  const resultHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (phase.name === 'running' && phase.questions[phase.index]?.kind !== 'typing') {
      questionHeading.current?.focus()
    }
    if (phase.name === 'result') resultHeading.current?.focus()
  }, [phase])

  function start() {
    setError('')
    startTransition(async () => {
      const result = await startLevelExamAction(props.level)
      if (!result.success) {
        setError(result.error)
        return
      }
      setAnswers({})
      setPhase({ name: 'running', attemptId: result.attemptId, questions: result.questions, index: 0 })
    })
  }

  function submit(attemptId: string, finalAnswers: Record<string, string>) {
    setError('')
    startTransition(async () => {
      const result = await submitLevelExamAction(attemptId, finalAnswers)
      if (!result.success) {
        setError(result.error)
        return
      }
      setPhase({ name: 'result', result })
      window.scrollTo({ top: 0, behavior: 'instant' })
      router.refresh()
    })
  }

  if (phase.name === 'result') {
    return <ExamResult {...props} result={phase.result} headingRef={resultHeading} />
  }

  if (props.passedResult) {
    return <PassedSummary {...props} passedResult={props.passedResult} />
  }

  if (phase.name === 'intro') {
    return <ExamIntro {...props} onStart={start} starting={isPending} error={error} />
  }

  const question = phase.questions[phase.index]
  const total = phase.questions.length
  const isLast = phase.index === total - 1
  const current = answers[question.id] ?? ''

  function next() {
    if (!current.trim() || isPending || phase.name !== 'running') return
    if (isLast) {
      submit(phase.attemptId, answers)
      return
    }
    setPhase({ ...phase, index: phase.index + 1 })
  }

  return (
    <article className={surface} aria-busy={isPending}>
      <div className="flex items-center justify-between gap-3">
        <span className="product-kicker">Prova final · {props.level}</span>
        <span className="font-heading text-sm font-bold tabular-nums text-brand-secondary">
          Questão {phase.index + 1} de {total}
        </span>
      </div>
      <div
        className="assessment-progress"
        role="progressbar"
        aria-label="Progresso da prova"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={phase.index}
      >
        <div
          className="assessment-progress-fill"
          style={{ width: `${(phase.index / total) * 100}%` }}
        />
      </div>

      {question.kind === 'listening' ? (
        <h2 ref={questionHeading} tabIndex={-1} className="assessment-question mt-8">{KIND_LABEL.listening}</h2>
      ) : (
        <p className="product-kicker mt-8">{KIND_LABEL[question.kind]}</p>
      )}

      {question.kind === 'listening' ? (
        <div className="mt-4 flex">
          <AudioButton
            key={question.id}
            url={`/api/exam-audio/${phase.attemptId}/${question.id}`}
            autoPlay
            variant="game"
          />
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-3">
          <h2 ref={questionHeading} tabIndex={-1} className="assessment-question min-w-0 flex-1" lang={question.kind === 'en_pt' ? 'en' : 'pt-BR'}>
            {question.prompt}
          </h2>
          {question.kind === 'en_pt' ? (
            <AudioButton key={question.id} fallbackText={question.prompt} className="shrink-0" />
          ) : null}
        </div>
      )}

      <div className="mt-6">
        {question.kind === 'typing' ? (
          <input
            disabled={isPending}
            key={question.id}
            type="text"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={current}
            onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) next()
            }}
            placeholder="Digite a frase em inglês"
            aria-label="Sua resposta em inglês"
            className="assessment-input"
          />
        ) : (
          <fieldset className="assessment-options" disabled={isPending}>
            <legend className="sr-only">Alternativas</legend>
            {question.options?.map((option) => (
              <label key={option} className="assessment-option">
                <input
                  type="radio"
                  name={`exam-${question.id}`}
                  checked={current === option}
                  onChange={() => setAnswers({ ...answers, [question.id]: option })}
                />
                <span lang={question.kind === 'en_pt' ? 'pt-BR' : 'en'}>{option}</span>
              </label>
            ))}
          </fieldset>
        )}
      </div>

      {error && <p className="product-error mt-5" role="alert">{error}</p>}
      <div className="assessment-actions assessment-actions-between">
        <Link
          href="/courses#trilha"
          transitionTypes={navBackTransitionTypes}
          className="text-center font-body text-sm font-semibold text-brand-secondary underline underline-offset-4 hover:text-brand-dark"
        >
          Sair e continuar depois
        </Link>
        <button
          type="button"
          onClick={next}
          disabled={!current.trim() || isPending}
          className={cn(homePrimaryButton, 'w-full disabled:opacity-50 sm:w-auto')}
        >
          {isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
          {isPending ? 'Entregando prova…' : isLast ? 'Entregar prova' : 'Confirmar'}
          {!isLast && !isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </div>
    </article>
  )
}

function ExamIntro({
  level,
  levelLabel,
  nextLevel,
  totalPacks,
  donePacks,
  questionCount,
  passMark,
  cooldownMinutes,
  onStart,
  starting,
  error,
}: LevelExamClientProps & { onStart: () => void; starting: boolean; error: string }) {
  const ready = totalPacks > 0 && donePacks >= totalPacks

  return (
    <article className={surface}>
      <SectionBadge label={ready ? 'Prova final' : 'Avanço de nível'} />
      <h1 className={`mt-4 ${homeSectionTitleClass}`}>
        Prova final do {level} · {levelLabel}
      </h1>
      <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
        {ready
          ? `Você concluiu as ${totalPacks} lições do ${level}. Confira o que reteve do conteúdo da trilha.`
          : `Você concluiu ${donePacks} de ${totalPacks} lições do ${level}. A aprovação conclui esta etapa da trilha.`}
      </p>

      <ul className="mt-6 grid gap-3 font-body text-sm text-brand-dark">
        <li className="flex items-start gap-3">
          <ListChecks className="mt-0.5 h-4 w-4 shrink-0" />
          {questionCount} questões com uma amostra das lições do {level}.
        </li>
        <li className="flex items-start gap-3">
          <Headphones className="mt-0.5 h-4 w-4 shrink-0" />
          Leitura, escuta e escolha da frase certa.
        </li>
        <li className="flex items-start gap-3">
          <Keyboard className="mt-0.5 h-4 w-4 shrink-0" />
          Algumas questões pedem para escrever em inglês.
        </li>
        <li className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          Para passar: {passMark} acertos ({Math.round((passMark / questionCount) * 100)}%)
          {' no total e pelo menos 60% em cada formato'}
          {nextLevel ? ` — e o ${nextLevel} é liberado.` : '.'}
        </li>
      </ul>

      <p className="assessment-note">
        Este checkpoint avalia uma amostra de frases. Não certifica CEFR nem avalia interação espontânea ou mediação. A correção aparece só no final. Se sair antes de entregar, você pode reabrir a mesma prova por até 1h30. As respostas ainda não entregues ficam nesta tela. Se não passar, dá para tentar de novo depois de uma pausa curta para revisar.
      </p>

      {error && <p className="product-error mt-5" role="alert">{error}</p>}
      <div className="assessment-actions">
        <button
          type="button"
          onClick={onStart}
          disabled={starting || cooldownMinutes > 0}
          className={cn(homePrimaryButton, 'w-full disabled:opacity-50 sm:w-auto')}
        >
          {starting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Trophy className="h-4 w-4" />}
          {cooldownMinutes > 0 ? `Disponível em ${cooldownMinutes} min` : starting ? 'Abrindo prova…' : 'Começar prova'}
        </button>
        <Link
          href="/courses#trilha"
          transitionTypes={navBackTransitionTypes}
          className={cn(homeSecondaryButton, 'w-full sm:w-auto')}
        >
          Voltar para a trilha
        </Link>
      </div>
    </article>
  )
}

function ExamResult({
  level,
  questionCount,
  passMark,
  result,
  headingRef,
}: LevelExamClientProps & { result: Extract<SubmitExamResult, { success: true }>; headingRef: React.Ref<HTMLHeadingElement> }) {
  const percent = Math.round((result.score / result.total) * 100)
  const mistakes = result.review.filter((item) => !item.correct)

  return (
    <article className={surface}>
      <SectionBadge label="Resultado da prova" />
      <h1 ref={headingRef} tabIndex={-1} className={`mt-4 ${homeSectionTitleClass}`}>
        {result.passed ? `Aprovado no ${level}!` : 'Ainda não foi desta vez'}
      </h1>
      <p className="assessment-score">
        {result.score}/{result.total} acertos · {percent}%
      </p>
      <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
        {result.passed
          ? result.nextLevel
            ? `O ${result.nextLevel} está liberado. Sua trilha já começa nele.`
            : 'Você concluiu o último nível do currículo.'
          : `Para passar são ${passMark} acertos de ${questionCount} e pelo menos 60% em cada formato, incluindo escuta e escrita. Revise os assuntos abaixo e tente de novo em 30 minutos.`}
      </p>

      {!result.passed && result.weakPacks.length > 0 ? (
        <div className="mt-6">
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
            Revise estes assuntos
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.weakPacks.map((pack) => (
              <span key={pack.id} className={homeSmallPillClass}>
                {pack.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {mistakes.length > 0 ? (
        <details className="assessment-review">
          <summary className="cursor-pointer py-3 font-heading text-sm font-bold text-brand-dark">
            Ver {mistakes.length} {mistakes.length === 1 ? 'erro' : 'erros'} com a resposta certa
          </summary>
          <ul className="grid gap-4 py-3">
            {mistakes.map((item) => (
              <li key={item.id} className="font-body text-sm">
                <p className="font-semibold text-brand-dark">{item.prompt}</p>
                <p className="mt-1 flex items-start gap-2 text-brand-secondary">
                  <X aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><span className="sr-only">Sua resposta: </span>{item.given ?? 'Sem resposta'}</span>
                </p>
                <p className="mt-0.5 flex items-start gap-2 text-brand-dark">
                  <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span><span className="sr-only">Resposta correta: </span>{item.answer}</span>
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="mt-8">
        <Link
          href="/courses#trilha"
          transitionTypes={navBackTransitionTypes}
          className={cn(homePrimaryButton, 'w-full sm:w-auto')}
        >
          {result.passed ? 'Ir para a trilha' : 'Voltar e revisar'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

function PassedSummary({
  level,
  levelLabel,
  passedResult,
}: LevelExamClientProps & { passedResult: { score: number; total: number } }) {
  return (
    <article className={surface}>
      <h1 className={`mt-5 ${homeSectionTitleClass}`}>
        {level} · {levelLabel} aprovado
      </h1>
      <p className="mt-3 font-body text-sm text-brand-secondary sm:text-base">
        Você passou nesta prova com {passedResult.score}/{passedResult.total} acertos.
      </p>
      <div className="mt-6">
        <Link
          href="/courses#trilha"
          transitionTypes={navBackTransitionTypes}
          className={cn(homePrimaryButton, 'w-full sm:w-auto')}
        >
          Voltar para a trilha
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
