'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ArrowRight,
  Check,
  Headphones,
  Keyboard,
  ListChecks,
  Loader2,
  RotateCcw,
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
import { notify } from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
  homeCardClass,
  homeIconBox,
  homePrimaryButton,
  homeSecondaryButton,
  homeSectionTitleClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'

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

const surface = `${homeCardClass} home-frosted-surface home-frosted-surface-soft relative p-6 sm:p-8`

export default function LevelExamClient(props: LevelExamClientProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function start() {
    startTransition(async () => {
      const result = await startLevelExamAction(props.level)
      if (!result.success) {
        notify.error(result.error)
        return
      }
      setAnswers({})
      setPhase({ name: 'running', attemptId: result.attemptId, questions: result.questions, index: 0 })
    })
  }

  function submit(attemptId: string, finalAnswers: Record<string, string>) {
    startTransition(async () => {
      const result = await submitLevelExamAction(attemptId, finalAnswers)
      if (!result.success) {
        notify.error(result.error)
        return
      }
      setPhase({ name: 'result', result })
      window.scrollTo({ top: 0, behavior: 'instant' })
      router.refresh()
    })
  }

  if (props.passedResult) {
    return <PassedSummary {...props} passedResult={props.passedResult} />
  }

  if (phase.name === 'intro') {
    return <ExamIntro {...props} onStart={start} starting={isPending} />
  }

  if (phase.name === 'result') {
    return <ExamResult {...props} result={phase.result} />
  }

  const question = phase.questions[phase.index]
  const total = phase.questions.length
  const isLast = phase.index === total - 1
  const current = answers[question.id] ?? ''

  function next() {
    if (!current.trim() || phase.name !== 'running') return
    if (isLast) {
      submit(phase.attemptId, answers)
      return
    }
    setPhase({ ...phase, index: phase.index + 1 })
  }

  return (
    <article className={surface} aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <span className={cn(homeSmallPillClass, 'bg-brand-accent')}>Prova final · {props.level}</span>
        <span className="font-heading text-sm font-bold tabular-nums text-brand-secondary">
          {phase.index + 1} / {total}
        </span>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full border border-brand-dark/30 bg-bg-primary"
        role="progressbar"
        aria-label="Progresso da prova"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={phase.index}
      >
        <div
          className="h-full rounded-full bg-brand-accent transition-[width] duration-300"
          style={{ width: `${(phase.index / total) * 100}%` }}
        />
      </div>

      <p className="mt-8 font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
        {KIND_LABEL[question.kind]}
      </p>

      {question.kind === 'listening' ? (
        <div className="mt-6 flex justify-center py-4">
          <AudioButton
            key={question.id}
            url={`/api/exam-audio/${phase.attemptId}/${question.id}`}
            autoPlay
            variant="game"
          />
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-3">
          <h2 className="min-w-0 flex-1 font-heading text-2xl font-bold leading-snug text-brand-dark sm:text-3xl">
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
            key={question.id}
            type="text"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={current}
            onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') next()
            }}
            placeholder="Digite a frase em inglês"
            aria-label="Sua resposta em inglês"
            className="w-full rounded-control border-2 border-brand-dark bg-bg-card px-4 py-3 font-body text-base text-brand-dark outline-none placeholder:text-brand-secondary/70 focus:ring-4 focus:ring-brand-accent/60"
          />
        ) : (
          <div className="grid gap-3" role="radiogroup" aria-label="Alternativas">
            {question.options?.map((option) => {
              const selected = current === option
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers({ ...answers, [question.id]: option })}
                  className={cn(
                    'rounded-control border-2 border-brand-dark px-4 py-3 text-left font-body text-base font-semibold text-brand-dark transition-colors',
                    selected ? 'bg-brand-accent' : 'bg-bg-card hover:bg-bg-primary'
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/home#trilha"
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
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLast ? 'Entregar prova' : 'Confirmar'}
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
}: LevelExamClientProps & { onStart: () => void; starting: boolean }) {
  const ready = totalPacks > 0 && donePacks >= totalPacks

  return (
    <article className={surface}>
      <div className={`h-12 w-12 ${homeIconBox}`}>
        <Trophy className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <SectionBadge label={ready ? 'Prova final' : 'Prova para pular'} className="mt-5" />
      <h1 className={`mt-4 ${homeSectionTitleClass}`}>
        Prova final do {level} · {levelLabel}
      </h1>
      <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
        {ready
          ? `Você concluiu as ${totalPacks} lições do ${level}. Agora mostre que domina o nível.`
          : `Você concluiu ${donePacks} de ${totalPacks} lições do ${level}. Se já domina o conteúdo, passar nesta prova conclui o nível inteiro.`}
      </p>

      <ul className="mt-6 grid gap-3 font-body text-sm text-brand-dark">
        <li className="flex items-start gap-3">
          <ListChecks className="mt-0.5 h-4 w-4 shrink-0" />
          {questionCount} questões tiradas de todas as lições do {level}.
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
          {nextLevel ? ` — e o ${nextLevel} é liberado.` : '.'}
        </li>
      </ul>

      <p className="mt-6 rounded-container border border-brand-dark/30 bg-bg-primary/70 p-4 font-body text-xs leading-relaxed text-brand-secondary">
        A correção aparece só no final. Se sair no meio, a mesma prova continua de onde parou por até
        1h30. Se não passar, dá para tentar de novo depois de uma pausa curta para revisar.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onStart}
          disabled={starting || cooldownMinutes > 0}
          className={cn(homePrimaryButton, 'w-full disabled:opacity-50 sm:w-auto')}
        >
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
          {cooldownMinutes > 0 ? `Disponível em ${cooldownMinutes} min` : 'Começar prova'}
        </button>
        <Link
          href="/home#trilha"
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
}: LevelExamClientProps & { result: Extract<SubmitExamResult, { success: true }> }) {
  const percent = Math.round((result.score / result.total) * 100)
  const mistakes = result.review.filter((item) => !item.correct)

  return (
    <article className={surface}>
      <div className={cn('h-14 w-14', homeIconBox, !result.passed && 'bg-bg-primary')}>
        {result.passed ? <Trophy className="h-7 w-7" strokeWidth={2.2} /> : <RotateCcw className="h-6 w-6" />}
      </div>
      <h1 className={`mt-5 ${homeSectionTitleClass}`}>
        {result.passed ? `Aprovado no ${level}!` : 'Ainda não foi desta vez'}
      </h1>
      <p className="mt-3 font-heading text-lg font-bold text-brand-dark">
        {result.score}/{result.total} acertos · {percent}%
      </p>
      <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
        {result.passed
          ? result.nextLevel
            ? `O ${result.nextLevel} está liberado. Sua trilha já começa nele.`
            : 'Você concluiu o último nível do currículo.'
          : `Para passar são ${passMark} acertos de ${questionCount}. Revise os assuntos abaixo e tente de novo em 30 minutos.`}
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
        <details className="group mt-6 rounded-container border border-brand-dark/30 bg-bg-primary/60">
          <summary className="cursor-pointer list-none px-4 py-3 font-heading text-sm font-bold text-brand-dark marker:content-none">
            Ver {mistakes.length} {mistakes.length === 1 ? 'erro' : 'erros'} com a resposta certa
          </summary>
          <ul className="grid gap-3 border-t border-brand-dark/20 p-4">
            {mistakes.map((item) => (
              <li key={item.id} className="font-body text-sm">
                <p className="font-semibold text-brand-dark">{item.prompt}</p>
                <p className="mt-1 flex items-start gap-2 text-brand-secondary">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {item.given ?? 'Sem resposta'}
                </p>
                <p className="mt-0.5 flex items-start gap-2 text-brand-dark">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {item.answer}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="mt-8">
        <Link
          href="/home#trilha"
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
      <div className={`h-12 w-12 ${homeIconBox}`}>
        <Trophy className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <h1 className={`mt-5 ${homeSectionTitleClass}`}>
        {level} · {levelLabel} aprovado
      </h1>
      <p className="mt-3 font-body text-sm text-brand-secondary sm:text-base">
        Você passou nesta prova com {passedResult.score}/{passedResult.total} acertos.
      </p>
      <div className="mt-6">
        <Link
          href="/home#trilha"
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
