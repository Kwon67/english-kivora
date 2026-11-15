'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLayoutEffect, useRef, useState, useTransition } from 'react'
import { Popover } from 'radix-ui'
import { Check, ChevronDown, ChevronRight, Info, Loader2, Lock, Play, RotateCcw, Trophy, X } from 'lucide-react'
import gsap from 'gsap'
import { startCurriculumPackAction } from '@/app/curriculum-actions'
import { CURRICULUM_STAGE_LABELS } from '@/features/curriculum/lib/curriculumDifficulty'
import { getDisplayPackDescription } from '@/features/study/lib/packDescription'
import { CEFR_LEVEL_LABELS, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { getVisibleNodes, type LearningPath as LearningPathData, type PathNode, type PathUnit } from '@/features/study/lib/learningPath'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { notify } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { homeSmallPillClass } from '@/lib/homeStyles'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return day && month ? `${day}/${month}` : isoDate
}

export default function LearningPath({ path }: { path: LearningPathData }) {
  const [openLevels, setOpenLevels] = useState<Set<LearnerCefrLevel>>(() => new Set([path.currentLevel]))
  const [expandedLevels, setExpandedLevels] = useState<Set<LearnerCefrLevel>>(() => new Set())
  const currentRef = useRef<HTMLLIElement | null>(null)

  function toggleIn(setter: typeof setOpenLevels, level: LearnerCefrLevel) {
    setter(previous => {
      const next = new Set(previous)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  return <div className="study-path">
    {path.units.map(unit => <PathUnitBlock key={unit.level} unit={unit} isCurrentLevel={unit.level === path.currentLevel}
      open={openLevels.has(unit.level)} expanded={expandedLevels.has(unit.level)}
      onToggle={() => toggleIn(setOpenLevels, unit.level)} onToggleExpanded={() => toggleIn(setExpandedLevels, unit.level)} currentRef={currentRef} />)}
    {path.nextLevel && <NextLevelMilestone level={path.nextLevel} currentLevel={path.currentLevel} />}
  </div>
}

function PathUnitBlock({ unit, isCurrentLevel, open, expanded, onToggle, onToggleExpanded, currentRef }: {
  unit: PathUnit; isCurrentLevel: boolean; open: boolean; expanded: boolean; onToggle: () => void; onToggleExpanded: () => void; currentRef: React.RefObject<HTMLLIElement | null>
}) {
  const selection = getVisibleNodes(unit.nodes, expanded)
  const recentDone = selection.visible.filter(node => node.state === 'done')
  // One recent lesson gives context without putting history ahead of the next action.
  const visible = expanded ? selection.visible : [...recentDone.slice(-1), ...selection.visible.filter(node => node.state !== 'done')]
  const hiddenDone = unit.doneCount - visible.filter(node => node.state === 'done').length
  const panelId = `learning-path-unit-${unit.level}`
  const listId = `${panelId}-lessons`
  const panelRef = useRef<HTMLDivElement>(null)
  const initialHidden = useRef(!open)
  const mounted = useRef(false)
  const reducedMotion = useHydratedReducedMotion()

  function pinHeight() {
    const panel = panelRef.current
    if (panel && !panel.hidden) panel.style.height = `${panel.getBoundingClientRect().height}px`
  }

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const first = !mounted.current
    mounted.current = true
    const fromHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height
    panel.hidden = false
    const rows = panel.querySelectorAll('.study-lesson')
    const complete = () => {
      panel.hidden = !open
      gsap.set(panel, { clearProps: 'height,overflow,opacity' })
      gsap.set(rows, { clearProps: 'transform,opacity' })
    }
    if (first || reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { complete(); return }
    const targetHeight = open ? panel.scrollHeight : 0
    const timeline = gsap.timeline({ onComplete: complete })
    timeline.fromTo(panel, { height: fromHeight, overflow: 'hidden' }, { height: targetHeight, duration: 0.32, ease: 'power3.inOut' })
    if (open) timeline.fromTo(rows, { y: 8, opacity: 0.35 }, { y: 0, opacity: 1, duration: 0.22, stagger: 0.025, clearProps: 'transform,opacity' }, 0.04)
    return () => { timeline.kill() }
  }, [open, expanded, reducedMotion])

  return <section className="study-unit" aria-label={`Nível ${unit.level}`}>
    <button type="button" onClick={() => { pinHeight(); onToggle() }} aria-expanded={open} aria-controls={panelId} className="study-unit-heading">
      <span><strong>{unit.level} · {unit.label}</strong><small>{unit.status === 'passed' ? 'Nível concluído' : `${unit.doneCount} de ${unit.nodes.length} lições concluídas`}</small></span>
      <ChevronDown size={20} className={open ? 'rotate-180' : undefined} aria-hidden="true" />
    </button>
    <div ref={panelRef} id={panelId} hidden={initialHidden.current} aria-hidden={!open} inert={!open} className="study-unit-body">
      {(hiddenDone > 0 || expanded) && <button type="button" onClick={() => { pinHeight(); onToggleExpanded() }} aria-expanded={expanded} aria-controls={listId} className="study-history-toggle">
        {expanded ? 'Recolher lições anteriores' : `Ver ${hiddenDone} ${hiddenDone === 1 ? 'lição concluída anterior' : 'lições concluídas anteriores'}`}
        <ChevronDown size={16} className={expanded ? 'rotate-180' : undefined} aria-hidden="true" />
      </button>}
      <ol id={listId} className="study-lesson-list">
        {visible.map(node => <li key={node.key} ref={node.state === 'current' ? currentRef : undefined}><PathNodeButton node={node} /></li>)}
      </ol>
      {selection.hiddenPending > 0 && <p className="study-upcoming-count">Mais {selection.hiddenPending} {selection.hiddenPending === 1 ? 'lição' : 'lições'} neste nível</p>}
      <LevelExamNode unit={unit} isCurrentLevel={isCurrentLevel} />
    </div>
  </section>
}

const STATE_LABEL: Record<PathNode['state'], string> = { done: 'Concluída', current: 'Sua próxima lição', open: 'Disponível' }

function PathNodeButton({ node }: { node: PathNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inFlight = useRef(false)
  const isCurrent = node.state === 'current'
  const isDone = node.state === 'done'
  const description = getDisplayPackDescription(node.packDescription, '')
  const actionLabel = isDone ? 'Revisar' : node.playAssignmentId ? 'Continuar' : 'Começar'

  function handleStart() {
    if (inFlight.current) return
    inFlight.current = true
    startTransition(async () => {
      try {
        const result = await startCurriculumPackAction(node.packId)
        if (!result.success) { notify.error(result.error); return }
        router.push(`/play/${result.assignmentId}`, { transitionTypes: navForwardTransitionTypes })
      } catch {
        notify.error('Não foi possível abrir a lição. Tente novamente.')
      } finally { inFlight.current = false }
    })
  }

  return <div className="study-lesson" data-state={node.state}>
    <span className="study-lesson-status" aria-hidden="true">{isDone ? <Check size={18} /> : <Play size={17} />}</span>
    <div className="study-lesson-copy">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild><button type="button" className="study-lesson-details" aria-label={`Detalhes de ${node.packName}`}><span className="study-lesson-title"><strong>{node.packName}</strong><Info size={13} aria-hidden="true" /></span><span className="study-lesson-label">{isCurrent && node.playAssignmentId ? 'Em andamento' : STATE_LABEL[node.state]}</span></button></Popover.Trigger>
        <Popover.Portal><Popover.Content side="bottom" sideOffset={8} collisionPadding={16} className="learning-path-popover z-50 w-[min(20rem,calc(100vw-2rem))] rounded-container border border-brand-border bg-white p-5 text-brand-dark">
          <div className="flex items-start justify-between gap-3"><span className={homeSmallPillClass}>{node.level}{node.category ? ` · ${node.category}` : ''}</span><Popover.Close aria-label="Fechar detalhes" className="inline-flex h-11 w-11 shrink-0 items-center justify-center"><X size={18} /></Popover.Close></div>
          <h3 className="mt-3 font-heading text-lg font-semibold">{node.packName}</h3>
          {node.stage && <p className="mt-2 text-xs font-semibold text-text-muted">{CURRICULUM_STAGE_LABELS[node.stage]} do {node.level}</p>}
          {description && <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>}
          <p className="mt-3 text-xs text-text-muted">{isDone ? `Concluída ${node.timesCompleted} ${node.timesCompleted === 1 ? 'vez' : 'vezes'}${node.lastStudiedDate ? ` · última em ${formatShortDate(node.lastStudiedDate)}` : ''}` : STATE_LABEL[node.state]}</p>
        </Popover.Content></Popover.Portal>
      </Popover.Root>
    </div>
    {node.playAssignmentId && !isDone ? <Link href={`/play/${node.playAssignmentId}`} transitionTypes={navForwardTransitionTypes} prefetch={false} className="study-lesson-action" aria-label={`${actionLabel}: ${node.packName}`}>{actionLabel}<ChevronRight size={16} aria-hidden="true" /></Link> :
      <button type="button" onClick={handleStart} disabled={isPending} className="study-lesson-action" aria-label={`${actionLabel}: ${node.packName}`} aria-busy={isPending}>{isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : isDone ? <RotateCcw size={15} aria-hidden="true" /> : null}{actionLabel}</button>}
  </div>
}

function LevelExamNode({
  unit,
  isCurrentLevel,
}: {
  unit: PathUnit
  isCurrentLevel: boolean
}) {
  const { exam, level } = unit
  const href = `/exam/${level}`

  if (exam.status === 'passed') {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-dark bg-brand-dark text-brand-accent">
          <Trophy className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <p className="font-heading text-sm font-bold text-brand-dark">
          Prova do {level} aprovada
        </p>
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
          ready
            ? 'bg-brand-accent text-brand-dark'
            : 'bg-bg-primary text-brand-secondary',
        )}
      >
        {ready ? (
          <span
            aria-hidden="true"
            className="learning-path-pulse pointer-events-none absolute -inset-2 rounded-full border-2 border-brand-dark/40"
          />
        ) : null}
        <Trophy className="h-7 w-7" strokeWidth={1.5} />
      </Link>
      <div>
        <p className="font-heading text-sm font-bold text-brand-dark">
          Prova final do {level}
        </p>
        <p className="mt-1 max-w-xs font-body text-xs font-semibold text-brand-secondary">
          {ready
            ? 'Você concluiu todas as lições. A prova exige 80% no total e 60% em cada formato.'
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

function NextLevelMilestone({
  level,
  currentLevel,
}: {
  level: LearnerCefrLevel
  currentLevel: LearnerCefrLevel
}) {
  return (
    <section
      aria-label={`Próximo nível ${level}`}
      className="flex flex-col items-center gap-3 pb-2 pt-2"
    >
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-brand-dark/50 bg-bg-primary text-brand-secondary">
        <Lock className="h-6 w-6" strokeWidth={1.5} />
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
