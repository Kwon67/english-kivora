'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Compass, Plus } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

interface StudyHeaderProps {
  activityCount: number
  pendingCount: number
}

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 h-11 text-xs font-bold text-on-primary border border-dashed border-primary-container/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] transition-all hover:bg-primary-dark active:scale-[0.985]'
const ghostBtn =
  'group inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-border-muted/22 dark:border-border-accent/20 bg-card dark:bg-card px-4 py-2 text-sm font-bold text-text-muted dark:text-text-muted shadow-sm transition-colors hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary'

export default function StudyHeader({ activityCount, pendingCount }: StudyHeaderProps) {
  return (
    <header className={`${glassTile} relative overflow-hidden p-6 sm:p-8 lg:p-10 group`}>
      <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(227,236,194,0.35),transparent_60%)] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-container/[0.03] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <Link
          href="/home"
          transitionTypes={navBackTransitionTypes}
          className={`${ghostBtn} min-h-10`}
        >
          <ArrowLeft className="h-4 w-4" />
          Início
        </Link>
        <Link
          href="/explore"
          transitionTypes={navForwardTransitionTypes}
          className={primaryBtn}
        >
          <Plus className="h-4 w-4" />
          Adicionar pack
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
        <div>
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Minha rotina' },
            ]}
            className="mb-4"
          />
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className={softKicker}>Plano de estudos</span>
            <p className={softKicker}>Rotina diária</p>
          </div>
          <h1 className="max-w-2xl font-montserrat text-4xl font-bold leading-tight text-text dark:text-text tracking-tight sm:text-5xl">
            Minha rotina
          </h1>
          <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-text-muted dark:text-text-muted">
            Escolha o que estudar hoje. Você pode adicionar packs do catálogo e remover apenas os que incluiu.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/explore" transitionTypes={navForwardTransitionTypes} className={primaryBtn}>
              <Compass className="h-4 w-4" />
              Explorar packs
            </Link>
            {pendingCount > 0 ? (
              <a href="#atividades" className={ghostBtn}>
                <BookOpen className="h-4 w-4" />
                {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
              </a>
            ) : null}
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className={`${glassTile} relative z-10 overflow-hidden p-5 sm:p-6 hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/30`}
        >
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <p className={`${softKicker} text-[10px] uppercase font-black tracking-wider`}>Hoje</p>
              <h2 className="mt-2 font-montserrat text-xl font-bold text-text dark:text-text sm:text-2xl leading-snug">
                {activityCount} {activityCount === 1 ? 'atividade' : 'atividades'}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-text-muted dark:text-text-muted">
                {pendingCount > 0
                  ? `${pendingCount} ${pendingCount === 1 ? 'sessão aguardando' : 'sessões aguardando'} para você começar.`
                  : activityCount > 0
                    ? 'Todas as sessões de hoje foram concluídas.'
                    : 'Adicione packs do catálogo para montar sua rotina.'}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary shadow-sm ring-1 ring-border-muted/18 bg-primary/12 dark:ring-border-accent/18">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-5 rounded-xl border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card p-4 shadow-sm relative overflow-hidden flex items-center justify-center min-h-[140px]">
            <m.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-full max-w-[200px]"
            >
              <Image
                src="/images/home/undraw-studying.svg"
                alt="Ilustração de rotina de estudos"
                width={300}
                height={240}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain filter drop-shadow-sm select-none"
              />
            </m.div>
          </div>
        </m.div>
      </div>
    </header>
  )
}