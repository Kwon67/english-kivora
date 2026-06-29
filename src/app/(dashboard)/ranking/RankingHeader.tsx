import Link from 'next/link'
import { ArrowLeft, Target, Trophy, Users } from 'lucide-react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { LibraryBadge, accentBadge, ghostBtn } from '@/features/profile/lib/libraryUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface RankingHeaderProps {
  participantCount: number
  averageAccuracy: number
  myRank: number | null
}

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)] transition-all duration-300'
export default function RankingHeader({ participantCount, averageAccuracy, myRank }: RankingHeaderProps) {
  return (
    <header className={`${glassTile} relative overflow-hidden p-6 sm:p-8 lg:p-10`}>
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
            <LibraryBadge label="Ranking" />
            <span className="inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
              Últimos 7 dias
            </span>
          </div>
          <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight text-brand-dark sm:text-5xl">
            Disputa semanal de foco
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
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
          <div className="relative z-10">
            <LibraryBadge label="Resumo da semana" />
          </div>
          <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Users className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{participantCount}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">participantes</p>
            </div>
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Target className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{averageAccuracy}%</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">precisão média</p>
            </div>
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Trophy className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{myRank ? `#${myRank}` : '—'}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">sua posição</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
