'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { Popover } from 'radix-ui'
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  MessageCircle,
  Plane,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import { startCurriculumPackAction } from '@/app/curriculum-actions'
import { getDisplayPackDescription } from '@/features/study/lib/packDescription'
import { CEFR_LEVEL_LABELS, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import {
  getPathNodeOffset,
  getVisibleNodes,
  type LearningPath as LearningPathData,
  type PathNode,
  type PathUnit,
} from '@/features/study/lib/learningPath'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { notify } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { homePrimaryButton, homeSecondaryButton, homeSmallPillClass } from '@/lib/homeStyles'

type LearningPathProps = {
  path: LearningPathData
}

/**
 * Ícone da bolinha = o ASSUNTO do pack (categoria do catálogo). Num nível longo, é o que deixa o
 * aluno ver de relance que a trilha alterna gramática, conversa e situações reais.
 */
function CategoryIcon({ category, className }: { category: string | null; className: string }) {
  switch (category) {
    case 'Gramática':
      return <BookOpen className={className} strokeWidth={2.4} />
    case 'Conversação':
      return <MessageCircle className={className} strokeWidth={2.4} />
    case 'Viagem':
      return <Plane className={className} strokeWidth={2.4} />
    case 'Negócios':
      return <Briefcase className={className} strokeWidth={2.4} />
    default:
      return <Sparkles className={className} strokeWidth={2.4} />
  }
}

function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return day && month ? `${day}/${month}` : isoDate
}

export default function LearningPath({ path }: LearningPathProps) {
  const [openLevels, setOpenLevels] = useState<Set<LearnerCefrLevel>>(
    () => new Set([path.currentLevel])
  )
  const [expandedLevels, setExpandedLevels] = useState<Set<LearnerCefrLevel>>(() => new Set())
  const currentRef = useRef<HTMLLIElement | null>(null)
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const jump = useJumpToCurrent(sectionRef, currentRef, [...openLevels, '|', ...expandedLevels].join())

  function toggleIn(setter: typeof setOpenLevels, level: LearnerCefrLevel) {
    setter((previous) => {
      const next = new Set(previous)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  function scrollToCurrent() {
    // O nível da lição atual pode ter sido fechado pelo aluno; reabre antes de rolar.
    setOpenLevels((previous) => new Set(previous).add(path.currentLevel))
    requestAnimationFrame(() => {
      currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <div ref={sectionRef} className="relative space-y-4">
      {path.units.map((unit) => (
        <PathUnitBlock
          key={unit.level}
          unit={unit}
          isCurrentLevel={unit.level === path.currentLevel}
          open={openLevels.has(unit.level)}
          expanded={expandedLevels.has(unit.level)}
          onToggle={() => toggleIn(setOpenLevels, unit.level)}
          onToggleExpanded={() => toggleIn(setExpandedLevels, unit.level)}
          currentRef={currentRef}
        />
      ))}

      {path.nextLevel ? (
        <NextLevelMilestone level={path.nextLevel} currentLevel={path.currentLevel} />
      ) : null}

      {jump.visible && path.current ? (
        <button
          type="button"
          onClick={scrollToCurrent}
          aria-label="Voltar para a lição atual"
          className="learning-path-jump fixed right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-dark bg-bg-card text-brand-dark transition-transform hover:-translate-y-0.5 sm:right-8"
        >
          {jump.direction === 'up' ? (
            <ArrowUp className="h-5 w-5" strokeWidth={2.6} />
          ) : (
            <ArrowDown className="h-5 w-5" strokeWidth={2.6} />
          )}
        </button>
      ) : null}
    </div>
  )
}

/**
 * Botão flutuante "voltar para onde parei", como a seta do Duolingo: aparece só quando a trilha
 * está na tela mas a lição atual não está, e aponta para o lado em que ela ficou.
 */
function useJumpToCurrent(
  sectionRef: React.RefObject<HTMLDivElement | null>,
  currentRef: React.RefObject<HTMLLIElement | null>,
  /** Muda quando um nível abre/fecha — a bolinha atual pode ter entrado ou saído do DOM. */
  layoutKey: string
) {
  const [sectionVisible, setSectionVisible] = useState(false)
  const [current, setCurrent] = useState<{ visible: boolean; direction: 'up' | 'down' }>({
    visible: true,
    direction: 'down',
  })

  useEffect(() => {
    const section = sectionRef.current
    const target = currentRef.current
    if (!section || typeof IntersectionObserver === 'undefined') return

    const sectionObserver = new IntersectionObserver(([entry]) => {
      setSectionVisible(entry.isIntersecting)
    })
    sectionObserver.observe(section)

    // Sem alvo no DOM (nível fechado) o observer nunca dispara; o callback trata isso como
    // "fora da tela", que é a verdade para quem está olhando.
    const currentObserver = new IntersectionObserver(([entry]) => {
      setCurrent({
        visible: entry.isIntersecting,
        direction: entry.boundingClientRect.top < 0 ? 'up' : 'down',
      })
    })
    if (target) currentObserver.observe(target)
    else setCurrent((previous) => (previous.visible ? { ...previous, visible: false } : previous))

    return () => {
      sectionObserver.disconnect()
      currentObserver.disconnect()
    }
  }, [sectionRef, currentRef, layoutKey])

  return { visible: sectionVisible && !current.visible, direction: current.direction }
}

function PathUnitBlock({
  unit,
  isCurrentLevel,
  open,
  expanded,
  onToggle,
  onToggleExpanded,
  currentRef,
}: {
  unit: PathUnit
  isCurrentLevel: boolean
  open: boolean
  expanded: boolean
  onToggle: () => void
  onToggleExpanded: () => void
  currentRef: React.RefObject<HTMLLIElement | null>
}) {
  const total = unit.nodes.length
  const passed = unit.status === 'passed'
  // Concluídas recentes + no máximo 3 pendentes. Expandir revela só histórico, nunca mais pendentes.
  const { visible, hiddenDone, hiddenPending } = getVisibleNodes(unit.nodes, expanded)
  const panelId = `learning-path-unit-${unit.level}`

  // Posição da página no clique em "Mostrar mais". "Mostrar menos" devolve o aluno exatamente
  // para ela — sem isso, ao comprimir ele ficaria perdido longe da lição atual.
  const scrollBeforeExpand = useRef<number | null>(null)
  const wasExpanded = useRef(expanded)

  useLayoutEffect(() => {
    // Layout effect: roda depois de o nível encolher e antes da pintura, então não há um quadro
    // piscando na posição errada.
    if (wasExpanded.current && !expanded && scrollBeforeExpand.current != null) {
      window.scrollTo({ top: scrollBeforeExpand.current, behavior: 'instant' })
      scrollBeforeExpand.current = null
    }
    wasExpanded.current = expanded
  }, [expanded])

  function handleToggleExpanded() {
    if (!expanded) scrollBeforeExpand.current = window.scrollY
    onToggleExpanded()
  }

  return (
    <section aria-label={`Nível ${unit.level}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="learning-path-unit-banner flex w-full items-center justify-between gap-4 rounded-container border-2 border-brand-dark bg-brand-dark px-5 py-4 text-left text-white transition-transform active:translate-y-0.5"
      >
        <span className="min-w-0">
          <span className="block font-heading text-[0.7rem] font-bold uppercase tracking-[0.18em] text-brand-accent">
            Nível {unit.level}
          </span>
          <span className="mt-1 block truncate font-heading text-lg font-bold sm:text-xl">
            {unit.label}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="font-heading text-sm font-bold tabular-nums text-white/80">
            {passed ? (
              <span className="inline-flex items-center gap-1.5 text-brand-accent">
                <Trophy className="h-4 w-4" strokeWidth={2.6} />
                Aprovado
              </span>
            ) : (
              <span aria-label={`${unit.doneCount} de ${total} lições concluídas`}>
                {unit.doneCount}/{total}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn('h-5 w-5 shrink-0 transition-transform', open && 'rotate-180')}
            strokeWidth={2.6}
            aria-hidden="true"
          />
        </span>
      </button>

      {open ? (
        <div id={panelId} className="relative py-8">
          {hiddenDone > 0 || expanded ? (
            <div className="mb-8 flex justify-center">
              <button
                type="button"
                onClick={handleToggleExpanded}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="learning-path-more inline-flex items-center gap-2 rounded-control border-2 border-brand-dark bg-bg-card px-5 py-2.5 font-heading text-sm font-bold text-brand-dark transition-colors hover:bg-brand-accent"
              >
                {expanded
                  ? 'Mostrar menos'
                  : `Mostrar mais (${hiddenDone} ${hiddenDone === 1 ? 'concluída' : 'concluídas'})`}
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', !expanded && 'rotate-180')}
                  strokeWidth={2.6}
                  aria-hidden="true"
                />
              </button>
            </div>
          ) : null}

          <ol className="relative flex flex-col items-center gap-5">
            {visible.map((node, index) => (
              <li
                key={node.key}
                ref={node.state === 'current' ? currentRef : undefined}
                className={cn(
                  'learning-path-offset flex justify-center',
                  // Espaço para o balão "Começar", que flutua acima da bolinha atual.
                  node.state === 'current' && 'pt-10'
                )}
                style={{ '--path-offset': getPathNodeOffset(index) } as React.CSSProperties}
              >
                <PathNodeButton node={node} />
              </li>
            ))}
          </ol>

          {hiddenPending > 0 ? (
            <p className="mt-6 text-center font-body text-xs font-semibold text-brand-secondary">
              + {hiddenPending} {hiddenPending === 1 ? 'lição' : 'lições'} até a prova final
            </p>
          ) : null}

          <LevelExamNode unit={unit} isCurrentLevel={isCurrentLevel} />
        </div>
      ) : null}
    </section>
  )
}

/**
 * A prova final no fim de cada nível. Três estados:
 * - aprovada: troféu escuro com a nota;
 * - pronta (todas as lições feitas): troféu em destaque, é o próximo passo;
 * - ainda faltam lições: troféu apagado com a contagem, e o atalho "prova para pular" para quem
 *   já domina o nível — a mesma prova, com a mesma régua de 80%.
 */
function LevelExamNode({ unit, isCurrentLevel }: { unit: PathUnit; isCurrentLevel: boolean }) {
  const { exam, level } = unit
  const href = `/exam/${level}`

  if (exam.status === 'passed') {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-dark bg-brand-dark text-brand-accent">
          <Trophy className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <p className="font-heading text-sm font-bold text-brand-dark">Prova do {level} aprovada</p>
        {exam.score != null && exam.total ? (
          <p className="font-body text-xs font-semibold text-brand-secondary">
            {exam.score}/{exam.total} acertos
          </p>
        ) : null}
      </div>
    )
  }

  if (!isCurrentLevel) return null

  const ready = exam.status === 'ready'

  return (
    <div className="mt-8 flex flex-col items-center gap-3 text-center">
      <Link
        href={href}
        transitionTypes={navForwardTransitionTypes}
        prefetch={false}
        aria-label={`Prova final do ${level}`}
        className={cn(
          'learning-path-node relative inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-brand-dark',
          ready ? 'bg-brand-accent text-brand-dark' : 'bg-bg-primary text-brand-secondary'
        )}
      >
        {ready ? (
          <span
            aria-hidden="true"
            className="learning-path-pulse pointer-events-none absolute -inset-2 rounded-full border-2 border-brand-dark/40"
          />
        ) : null}
        <Trophy className="h-7 w-7" strokeWidth={2.2} />
      </Link>
      <div>
        <p className="font-heading text-sm font-bold text-brand-dark">Prova final do {level}</p>
        <p className="mt-1 max-w-xs font-body text-xs font-semibold text-brand-secondary">
          {ready
            ? 'Você concluiu todas as lições. Passe com 80% para liberar o próximo nível.'
            : `Libera ao concluir ${exam.remainingPacks === 1 ? 'a última lição' : `as ${exam.remainingPacks} lições que faltam`}.`}
        </p>
      </div>
      {!ready ? (
        <Link
          href={href}
          transitionTypes={navForwardTransitionTypes}
          prefetch={false}
          className="font-body text-xs font-semibold text-brand-dark underline underline-offset-4 hover:opacity-70"
        >
          Já domina o {level}? Fazer a prova para pular
        </Link>
      ) : null}
    </div>
  )
}

const STATE_LABEL: Record<PathNode['state'], string> = {
  done: 'concluída',
  current: 'você está aqui',
  open: 'próxima',
}

function PathNodeButton({ node }: { node: PathNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isCurrent = node.state === 'current'
  const isDone = node.state === 'done'
  const description = getDisplayPackDescription(node.packDescription, '')

  function handleStart() {
    startTransition(async () => {
      const result = await startCurriculumPackAction(node.packId)
      if (!result.success) {
        notify.error(result.error)
        return
      }
      router.push(`/play/${result.assignmentId}`, { transitionTypes: navForwardTransitionTypes })
    })
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="relative flex flex-col items-center">
        {isCurrent && !open ? (
          <span
            aria-hidden="true"
            className="learning-path-bob pointer-events-none absolute -top-11 z-10 whitespace-nowrap rounded-control border-2 border-brand-dark bg-bg-card px-3 py-1.5 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark after:absolute after:left-1/2 after:top-full after:-mt-px after:-translate-x-1/2 after:border-[7px] after:border-transparent after:border-t-brand-dark after:content-['']"
          >
            Começar
          </span>
        ) : null}

        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={`${node.packName}, ${STATE_LABEL[node.state]}`}
            className={cn(
              'learning-path-node relative inline-flex items-center justify-center rounded-full border-2 border-brand-dark text-brand-dark',
              isCurrent ? 'h-[4.5rem] w-[4.5rem]' : 'h-16 w-16',
              isDone || isCurrent ? 'bg-brand-accent' : 'bg-bg-card text-brand-secondary'
            )}
          >
            {isCurrent ? (
              <span
                aria-hidden="true"
                className="learning-path-pulse pointer-events-none absolute -inset-2 rounded-full border-2 border-brand-dark/40"
              />
            ) : null}
            <CategoryIcon category={node.category} className={isCurrent ? 'h-7 w-7' : 'h-6 w-6'} />
            {isDone ? (
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg-primary bg-brand-dark text-brand-accent"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3.4} />
              </span>
            ) : null}
          </button>
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          sideOffset={14}
          collisionPadding={16}
          className="learning-path-popover z-50 w-[min(20rem,calc(100vw-2rem))] rounded-container border-2 border-brand-dark bg-bg-card p-5 text-brand-dark"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(homeSmallPillClass, 'bg-brand-accent')}>{node.level}</span>
              {node.category ? <span className={homeSmallPillClass}>{node.category}</span> : null}
            </div>
            <Popover.Close
              aria-label="Fechar"
              className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-secondary transition-colors hover:bg-bg-primary hover:text-brand-dark"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </Popover.Close>
          </div>

          <h3 className="mt-3 font-heading text-lg font-bold leading-snug">{node.packName}</h3>
          {description ? (
            <p className="mt-1.5 line-clamp-2 font-body text-sm leading-relaxed text-brand-secondary">
              {description}
            </p>
          ) : null}
          <p className="mt-3 font-body text-xs font-semibold text-brand-secondary">
            {isDone
              ? `Concluída ${node.timesCompleted === 1 ? '1 vez' : `${node.timesCompleted} vezes`}${node.lastStudiedDate ? ` · última em ${formatShortDate(node.lastStudiedDate)}` : ''}`
              : isCurrent
                ? 'Você parou aqui. É a próxima lição do seu nível.'
                : 'Logo depois da lição atual. Pode adiantar se quiser.'}
          </p>

          <div className="mt-4">
            {node.playAssignmentId && !isDone ? (
              <Link
                href={`/play/${node.playAssignmentId}`}
                transitionTypes={navForwardTransitionTypes}
                prefetch={false}
                className={cn(homePrimaryButton, 'w-full py-2.5 text-base')}
              >
                <Play className="h-4 w-4 fill-current" />
                Começar lição
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                disabled={isPending}
                className={cn(
                  isDone ? homeSecondaryButton : cn(homePrimaryButton, 'py-2.5 text-base'),
                  'w-full disabled:opacity-60'
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isDone ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                {isDone ? 'Estudar de novo' : 'Começar lição'}
              </button>
            )}
          </div>
          <Popover.Arrow className="fill-brand-dark" width={16} height={8} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function NextLevelMilestone({
  level,
  currentLevel,
}: {
  level: LearnerCefrLevel
  currentLevel: LearnerCefrLevel
}) {
  return (
    <section aria-label={`Próximo nível ${level}`} className="flex flex-col items-center gap-3 pb-2 pt-2">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-brand-dark/50 bg-bg-primary text-brand-secondary">
        <Lock className="h-6 w-6" strokeWidth={2.4} />
      </div>
      <div className="text-center">
        <p className="font-heading text-sm font-bold text-brand-dark">
          Próximo nível: {level} · {CEFR_LEVEL_LABELS[level]}
        </p>
        <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">
          Libera quando você passar na prova final do {currentLevel}
        </p>
      </div>
    </section>
  )
}
