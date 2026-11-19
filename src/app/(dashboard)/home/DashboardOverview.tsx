import Link from '@/components/navigation/WorkspaceLink'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, Check, Flame, MessageCircle, RotateCcw, Zap } from 'lucide-react'

type Props = {
  username: string | null; level: string; estimatedLevel?: string | null; completed: number; total: number; completionRate: number;
  streak: number; due: number; reviewed: number; pending: number; kicker: string;
  action: { href: string; label: string; title: string; description: string; icon?: LucideIcon };
  secondary?: ReactNode; plan: ReactNode;
}

function Progress({ value, label }: { value: number; label: string }) {
  return <div className="focus-progress-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span data-progress-fill style={{ width: `${value}%` }} /></div>
}

export default function DashboardOverview({ username, level, estimatedLevel, completed, total, completionRate, streak, due, reviewed, pending, kicker, action, secondary, plan }: Props) {
  const coursePercent = total > 0 ? Math.max(0, Math.min(100, Math.round(completed / total * 100))) : 0
  const dailyPercent = Math.max(0, Math.min(100, completionRate))
  const name = username?.trim().split(/\s+/)[0] || 'estudante'
  const CourseIcon = action.icon ?? BookOpen

  return <div className="focus-home courses-overview">
    <header className="focus-home-header">
      <div><p className="editorial-eyebrow">Seu espaço</p><h1>Vamos praticar, <span>{name}?</span></h1></div>
      <div className="focus-streak"><Flame size={18} aria-hidden="true" /><strong>{streak}</strong><span>{streak === 1 ? 'dia' : 'dias'} seguidos</span></div>
    </header>
    <div className="focus-main-grid">
      <section className="focus-session" aria-labelledby="next-step-title">
        <div className="focus-session-top"><span>{kicker}</span><CourseIcon size={24} aria-hidden="true" /></div>
        <h2 id="next-step-title">{action.title}</h2>
        <div className="focus-session-bottom">
          <Link href={action.href} prefetch={false} className="focus-session-action" data-testid="continue-learning"><span className="learning-course-action">{action.label}<ArrowRight size={20} aria-hidden="true" /></span></Link>
          <span className="focus-session-level">Trilha · {level}</span>
        </div>
      </section>
      <section className="focus-today" aria-labelledby="today-title">
        <div className="focus-section-label"><h2 id="today-title">Hoje</h2><span>{dailyPercent}%</span></div>
        <Progress value={dailyPercent} label="Plano diário concluído" />
        <dl className="focus-today-stats"><div><dt>Para revisar</dt><dd>{due}</dd></div><div><dt>Revisadas</dt><dd>{reviewed}</dd></div></dl>
        <div className="focus-plan">{plan}</div>
        {secondary && <div className="focus-secondary">{secondary}</div>}
      </section>
    </div>
    <p className="text-sm text-text-muted">Nível estimado: {estimatedLevel || 'em observação'}. A trilha mostra lições concluídas; evidências de uso do inglês são acompanhadas separadamente.</p>
    <section className="focus-practice" aria-labelledby="practice-title">
      <div className="focus-section-label"><h2 id="practice-title">Mude o ritmo</h2><Link href="/explore">Todas as lições <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <div className="focus-mode-grid">
        <Link href="/review" className="focus-mode" data-tone="review"><span className="focus-mode-icon"><RotateCcw size={22} /></span><span><strong>Revisar</strong><small>{due > 0 ? `${due} ${due === 1 ? 'frase esperando' : 'frases esperando'}` : 'Revisão em dia'}</small></span><ArrowUpRight size={19} aria-hidden="true" /></Link>
        <Link href="/tutor" className="focus-mode" data-tone="tutor"><span className="focus-mode-icon"><MessageCircle size={22} /></span><span><strong>Conversar</strong><small>Voz ou texto com IA</small></span><ArrowUpRight size={19} aria-hidden="true" /></Link>
        <Link href="/blitz" className="focus-mode" data-tone="vocabulary"><span className="focus-mode-icon"><Zap size={22} /></span><span><strong>Jogar Blitz</strong><small>Um desafio rápido</small></span><ArrowUpRight size={19} aria-hidden="true" /></Link>
      </div>
    </section>
    <section className="focus-path-summary" aria-label="Progresso na trilha">
      <span className="focus-level" aria-label={`Nível da trilha ${level}`}>{level}</span>
      <div className="focus-path-progress"><div><h2>Sua trilha</h2><span>{completed} / {total} lições</span></div><Progress value={coursePercent} label="Lições concluídas no nível" /></div>
      <a href="#trilha" className="focus-path-link">{pending > 0 ? 'Continuar' : 'Ver trilha'} <ArrowRight size={17} aria-hidden="true" /></a>
      <Link href="/history" className="focus-history-link"><Check size={16} aria-hidden="true" /> Ver progresso</Link>
    </section>
  </div>
}
