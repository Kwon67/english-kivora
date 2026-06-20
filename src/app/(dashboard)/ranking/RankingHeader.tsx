import Link from 'next/link'
import { ArrowLeft, Target, Trophy, Users } from 'lucide-react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface RankingHeaderProps {
  participantCount: number
  averageAccuracy: number
  myRank: number | null
}

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const ghostBtn =
  'group inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-border-muted/22 dark:border-border-accent/20 bg-card dark:bg-card px-4 py-2 text-sm font-bold text-text-muted dark:text-text-muted shadow-sm transition-colors hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary'
const cardSheen =
  'home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]'

export default function RankingHeader({ participantCount, averageAccuracy, myRank }: RankingHeaderProps) {
  return (
    <header className={`${glassTile} relative overflow-hidden p-6 sm:p-8 lg:p-10`}>
      <div className={cardSheen} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(227,236,194,0.35),transparent_60%)] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="mb-5 relative z-10">
        <Link
          href="/home"
          transitionTypes={navBackTransitionTypes}
          className={`${ghostBtn} min-h-10`}
        >
          <ArrowLeft className="h-4 w-4" />
          Início
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
        <div>
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Ranking' },
            ]}
            className="mb-4"
          />
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className={softKicker}>Ranking</span>
            <p className={softKicker}>Últimos 7 dias</p>
          </div>
          <h1 className="max-w-2xl font-montserrat text-4xl font-bold leading-tight text-text dark:text-text tracking-tight sm:text-5xl">
            Disputa semanal de foco
          </h1>
          <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-text-muted dark:text-text-muted">
            Pontuação calculada por acertos, precisão, sessões concluídas e sequência máxima. Use como leitura rápida de consistência, não só de volume.
          </p>

          <div className="mt-8">
            <a href="#classificacao" className={ghostBtn}>
              <Trophy className="h-4 w-4" />
              Ver classificação
            </a>
          </div>
        </div>

        <div className={`${glassTile} relative overflow-hidden p-5 sm:p-6`}>
          <div className={cardSheen} />
          <p className={`${softKicker} relative z-10`}>Resumo da semana</p>
          <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card p-4">
              <Users className="h-4 w-4 text-primary" />
              <p className="mt-3 text-2xl font-black text-text dark:text-text">{participantCount}</p>
              <p className="mt-1 text-xs font-semibold text-text-muted dark:text-text-muted">participantes</p>
            </div>
            <div className="rounded-xl border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card p-4">
              <Target className="h-4 w-4 text-primary" />
              <p className="mt-3 text-2xl font-black text-text dark:text-text">{averageAccuracy}%</p>
              <p className="mt-1 text-xs font-semibold text-text-muted dark:text-text-muted">precisão média</p>
            </div>
            <div className="rounded-xl border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card p-4">
              <Trophy className="h-4 w-4 text-primary" />
              <p className="mt-3 text-2xl font-black text-primary">{myRank ? `#${myRank}` : '—'}</p>
              <p className="mt-1 text-xs font-semibold text-text-muted dark:text-text-muted">sua posição</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}